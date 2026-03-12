'use client'

import { motion, useAnimation } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { 
  getRandomSpawnPoint, 
  getNextTargetPoint, 
} from '../lib/grid-paths'

/**
 * GridAgentLabel - 网格平滑移动的 Agent 标签
 * 类似 Unity 协程，3秒平滑移动到相邻点
 */
export default function GridAgentLabel({ agent }) {
  // 当前网格点 ID
  const [currentPointId, setCurrentPointId] = useState(() => getRandomSpawnPoint().id)
  const [isMoving, setIsMoving] = useState(false)
  const [targetPointId, setTargetPointId] = useState(null)
  
  // 动画控制器 - 类似 Unity 的 Animator
  const controls = useAnimation()
  
  // 网格点坐标映射 (百分比)
  const pointMap = {
    0: { x: 25, y: 75 }, 1: { x: 50, y: 75 }, 2: { x: 75, y: 75 },
    3: { x: 25, y: 50 }, 4: { x: 50, y: 50 }, 5: { x: 75, y: 50 },
    6: { x: 25, y: 25 }, 7: { x: 50, y: 25 }, 8: { x: 75, y: 25 },
  }
  
  const currentPos = pointMap[currentPointId]
  
  // 移动到下一个点 - 类似 Unity 协程
  const moveToNext = useCallback(async () => {
    if (isMoving) return
    
    setIsMoving(true)
    
    // 获取下一个目标点
    const nextId = getNextTargetPoint(currentPointId).id
    setTargetPointId(nextId)
    
    const to = pointMap[nextId]
    
    // 平滑移动动画 - 3秒，类似 Unity 的 Lerp
    await controls.start({
      left: `${to.x}%`,
      top: `${to.y}%`,
      transition: {
        duration: 3, // 3秒移动
        ease: "easeInOut", // 缓入缓出，类似平滑曲线
      }
    })
    
    // 移动完成
    setCurrentPointId(nextId)
    setTargetPointId(null)
    setIsMoving(false)
    
  }, [currentPointId, isMoving, controls])
  
  // 自动移动循环 - 类似 Unity 的 StartCoroutine
  useEffect(() => {
    let isActive = true
    
    const runLoop = async () => {
      while (isActive) {
        // 等待随机时间 1-3 秒 (类似 yield return new WaitForSeconds)
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000))
        if (!isActive) break
        
        // 执行移动
        await moveToNext()
      }
    }
    
    // 初始延迟后开始
    const timer = setTimeout(() => {
      runLoop()
    }, 500 + Math.random() * 1500)
    
    return () => {
      isActive = false
      clearTimeout(timer)
    }
  }, [moveToNext])
  
  return (
    <motion.div
      className="absolute z-20"
      style={{
        left: `${currentPos.x}%`,
        top: `${currentPos.y}%`,
        transform: 'translate(-50%, 0)',
      }}
      animate={controls}
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ opacity: { duration: 0.3 }, scale: { duration: 0.3 } }}
    >
      <div className="relative">
        {/* 移动状态指示器 */}
        <motion.div
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full z-30 border border-gray-900"
          style={{ 
            background: isMoving ? '#ffd700' : '#39ff14',
            boxShadow: `0 0 8px ${isMoving ? '#ffd700' : '#39ff14'}` 
          }}
          animate={isMoving ? { scale: [1, 1.4, 1] } : { scale: 1 }}
          transition={{ duration: 0.5, repeat: isMoving ? Infinity : 0 }}
        />
        
        {/* Agent 主方块 */}
        <motion.div
          className="relative cursor-pointer"
          animate={isMoving ? { 
            y: [0, -4, 0],
          } : { 
            y: 0 
          }}
          transition={{ 
            duration: 0.6, 
            repeat: isMoving ? Infinity : 0,
            ease: "easeInOut"
          }}
          whileHover={{ scale: 1.1 }}
        >
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center text-xl sm:text-2xl relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${agent.color}44, ${agent.color}11)`,
              border: `2px solid ${agent.color}`,
              boxShadow: isMoving 
                ? `0 0 25px ${agent.color}66, 0 4px 12px rgba(0,0,0,0.5)`
                : `0 0 15px ${agent.color}44, 0 4px 12px rgba(0,0,0,0.5)`,
            }}
          >
            {/* 扫描线 */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
              }}
            />
            <span className="relative z-10">{agent.emoji}</span>
            
            {/* 移动时的拖尾效果 */}
            {isMoving && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent, ${agent.color}33, transparent)`,
                }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
              />
            )}
          </div>
          
          {/* 站立平台 */}
          <div 
            className="w-16 h-4 -mt-1 mx-auto rounded-sm sm:w-[72px]"
            style={{
              background: `linear-gradient(180deg, #1a1a2e, #0f0f1a)`,
              border: `1px solid ${agent.color}33`,
            }}
          />
        </motion.div>
        
        {/* 姓名标签 */}
        <div className="mt-1.5 text-center">
          <div 
            className="inline-block px-2.5 py-1 rounded text-[10px] sm:text-xs font-bold whitespace-nowrap"
            style={{
              background: `${agent.color}22`,
              border: `1px solid ${agent.color}`,
              color: agent.color,
              textShadow: `0 0 8px ${agent.color}`,
            }}
          >
            {agent.name}
          </div>
          <div className="text-[9px] sm:text-[10px] mt-0.5 opacity-70" style={{ color: agent.color }}>
            {isMoving ? '移动中...' : agent.role}
          </div>
        </div>
        
        {/* 位置 ID */}
        <div 
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] opacity-40"
          style={{ color: agent.color }}
        >
          {isMoving ? `${currentPointId}→${targetPointId}` : `P${currentPointId}`}
        </div>
      </div>
    </motion.div>
  )
}
