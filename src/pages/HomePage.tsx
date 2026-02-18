import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen text-[#F5F0FF] font-mono">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[#E66CBC] mb-3">璃奈ちゃんボード</h1>
          <p className="text-[#A89BBE] text-sm">モードを選択してください</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* 表情認識モード */}
          <Link
            to="/face"
            className="block border border-[#E66CBC]/30 bg-[#231834] rounded-lg p-6 hover:border-[#E66CBC] hover:bg-[#2A1F3E] transition-all group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#E66CBC]/20 flex items-center justify-center group-hover:bg-[#E66CBC]/30 transition-colors">
                <svg
                  className="w-8 h-8 text-[#E66CBC]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-[#F5F0FF] mb-2">表情認識モード</h2>
                <p className="text-sm text-[#A89BBE]">
                  カメラで顔の表情をリアルタイムに認識して、璃奈ちゃんボードに反映します
                </p>
              </div>
            </div>
          </Link>

          {/* 音声感情モード */}
          <Link
            to="/voice"
            className="block border border-[#7DD3E8]/30 bg-[#231834] rounded-lg p-6 hover:border-[#7DD3E8] hover:bg-[#2A1F3E] transition-all group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#7DD3E8]/20 flex items-center justify-center group-hover:bg-[#7DD3E8]/30 transition-colors">
                <svg
                  className="w-8 h-8 text-[#7DD3E8]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-[#F5F0FF] mb-2">音声感情モード</h2>
                <p className="text-sm text-[#A89BBE]">
                  声のトーンや感情をAIで解析して、璃奈ちゃんボードに反映します
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
