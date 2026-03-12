'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import GridAgentLabel from './GridAgentLabel'
import { GRID_POINTS, getGridVisualization } from '../lib/grid-paths'

/**
 * GridOffice - 田字格网格办公室组件（主页版）
 * Agent 在 3x3 网格的9个点之间随机移动
 */
export default function GridOffice() {
  const [mounted, setMounted] = useState(false)
  const [agents, setAgents] = useState([])
  const [showGrid, setShowGrid] = useState(true)
  const [loading, setLoading] = useState(true)
  
  // 初始化
  useEffect(() => {
    setMounted(true)
    
    // 加载 agent 配置
    fetch('/api/config')
      .then(r => r.json())
      .then(config => {
        const rawAgents = config.agents || {}
        const agentList = Array.isArray(rawAgents)
          ? rawAgents.map((a, i) => ({ 
              ...a, 
              id: a.id || a.name || `agent-${i}`, 
              name: a.name || `Agent ${i + 1}`,
              role: a.role || 'Agent',
              color: a.color || '#00f5ff',
              emoji: a.emoji || '🤖',
              status: 'online' 
            }))
          : Object.entries(rawAgents).map(([id, data], i) => ({ 
              id, 
              ...data, 
              name: data.name || data.displayName || id,
              role: data.role || 'Agent',
              color: data.color || '#00f5ff',
              emoji: data.emoji || '🤖',
              status: 'online' 
            }))
        
        setAgents(agentList)
        setLoading(false)
      })
      .catch(e => {
        console.error('Failed to load config:', e)
        // 使用默认 agents
        setAgents([
          { id: 'main', name: 'Main', role: 'Orchestrator', color: '#ff006e', emoji: '🤖', status: 'online' },
          { id: 'dev', name: 'Dev', role: 'Developer', color: '#00f5ff', emoji: '💻', status: 'online' },
          { id: 'design', name: 'Design', role: 'Designer', color: '#ffbe0b', emoji: '🎨', status: 'online' },
        ])
        setLoading(false)
      })
  }, [])
  
  // 网格可视化
  const grid = getGridVisualization()
  
  if (!mounted) {
    return <div className="relative w-full rounded-xl bg-gray-900" style={{ aspectRatio: '1 / 1' }} />
  }
  
  return (
    <div 
      className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700"
      style={{ aspectRatio: '1 / 1', maxHeight: '500px' }}
    >
      {/* 加载状态 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="text-cyan-400 text-sm">加载 Agents...</div>
        </div>
      )}
      
      {/* 田字格网格线 */}
      {showGrid && (
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {/* 主要网格线（田字格） */}
          {grid.horizontal.map((line, i) => (
            <line
              key={`h-${i}`}
              x1={`${line.x1}%`}
              y1={`${line.y1}%`}
              x2={`${line.x2}%`}
              y2={`${line.y2}%`}
              stroke="rgba(0, 245, 255, 0.3)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          ))}
          {grid.vertical.map((line, i) => (
            <line
              key={`v-${i}`}
              x1={`${line.x1}%`}
              y1={`${line.y1}%`}
              x2={`${line.x2}%`}
              y2={`${line.y2}%`}
              stroke="rgba(0, 245, 255, 0.3)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          ))}
          
          {/* 9个交叉点标记 */}
          {GRID_POINTS.map((point) => (
            <g key={point.id}>
              <circle
                cx={`${point.x}%`}
                cy={`${point.y}%`}
                r="3"
                fill="rgba(0, 245, 255, 0.2)"
                stroke="rgba(0, 245, 255, 0.5)"
                strokeWidth="1"
              />
              <text
                x={`${point.x}%`}
                y={`${point.y + 2.5}%`}
                textAnchor="middle"
                fill="rgba(0, 245, 255, 0.4)"
                fontSize="8"
              >
                {point.id}
              </text>
            </g>
          ))}
        </svg>
      )}
      
      {/* Agent 标签 - 在网格点上移动 */}
      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        {agents.map((agent) => (
          <GridAgentLabel
            key={agent.id}
            agent={agent}
          />
        ))}
      </div>
      
      {/* 控制按钮 - 右上角 */}
      <div className="absolute top-3 right-3 z-30">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className="px-2 py-1 rounded bg-gray-900/70 border border-cyan-500/50 backdrop-blur-sm text-[10px] text-cyan-400 hover:bg-cyan-900/30 transition-colors"
        >
          {showGrid ? '🔲 隐藏网格' : '⊞ 显示网格'}
        </button>
      </div>
      
      {/* 底部说明 */}
      <div className="absolute bottom-3 left-3 right-3 z-30">
        <div className="px-2 py-1.5 rounded bg-gray-900/80 border border-gray-600/50 backdrop-blur-sm">
          <p className="text-[9px] text-gray-400 text-center">
            🤖 {agents.length} agents · 田字格 3×3 网格 · 3秒平滑移动
          </p>
        </div>
      </div>
    </div>
  )
}
