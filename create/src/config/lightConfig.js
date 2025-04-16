export const lightConfig = {
  ambient: {
    color: 0xffffff,
    intensity: 0.5
  },
  directional: {
    color: 0xffffff,
    intensity: 0.8,
    position: { x: 10, y: 20, z: 10 },
    shadow: {
      mapSize: { width: 2048, height: 2048 },
      camera: {
        near: 0.5,
        far: 50,
        left: -50,
        right: 50,
        top: 50,
        bottom: -50
      }
    }
  }
} 