import type { HumeEmotion } from "@/utils/humeEmotionMapper";

export interface HumeProsodyResult {
  emotions: HumeEmotion[];
  timestamp: number;
}

export interface HumeStreamConfig {
  apiKey: string;
  onResult: (result: HumeProsodyResult) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

const HUME_WS_URL = "wss://api.hume.ai/v0/stream/models";
const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 1000;

/**
 * Hume AI Expression Measurement API へのWebSocket接続を管理する。
 * prosodyモデルで音声の韻律から感情を解析する。
 */
export class HumeStreamClient {
  private socket: WebSocket | null = null;
  private config: HumeStreamConfig;
  private connected = false;
  private reconnectDelay = INITIAL_RECONNECT_DELAY;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  constructor(config: HumeStreamConfig) {
    this.config = config;
  }

  connect(): void {
    this.shouldReconnect = true;
    this.doConnect();
  }

  sendAudio(base64Audio: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      if (import.meta.env.DEV) {
        console.log("[Hume] sendAudio skipped: socket not open", this.socket?.readyState);
      }
      return;
    }

    const message = JSON.stringify({
      models: { prosody: {} },
      data: base64Audio,
    });

    if (import.meta.env.DEV) {
      console.log("[Hume] Sending audio chunk, base64 length:", base64Audio.length);
    }

    this.socket.send(message);
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setConnected(false);
  }

  isConnected(): boolean {
    return this.connected;
  }

  private doConnect(): void {
    const url = `${HUME_WS_URL}?apikey=${this.config.apiKey}`;

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      if (import.meta.env.DEV) {
        console.log("[Hume] WebSocket connected");
      }
      this.setConnected(true);
      this.reconnectDelay = INITIAL_RECONNECT_DELAY;
    };

    this.socket.onmessage = (event) => {
      try {
        if (import.meta.env.DEV) {
          const raw = event.data as string;
          console.log("[Hume] Received message:", raw.substring(0, 200));
        }
        const data = JSON.parse(event.data as string) as HumeWSResponse;
        this.handleResponse(data);
      } catch (err) {
        this.config.onError?.(new Error(`Failed to parse Hume response: ${err}`));
      }
    };

    this.socket.onerror = (event) => {
      if (import.meta.env.DEV) {
        console.error("[Hume] WebSocket error:", event);
      }
      this.config.onError?.(new Error(`WebSocket error: ${event}`));
    };

    this.socket.onclose = (event) => {
      if (import.meta.env.DEV) {
        console.log("[Hume] WebSocket closed:", event.code, event.reason);
      }
      this.setConnected(false);
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };
  }

  private handleResponse(data: HumeWSResponse): void {
    if (data?.prosody && "warning" in data.prosody) return;

    const predictions = data?.prosody?.predictions;
    if (!predictions || predictions.length === 0) return;

    const emotions: HumeEmotion[] = predictions[0].emotions.map((e) => ({
      name: e.name,
      score: e.score,
    }));

    if (import.meta.env.DEV) {
      const top5 = [...emotions].sort((a, b) => b.score - a.score).slice(0, 5);
      console.log(
        "[Hume] Top emotions:",
        top5.map((e) => `${e.name}: ${e.score.toFixed(3)}`).join(", "),
      );
    }

    this.config.onResult({
      emotions,
      timestamp: Date.now(),
    });
  }

  private setConnected(connected: boolean): void {
    if (this.connected !== connected) {
      this.connected = connected;
      this.config.onConnectionChange?.(connected);
    }
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.doConnect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
  }
}

/** Hume WebSocketレスポンスの型定義 */
interface HumeWSResponse {
  prosody?: {
    predictions: {
      emotions: { name: string; score: number }[];
    }[];
  };
}
