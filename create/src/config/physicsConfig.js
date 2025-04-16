export const physicsConfig = {
  gravity: {
    x: 0,
    y: 5,  // 增加重力加速度
    z: 0
  },
  world: {
    iterations: 20,  // 增加物理迭代次数以提高精度
    tolerance: 0.001  // 物理计算容差
  },
  materials: {
    default: {
      friction: 0.3,
      restitution: 0.1  // 减小弹性
    },
    cube: {
      friction: 0.5,
      restitution: 0.1  // 减小弹性
    }
  }
} 