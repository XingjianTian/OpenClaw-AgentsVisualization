/**
 * 田字格 3x3 网格路径系统
 * 9个交叉点作为 agent 移动路径点
 */

// 田字格9个交叉点坐标（百分比）
// 布局：
// 6 — 7 — 8
// |   |   |
// 3 — 4 — 5
// |   |   |
// 0 — 1 — 2
export const GRID_POINTS = [
  { x: 25, y: 75, id: 0 },  // 左下
  { x: 50, y: 75, id: 1 },  // 中下
  { x: 75, y: 75, id: 2 },  // 右下
  { x: 25, y: 50, id: 3 },  // 左中
  { x: 50, y: 50, id: 4 },  // 中心
  { x: 75, y: 50, id: 5 },  // 右中
  { x: 25, y: 25, id: 6 },  // 左上
  { x: 50, y: 25, id: 7 },  // 中上
  { x: 75, y: 25, id: 8 },  // 右上
];

// 网格连接关系（定义哪些点之间可以直接移动）
export const GRID_CONNECTIONS = {
  0: [1, 3],      // 左下 -> 中下, 左中
  1: [0, 2, 4],   // 中下 -> 左下, 右下, 中心
  2: [1, 5],      // 右下 -> 中下, 右中
  3: [0, 4, 6],   // 左中 -> 左下, 中心, 左上
  4: [1, 3, 5, 7], // 中心 -> 所有方向
  5: [2, 4, 8],   // 右中 -> 右下, 中心, 右上
  6: [3, 7],      // 左上 -> 左中, 中上
  7: [4, 6, 8],   // 中上 -> 中心, 左上, 右上
  8: [5, 7],      // 右上 -> 右中, 中上
};

/**
 * 获取随机起点
 * @returns {Object} 随机选择的网格点 {x, y, id}
 */
export function getRandomSpawnPoint() {
  const randomIndex = Math.floor(Math.random() * GRID_POINTS.length);
  return GRID_POINTS[randomIndex];
}

/**
 * 获取下一个移动目标点
 * 从当前点的连接点中随机选择一个
 * @param {number} currentId - 当前点的ID
 * @returns {Object} 下一个目标点 {x, y, id}
 */
export function getNextTargetPoint(currentId) {
  const connections = GRID_CONNECTIONS[currentId];
  const randomIndex = Math.floor(Math.random() * connections.length);
  const nextId = connections[randomIndex];
  return GRID_POINTS[nextId];
}

/**
 * 计算两点之间的移动时间（根据距离调整）
 * @param {Object} from - 起始点 {x, y}
 * @param {Object} to - 目标点 {x, y}
 * @param {number} speed - 移动速度（百分比/秒），默认 15
 * @returns {number} 移动时间（秒）
 */
export function calculateMoveDuration(from, to, speed = 15) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0.8, distance / speed);
}

/**
 * 为 agent 生成随机移动序列
 * @param {string} agentId - Agent ID
 * @param {number} stepCount - 移动步数，默认无限循环
 * @returns {Array} 移动路径数组
 */
export function generateRandomPath(agentId, stepCount = Infinity) {
  const path = [];
  let currentPoint = getRandomSpawnPoint();
  
  // 初始位置
  path.push({
    ...currentPoint,
    duration: 0,
    pause: 0.5 + Math.random() * 1.5, // 随机停留 0.5-2 秒
  });
  
  // 生成移动序列
  for (let i = 0; i < stepCount; i++) {
    const nextPoint = getNextTargetPoint(currentPoint.id);
    const duration = calculateMoveDuration(currentPoint, nextPoint);
    
    path.push({
      ...nextPoint,
      duration,
      pause: 0.5 + Math.random() * 2, // 随机停留 0.5-2.5 秒
    });
    
    currentPoint = nextPoint;
  }
  
  return path;
}

/**
 * 获取网格可视化数据（用于调试显示）
 * @returns {Object} 网格线坐标
 */
export function getGridVisualization() {
  return {
    horizontal: [
      { x1: 25, y1: 25, x2: 75, y2: 25 }, // 上横
      { x1: 25, y1: 50, x2: 75, y2: 50 }, // 中横
      { x1: 25, y1: 75, x2: 75, y2: 75 }, // 下横
    ],
    vertical: [
      { x1: 25, y1: 25, x2: 25, y2: 75 }, // 左竖
      { x1: 50, y1: 25, x2: 50, y2: 75 }, // 中竖
      { x1: 75, y1: 25, x2: 75, y2: 75 }, // 右竖
    ],
  };
}
