'use client'

import { motion, useAnimation } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { 
  getRandomSpawnPoint, 
  getNextTargetPoint, 
  calculateMoveDuration,
  GRID_POINTS 
} from '../lib/grid-paths'

/**
 * AgentGridSprite - 田字格网格移动 Agent 组件
 * Agent 在 3x3 网格的9个点之间随机移动
 */
export default function AgentGridSprite({ agent, onClick, isSelected }) {
  const controls = useAnimation()
  const [currentPoint, setCurrentPoint] = useState(null)
  const [isMoving, setIsMoving] = useState(false)
  const [currentThought, setCurrentThought] = useState(0)
  
  // 初始化：随机选择一个出生点
  useEffect(() => {
    const spawnPoint = getRandomSpawnPoint()
    setCurrentPoint(spawnPoint)
  }, [agent.id])
  
  // 循环移动逻辑
  const moveToNextPoint = useCallback(async () => {
    if (!currentPoint || isMoving) return
    
    setIsMoving(true)
    
    // 随机选择下一个目标点
    const nextPoint = getNextTargetPoint(currentPoint.id)
    const duration = calculateMoveDuration(currentPoint, nextPoint, 20)
    
    // 执行移动动画
    await controls.start({
      left: `${nextPoint.x}%`,
      top: `${nextPoint.y}%`,
      transition: {
        duration,
        ease: "easeInOut",
      }
    })
    
    setCurrentPoint(nextPoint)
    setIsMoving(false)
    
    // 随机停留一段时间后再移动
    const pauseTime = 1000 + Math.random() * 2000 // 1-3秒
    setTimeout(moveToNextPoint, pauseTime)
    
  }, [currentPoint, isMoving, controls])
  
  // 开始移动循环
  useEffect(() => {
    if (!currentPoint) return
    
    // 初始停留后第一次移动
    const initialDelay = 500 + Math.random() * 1000
    const timer = setTimeout(moveToNextPoint, initialDelay)
    
    return () => clearTimeout(timer)
  }, [currentPoint, moveToNextPoint])
  
  // 思绪轮播
  useEffect(() => {
    const thoughtInterval = setInterval(() => {
      setCurrentThought(prev => (prev + 1) % agent.thoughts.length)
    }, 8000)
    
    return () => clearInterval(thoughtInterval)
  }, [agent.thoughts.length])
  
  // 如果没有当前点，显示加载状态
  if (!currentPoint) {
    return null
  }
  
  return (
    <motion.div
      className="absolute cursor-pointer group"
      style={{
        left: `${currentPoint.x}%`,
        top: `${currentPoint.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      animate={controls}
      onClick={() => onClick?.(agent)}
      whileHover={{ scale: 1.15 }}
      initial={{ opacity: 0, scale: 0 }}
      transition={{ 
        opacity: { duration: 0.5 },
        scale: { duration: 0.5, type: "spring", stiffness: 200 }
      }}
    >
      {/* Agent 容器 */}
      <div className="relative">
        {/* 移动状态指示器 */}
        <motion.div
          className="absolute -top-2 -right-2 w-3 h-3 rounded-full z-10"
          style={{ 
            background: isMoving ? '#ffd700' : '#39ff14',
            boxShadow: `0 0 10px ${isMoving ? '#ffd700' : '#39ff14'}` 
          }}
          animate={isMoving ? { 
            scale: [1, 1.4, 1],
            opacity: [1, 0.7, 1]
          } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        
        {/* Agent 像素风格头像 */}
        <motion.div
          className="relative"
          animate={isMoving ? { 
            y: [0, -2, 0],
          } : {}}
          transition={{ duration: 0.3, repeat: isMoving ? Infinity : 0 }}
        >
          <div 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center text-2xl relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${agent.color}44, ${agent.color}11)`,
              border: `2px solid ${agent.color}`,
              boxShadow: isSelected 
                ? `0 0 20px ${agent.color}, 0 0 40px ${agent.color}44`
                : `0 0 10px ${agent.color}44`,
            }}
          >
            {/* 扫描线效果 */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
              }}
            />
            <span className="relative z-10">{agent.emoji}</span>
            
            {/* 移动时的方向指示 */}
            {isMoving && (
              <motion.div
                className="absolute bottom-0.5 right-0.5 text-[10px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                👣
              </motion.div>
            )}
          </div>
          
          {/* 工位/站立点标识 */}
          <div 
            className="w-14 h-3 -mt-1 mx-auto rounded-sm"
            style={{
              background: `linear-gradient(180deg, ${agent.color}33, transparent)`,
              border: `1px solid ${agent.color}22`,
            }}
          />
        </motion.div>
        
        {/* 姓名标签 */}
        <motion.div
          className="mt-1 text-center"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div 
            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
            style={{
              background: `${agent.color}22`,
              border: `1px solid ${agent.color}`,
              color: agent.color,
              textShadow: `0 0 8px ${agent.color}`,
            }}
          >
            {agent.name}
          </div>
          <div className="text-[9px] mt-0.5 opacity-60" style={{ color: agent.color }}>
            {agent.role}
          </div>
        </motion.div>
        
        {/* 当前位置指示（调试/美观） */}
        <motion.div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] opacity-40"
          style={{ color: agent.color }}
        >
          {currentPoint.id}
        </motion.div>
        
        {/* 思绪气泡 - 悬停显示 */}
        <motion.div
          className="absolute -top-14 left-1/2 -translate-x-1/2 w-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ zIndex: 100 }}
        >
          <div 
            className="rounded-lg p-2 text-[10px] leading-tight"
            style={{ 
              background: 'rgba(10, 10, 26, 0.95)',
              border: `1px solid ${agent.color}`,
              boxShadow: `0 0 15px ${agent.color}44`
            }}
          >
            <p className="text-gray-300 italic">"{agent.thoughts[currentThought]}"</p>
          </div>
          {/* 气泡尾巴 */}
          <div className="flex justify-center gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: agent.color + '66' }} />
            <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: agent.color + '44' }} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
