// Task API for OpenClaw Office Dashboard
// Receives tasks and manages delegation flow

import { getAgentsMap } from '../../../lib/config'
let tasks = []
let activityLog = []

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  
  if (type === 'activity') {
    return Response.json({ activities: activityLog.slice(-50) })
  }
  
  return Response.json({ tasks, activities: activityLog.slice(-20) })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { action, taskDetail, from, to, agentId, status } = body
    
    const timestamp = new Date().toISOString()
    const timeStr = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    })
    
    // Get agents from config for names and colors
    const agents = getAgentsMap()
    
    if (action === 'new_task') {
      // New task received by orchestrator
      const task = {
        id: `task_${Date.now()}`,
        detail: taskDetail,
        status: 'received',
        receivedBy: 'main',
        delegatedTo: null,
        createdAt: timestamp,
      }
      tasks.push(task)
      
      const orchestrator = agents['main']
      activityLog.push({
        id: `log_${Date.now()}`,
        time: timeStr,
        type: 'received',
        agent: '司礼监',
        agentColor: orchestrator?.color || '#ff006e',
        message: `received task: "${taskDetail}"`,
        taskId: task.id,
      })
      
      return Response.json({ success: true, task, action: 'task_received' })
    }
    
    if (action === 'delegate') {
      // Orchestrator delegates task to another agent
      const task = tasks.find(t => t.id === body.taskId) || tasks[tasks.length - 1]
      if (task) {
        task.status = 'delegated'
        task.delegatedTo = to
      }
      
      // Get agent info from config
      const targetAgent = agents[to]
      const targetAgentName = targetAgent?.name || to
      const targetAgentColor = targetAgent?.color || '#888'
      
      const orchestrator = agents['main']
      activityLog.push({
        id: `log_${Date.now()}`,
        time: timeStr,
        type: 'delegated',
        agent: '司礼监',
        agentColor: orchestrator?.color || '#ff006e',
        message: `delegated "${taskDetail}" to ${targetAgentName}`,
        taskId: task?.id,
      })
      
      // Add "working on" entry for the receiving agent
      setTimeout(() => {
        activityLog.push({
          id: `log_${Date.now()}`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
          type: 'working',
          agent: targetAgentName,
          agentColor: targetAgentColor,
          message: `working on "${taskDetail}"`,
          taskId: task?.id,
        })
      }, 500)
      
      return Response.json({ 
        success: true, 
        action: 'delegated',
        from: 'main',
        to,
        taskDetail
      })
    }
    
    if (action === 'complete') {
      // Agent completes task
      const task = tasks.find(t => t.id === body.taskId)
      if (task) {
        task.status = 'completed'
      }
      
      // Get agent info from config
      const completingAgent = agents[agentId] || agents['main']
      const agentName = completingAgent?.name || agentId || '司礼监'
      const agentColor = completingAgent?.color || '#ff006e'
      
      activityLog.push({
        id: `log_${Date.now()}`,
        time: timeStr,
        type: 'completed',
        agent: agentName,
        agentColor: agentColor,
        message: `completed "${taskDetail}"`,
        status: 'completed',
        taskId: task?.id,
      })
      
      return Response.json({ success: true, action: 'completed' })
    }
    
    return Response.json({ error: 'Unknown action' }, { status: 400 })
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// Clear old data periodically (keep last 100 items)
setInterval(() => {
  if (tasks.length > 100) tasks = tasks.slice(-100)
  if (activityLog.length > 100) activityLog = activityLog.slice(-100)
}, 60000)
