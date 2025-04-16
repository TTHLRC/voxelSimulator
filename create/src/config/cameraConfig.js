export const cameraConfig = {
  perspective: {
    fov: 45,
    near: 0.1,
    far: 1000,
    position: {
      x: 30,
      y: 40,
      z: 50
    }
  },
  controls: {
    moveSpeed: 0.5,
    rotateSpeed: 0.5,
    keys: {
      forward: 'w',
      backward: 's',
      left: 'a',
      right: 'd',
      up: ' '
    }
  }
} 