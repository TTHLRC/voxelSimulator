export const sceneConfig = {
  background: 0xf0f0f0,
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: { x: 10, y: 10, z: 10 }
  },
  renderer: {
    antialias: true,
    shadowMap: {
      enabled: true,
      type: 'PCFSoftShadowMap'
    }
  },
  controls: {
    enableDamping: true
  }
} 