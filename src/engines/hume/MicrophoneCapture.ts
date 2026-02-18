export interface MicrophoneCaptureConfig {
  /** 音声チャンクの送信間隔(ms) デフォルト: 500 */
  chunkInterval?: number;
  /** サンプルレート デフォルト: 16000 */
  sampleRate?: number;
  /** 無音判定の閾値(RMS) デフォルト: 0.01 */
  silenceThreshold?: number;
  /** 音声チャンク送出コールバック */
  onAudioChunk: (base64Chunk: string) => void;
  /** 発話状態変化コールバック */
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

const DEFAULT_CHUNK_INTERVAL = 500;
const DEFAULT_SAMPLE_RATE = 16000;
const DEFAULT_SILENCE_THRESHOLD = 0.01;

/**
 * マイク音声をキャプチャし、Base64エンコードされたWAVチャンクとして送出する。
 * VAD（無音検知）機能付き。
 */
export class MicrophoneCapture {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isSpeaking = false;
  private audioBuffer: Float32Array[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;

  private readonly chunkInterval: number;
  private readonly sampleRate: number;
  private readonly silenceThreshold: number;
  private readonly onAudioChunk: (base64: string) => void;
  private readonly onSpeakingChange?: (isSpeaking: boolean) => void;

  constructor(config: MicrophoneCaptureConfig) {
    this.chunkInterval = config.chunkInterval ?? DEFAULT_CHUNK_INTERVAL;
    this.sampleRate = config.sampleRate ?? DEFAULT_SAMPLE_RATE;
    this.silenceThreshold = config.silenceThreshold ?? DEFAULT_SILENCE_THRESHOLD;
    this.onAudioChunk = config.onAudioChunk;
    this.onSpeakingChange = config.onSpeakingChange;
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: this.sampleRate,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    this.source = this.audioContext.createMediaStreamSource(this.stream);

    // ScriptProcessorNode (bufferSize: 4096)
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      const copy = new Float32Array(inputData.length);
      copy.set(inputData);
      this.audioBuffer.push(copy);

      // VAD: RMS計算
      const rms = this.calculateRMS(inputData);
      const speaking = rms > this.silenceThreshold;
      if (speaking !== this.isSpeaking) {
        this.isSpeaking = speaking;
        this.onSpeakingChange?.(speaking);
      }
    };

    this.source.connect(this.processor);
    // TODO: ScriptProcessorNodeは非推奨。AudioWorkletNodeへの移行を検討
    // destination直結は音声フィードバックのリスクがあるため、無音ノードを経由
    const silentGain = this.audioContext.createGain();
    silentGain.gain.value = 0;
    this.processor.connect(silentGain);
    silentGain.connect(this.audioContext.destination);

    console.log("[Mic] Microphone capture started, sampleRate:", this.audioContext.sampleRate);

    // 定期的にバッファをフラッシュしてチャンク送出
    this.intervalId = setInterval(() => {
      this.flushBuffer();
    }, this.chunkInterval);
  }

  async stop(): Promise<void> {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.audioBuffer = [];
    if (this.isSpeaking) {
      this.isSpeaking = false;
      this.onSpeakingChange?.(false);
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  private flushBuffer(): void {
    if (this.audioBuffer.length === 0) return;

    // バッファ結合
    const totalLength = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const buf of this.audioBuffer) {
      merged.set(buf, offset);
      offset += buf.length;
    }
    this.audioBuffer = [];

    // Float32 PCM → 16bit PCM → WAV → Base64
    const wav = this.encodeWAV(merged);
    const base64 = this.arrayBufferToBase64(wav);
    this.onAudioChunk(base64);
  }

  private calculateRMS(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  private encodeWAV(samples: Float32Array): ArrayBuffer {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (this.sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = samples.length * 2; // 16bit = 2 bytes per sample
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // WAV header
    this.writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, "WAVE");
    this.writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    this.writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);

    // PCM data (Float32 → Int16)
    let writeOffset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(writeOffset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      writeOffset += 2;
    }

    return buffer;
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const blockSize = 0x8000;
    const blocks: string[] = [];
    for (let i = 0; i < bytes.length; i += blockSize) {
      const block = bytes.subarray(i, Math.min(i + blockSize, bytes.length));
      blocks.push(String.fromCharCode(...block));
    }
    return btoa(blocks.join(""));
  }
}
