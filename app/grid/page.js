import GridOffice from '../../components/GridOffice'

/**
 * 田字格网格办公室演示页面
 * 展示 Agent 在 3x3 网格 9 个点之间的随机移动
 */
export default function GridPage() {
  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
            🏢 田字格网格办公室
          </h1>
          <p className="text-sm text-gray-400">
            Agent 在 3×3 网格的 9 个交叉点间随机移动 · 无需 Claude API
          </p>
        </div>
        
        {/* 网格办公室 */}
        <GridOffice />
        
        {/* 说明 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">🎯 9个路径点</h3>
            <p className="text-xs text-gray-400">
              田字格形成 3×3 网格，9个交叉点作为 Agent 移动路径点
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
            <h3 className="text-sm font-bold text-purple-400 mb-2">🎲 随机移动</h3>
            <p className="text-xs text-gray-400">
              Agent 随机在 9 个点之一出生，然后在相邻点间来回移动
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
            <h3 className="text-sm font-bold text-green-400 mb-2">⚡ 无需 API</h3>
            <p className="text-xs text-gray-400">
              纯前端实现，不依赖 Claude Vision 或其他 AI API
            </p>
          </div>
        </div>
        
        {/* 返回链接 */}
        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="inline-block px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
          >
            ← 返回主办公室
          </a>
        </div>
      </div>
    </main>
  )
}
