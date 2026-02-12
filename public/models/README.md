# MediaPipe Models

## Face Landmarker Model

このディレクトリには、MediaPipe Face Landmarkerのモデルファイルが配置されます。

### モデルファイルの取得方法

MediaPipeの公式モデルは以下のCDN URLから利用可能です：

```
https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
```

アプリケーションでは、このCDN URLを直接使用することを推奨します。
ローカルにダウンロードする場合は、上記URLからダウンロードして
このディレクトリに`face_landmarker.task`として配置してください。

### ダウンロードコマンド（オプション）

```bash
curl -o public/models/face_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
```

## 使用方法

実装では環境変数やビルド時の設定で、CDNとローカルファイルを切り替え可能にしています。
