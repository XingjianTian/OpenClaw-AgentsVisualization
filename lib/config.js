/**
 * OpenClaw Office Configuration System
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

let _config = null

const DEFAULTS = {
  office: {
    name: 'My AI Office',
    style: 'cyberpunk',
  },
  gateway: {
    url: 'ws://127.0.0.1:18789',
    token: '',
  },
  agents: {},
  image: {
    path: 'public/sprites/office.png',
    positions: {},
  },
  telegram: {
    botToken: '',
    chatId: '',
    webhookSecret: '',
  },
  license: 'MIT',
}

// Gateway agent ID to local agent ID mapping
// OpenClaw Gateway uses: main, py, vigil, quill, savy
// Local config uses: main, bingbu, xingbu, libu, hubu, gongbu, libu2
const GATEWAY_TO_LOCAL_MAP = {
  // Mappings to be determined by user after observing logs
  // Example: 'gatewayId': 'localId',
}
function loadConfigFile() {
  const configPath = join(process.cwd(), 'openclaw-office.config.json')
  if (existsSync(configPath)) {
    try {
      return JSON.parse(readFileSync(configPath, 'utf8'))
    } catch (err) {
      console.error('[config] Failed to parse openclaw-office.config.json:', err.message)
    }
  }
  return null
}

function buildConfig() {
  let config = { ...DEFAULTS }

  // Layer 1: Config file
  const fileConfig = loadConfigFile()
  if (fileConfig) {
    config = { ...config, ...fileConfig }
    // Deep merge agents if needed
    if (fileConfig.agents) {
      config.agents = fileConfig.agents
    }
  }

  // Layer 2: Environment variable overrides
  if (process.env.OPENCLAW_GATEWAY_URL) config.gateway.url = process.env.OPENCLAW_GATEWAY_URL
  if (process.env.OPENCLAW_GATEWAY_TOKEN) config.gateway.token = process.env.OPENCLAW_GATEWAY_TOKEN

  return config
}

export function getConfig() {
  if (!_config) _config = buildConfig()
  return _config
}

export function reloadConfig() {
  _config = null
  return getConfig()
}



/**
 * Get agents as a lookup map with gateway ID mapping
 */
export function getAgentsMap() {
  const agents = getConfig().agents || []
  let map = {}
  
  // Build base map from config
  if (Array.isArray(agents)) {
    for (const agent of agents) {
      if (agent.id) {
        map[agent.id] = agent
      }
    }
  } else {
    map = { ...agents }
  }
  
  // Return Proxy that maps gateway IDs to local agents
  return new Proxy(map, {
    get(target, prop) {
      // Direct match first
      if (prop in target) {
        return target[prop]
      }
      // Gateway ID mapping
      const localId = GATEWAY_TO_LOCAL_MAP[prop]
      if (localId && localId in target) {
        return target[localId]
      }
      return undefined
    },
    has(target, prop) {
      return prop in target || prop in GATEWAY_TO_LOCAL_MAP
    },
    ownKeys(target) {
      return [...Object.keys(target), ...Object.keys(GATEWAY_TO_LOCAL_MAP)]
    },
    getOwnPropertyDescriptor(target, prop) {
      if (prop in target) {
        return { configurable: true, enumerable: true, value: target[prop] }
      }
      const localId = GATEWAY_TO_LOCAL_MAP[prop]
      if (localId && localId in target) {
        return { configurable: true, enumerable: true, value: target[localId] }
      }
      return undefined
    }
  })
}

/**
 * Get agents as an array
 */
export function getAgentsList() {
  const agents = getConfig().agents || []
  if (Array.isArray(agents)) {
    return agents
  }
  return Object.entries(agents).map(([id, data]) => ({ id, ...data }))
}

/**
 * Map gateway agent ID to local agent ID
 */
export function mapGatewayAgentId(gatewayId) {
  return GATEWAY_TO_LOCAL_MAP[gatewayId] || gatewayId
}

/**
 * Get label/animation positions from config
 */
export function getPositions() {
  const agents = getConfig().agents || []
  const positions = {}
  
  if (Array.isArray(agents)) {
    for (const agent of agents) {
      if (agent.position) positions[agent.id] = agent.position
    }
  } else {
    for (const [id, agent] of Object.entries(agents)) {
      if (agent.position) positions[id] = agent.position
    }
  }
  
  const imgPositions = getConfig().image?.positions || {}
  return { ...positions, ...imgPositions }
}



/**
 * Validate configuration
 * @param {Object} config - Configuration object
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateConfig(config) {
  const errors = []
  
  if (!config) {
    errors.push('Configuration is null or undefined')
    return { valid: false, errors }
  }
  
  // Validate gateway configuration
  if (!config.gateway?.url) {
    errors.push('Gateway URL is not configured')
  }
  
  // Validate agents configuration
  const agents = config.agents || []
  const agentCount = Array.isArray(agents) ? agents.length : Object.keys(agents).length
  if (agentCount === 0) {
    errors.push('No agents configured')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}