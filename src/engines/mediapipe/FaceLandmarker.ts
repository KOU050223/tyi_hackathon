import {
  FaceLandmarker as MPFaceLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision'
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision'
import type { FaceBlendshapes } from './blendshapes'

/**
 * MediaPipe Face Landmarkerの初期化オプション
 */
export interface FaceLandmarkerOptions {
  /**
   * モデルファイルのパス
   * デフォルト: CDN URL
   */
  modelAssetPath?: string

  /**
   * 検出する顔の最大数
   * デフォルト: 1
   */
  numFaces?: number

  /**
   * 最小検出信頼度（0.0～1.0）
   * デフォルト: 0.5
   */
  minDetectionConfidence?: number

  /**
   * 最小追跡信頼度（0.0～1.0）
   * デフォルト: 0.5
   */
  minTrackingConfidence?: number

  /**
   * Blendshapesの出力を有効化
   * デフォルト: true
   */
  outputFaceBlendshapes?: boolean
}

/**
 * 顔検出結果
 */
export interface FaceDetectionResult {
  /**
   * Blendshapesデータ（52種類の表情パラメータ）
   */
  blendshapes?: FaceBlendshapes

  /**
   * 顔が検出されたかどうか
   */
  detected: boolean

  /**
   * 元のMediaPipe検出結果（詳細情報用）
   */
  rawResult?: FaceLandmarkerResult
}

/**
 * MediaPipe Face Landmarkerのラッパークラス
 * ビデオストリームからの顔検出とBlendshapes取得を提供
 */
export class FaceLandmarker {
  private faceLandmarker: MPFaceLandmarker | null = null
  private lastVideoTime = -1
  private options: Required<FaceLandmarkerOptions>

  constructor(options: FaceLandmarkerOptions = {}) {
    this.options = {
      modelAssetPath:
        options.modelAssetPath ||
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      numFaces: options.numFaces ?? 1,
      minDetectionConfidence: options.minDetectionConfidence ?? 0.5,
      minTrackingConfidence: options.minTrackingConfidence ?? 0.5,
      outputFaceBlendshapes: options.outputFaceBlendshapes ?? true,
    }
  }

  /**
   * MediaPipe Face Landmarkerを初期化
   * @throws {Error} 初期化に失敗した場合
   */
  async initialize(): Promise<void> {
    try {
      // MediaPipe Wasmファイルの読み込み
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'
      )

      // Face Landmarkerの作成
      this.faceLandmarker = await MPFaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: this.options.modelAssetPath,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: this.options.numFaces,
        minFaceDetectionConfidence: this.options.minDetectionConfidence,
        minFacePresenceConfidence: this.options.minDetectionConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence,
        outputFaceBlendshapes: this.options.outputFaceBlendshapes,
        outputFacialTransformationMatrixes: false,
      })
    } catch (error) {
      throw new Error(
        `Failed to initialize MediaPipe Face Landmarker: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * ビデオフレームから顔を検出
   * @param video ビデオ要素
   * @returns 顔検出結果
   * @throws {Error} Face Landmarkerが初期化されていない場合
   */
  detectFromVideo(video: HTMLVideoElement): FaceDetectionResult {
    if (!this.faceLandmarker) {
      throw new Error(
        'FaceLandmarker is not initialized. Call initialize() first.'
      )
    }

    // ビデオが再生されていない場合は空の結果を返す
    if (video.currentTime === this.lastVideoTime) {
      return { detected: false }
    }
    this.lastVideoTime = video.currentTime

    try {
      // 顔検出を実行
      const results = this.faceLandmarker.detectForVideo(
        video,
        performance.now()
      )

      // 結果の解析
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        return {
          detected: true,
          blendshapes: results.faceBlendshapes[0] as FaceBlendshapes,
          rawResult: results,
        }
      }

      return { detected: false }
    } catch (error) {
      console.error('Face detection error:', error)
      return { detected: false }
    }
  }

  /**
   * リソースを解放
   */
  dispose(): void {
    if (this.faceLandmarker) {
      this.faceLandmarker.close()
      this.faceLandmarker = null
    }
    this.lastVideoTime = -1
  }

  /**
   * 初期化済みかどうかを確認
   */
  isInitialized(): boolean {
    return this.faceLandmarker !== null
  }
}
