import { useEffect, useRef, useState } from 'react'
import { useCamera } from './hooks/useCamera'
import { useDeviceType } from './hooks/useDeviceType'
import { CanvasRenderer } from './engines/renderer/CanvasRenderer'
import type { Expression } from './types/expression'
import './styles/main.css'

function App() {
  const { videoRef, isReady, error, startCamera } = useCamera()
  const deviceType = useDeviceType()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<CanvasRenderer | null>(null)
  const [currentExpression, setCurrentExpression] = useState<Expression>('neutral')

  // レンダラーの初期化
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current)
    }
  }, [])

  // 表情のレンダリング
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.render(currentExpression, deviceType)
    }
  }, [currentExpression, deviceType])

  // 表情切り替えのデモ（3秒ごと）
  useEffect(() => {
    const expressions: Expression[] = ['neutral', 'smile', 'surprised', 'blink']
    let index = 0

    const interval = setInterval(() => {
      index = (index + 1) % expressions.length
      setCurrentExpression(expressions[index])
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // 表情名を日本語に変換
  const getExpressionName = (expr: Expression): string => {
    const names: Record<Expression, string> = {
      neutral: '通常',
      smile: '笑顔',
      surprised: '驚き',
      blink: 'まばたき',
      sad: '悲しみ',
      angry: '怒り',
      confused: '困惑',
      smug: '得意気',
      questioning: '疑問',
      embarrassed: '照れ'
    }
    return names[expr] || expr
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      gap: '20px'
    }}>
      <h1 style={{ color: '#00FF00', fontSize: '24px', marginBottom: '20px' }}>
        璃奈ちゃんボード風 デジタルお面
      </h1>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* カメラプレビュー */}
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>カメラプレビュー</h2>
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
          {error && <p style={{ color: '#FF0000', marginTop: '10px' }}>{error}</p>}
        </div>

        {/* ドット絵表示 */}
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>
            現在の表情: {getExpressionName(currentExpression)}
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
          デバイス: {deviceType === 'smartphone' ? 'スマートフォン（目のみ表示）' : 'タブレット（目+口表示）'}
        </p>
        <p style={{ fontSize: '12px', color: '#888' }}>
          ※ デモモード: 表情は3秒ごとに自動切り替えされます
        </p>
      </div>
    </div>
  )
}

export default App
