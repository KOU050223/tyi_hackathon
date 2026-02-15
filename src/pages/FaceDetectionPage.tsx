import { useEffect, useRef, useState } from 'react'
import { useCamera } from '@/hooks/useCamera'
import { useDeviceType } from '@/hooks/useDeviceType'
import { useFaceDetection } from '@/hooks/useFaceDetection'
import { CanvasRenderer } from '@/engines/renderer/CanvasRenderer'
import {
  detectExpression,
  getExpressionLabel,
} from '@/utils/expressionDetector'
import { convertBlendshapes } from '@/utils/blendshapeConverter'
import type { Expression } from '@/types/expression'

export default function FaceDetectionPage() {
  const { videoRef, isReady, error: cameraError, startCamera } = useCamera()
  const deviceType = useDeviceType()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<CanvasRenderer | null>(null)
  const [currentExpression, setCurrentExpression] =
    useState<Expression>('neutral')
  const [confidence, setConfidence] = useState<number>(0)

  const {
    result: faceResult,
    isInitializing,
    isInitialized,
    error: faceError,
    isDetecting,
  } = useFaceDetection({
    videoRef,
    enabled: isReady,
    onDetection: result => {
      if (result.detected && result.blendshapes) {
        const blendshapes = convertBlendshapes(result.blendshapes)
        const { expression, confidence } = detectExpression(blendshapes)
        setCurrentExpression(expression)
        setConfidence(confidence)
      }
    },
    onError: err => {
      console.error('Face detection error:', err)
    },
  })

  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current)
    }
  }, [])

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.render(currentExpression, deviceType)
    }
  }, [currentExpression, deviceType])

  const error = cameraError || faceError?.message

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
        padding: '20px',
        gap: '20px',
      }}
    >
      <h1 style={{ color: '#00FF00', fontSize: '24px', marginBottom: '20px' }}>
        璃奈ちゃんボード風 デジタルお面
      </h1>

      <div
        style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>
            カメラプレビュー
          </h2>
          <video
            ref={videoRef}
            style={{
              width: '320px',
              height: '240px',
              border: '2px solid #00FF00',
              display: isReady ? 'block' : 'none',
            }}
          />
          {!isReady && (
            <button
              onClick={startCamera}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#00FF00',
                color: '#000',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              カメラを起動
            </button>
          )}
          {error && (
            <p style={{ color: '#FF0000', marginTop: '10px' }}>{error}</p>
          )}
          {isInitializing && (
            <p style={{ color: '#FFFF00', marginTop: '10px' }}>
              MediaPipe初期化中...
            </p>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>
            現在の表情: {getExpressionLabel(currentExpression)}
            {confidence > 0 && (
              <span
                style={{ fontSize: '14px', color: '#888', marginLeft: '10px' }}
              >
                ({Math.round(confidence * 100)}%)
              </span>
            )}
          </h2>
          <canvas
            ref={canvasRef}
            style={{
              border: '2px solid #00FF00',
              imageRendering: 'pixelated',
            }}
            className="pixel-art"
          />
        </div>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#aaa' }}>
          デバイス:{' '}
          {deviceType === 'smartphone'
            ? 'スマートフォン（目のみ表示）'
            : 'タブレット（目+口表示）'}
        </p>
        <p style={{ fontSize: '12px', color: '#888' }}>
          {isDetecting ? (
            <>リアルタイム表情認識中</>
          ) : isInitialized ? (
            <>検出待機中</>
          ) : (
            <>カメラを起動して表情認識を開始</>
          )}
        </p>
        {faceResult && !faceResult.detected && isReady && (
          <p style={{ fontSize: '12px', color: '#FF6600' }}>
            顔が検出されていません
          </p>
        )}
      </div>
    </div>
  )
}
