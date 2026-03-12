// Health check endpoint
import { getConfig, validateConfig, getAgentsList } from '../../../lib/config.js'
import { getStatus } from '../../../lib/openclaw-ws.js'

export async function GET() {
  const config = getConfig()
  const validation = validateConfig(config)
  const wsStatus = getStatus()
  const agentsList = getAgentsList()

  return Response.json({
    status: 'healthy',
    service: 'OpenClaw Office',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    gateway: {
      connected: wsStatus.connected,
      url: config.gateway?.url || 'not configured',
    },
    agents: {
      count: agentsList.length,
      ids: agentsList.map(a => a.id),
    },
    config: {
      valid: validation.valid,
      errors: validation.errors,
    },
  })
}
