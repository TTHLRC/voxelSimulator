import * as THREE from 'three'
import { cubeConfig } from '../config/cubeConfig'
import { normalMaterial_Cone, selectedMaterial_Hinge } from '../config/materials'

export class CubeManager {
  constructor(scene) {
    this.scene = scene
    this.cubes = new Map() // 使用Map存储立方体，key为位置字符串
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.coneControlGroup = new THREE.Group()
    this.coneControlArray = []
    this.scene.add(this.coneControlGroup)
  }

  createCube(position) {
    const geometry = new THREE.BoxGeometry(cubeConfig.size, cubeConfig.size, cubeConfig.size)
    const material = new THREE.MeshStandardMaterial({
      color: cubeConfig.material.color,
      transparent: cubeConfig.material.transparent,
      opacity: cubeConfig.material.opacity,
      metalness: 0,
      roughness: 1,
      emissive: cubeConfig.material.color,
      emissiveIntensity: 0.2
    })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.copy(position)
    cube.castShadow = true
    cube.receiveShadow = true

    // 将立方体添加到场景
    this.scene.add(cube)

    // 存储立方体
    const key = `${position.x},${position.y},${position.z}`
    this.cubes.set(key, cube)

    return cube
  }

  removeCube(cube) {
    if (cube) {
      // 从场景中移除
      this.scene.remove(cube)

      // 从Map中移除
      const key = `${cube.position.x},${cube.position.y},${cube.position.z}`
      this.cubes.delete(key)

      // 释放资源
      cube.geometry.dispose()
      cube.material.dispose()
    }
  }

  getCubeAtPosition(position) {
    const key = `${position.x},${position.y},${position.z}`
    return this.cubes.get(key)
  }

  // 检查位置是否已有立方体
  hasCubeAtPosition(position) {
    const key = `${position.x},${position.y},${position.z}`
    return this.cubes.has(key)
  }

  // 获取所有立方体
  getAllCubes() {
    return Array.from(this.cubes.values())
  }

  // 清理所有立方体
  clearAllCubes() {
    this.cubes.forEach(cube => {
      this.scene.remove(cube)
      cube.geometry.dispose()
      cube.material.dispose()
    })
    this.cubes.clear()
    this.clearControlCones()
  }

  getCubeByUUID(uuid) {
    for (const cube of this.cubes.values()) {
      if (cube.uuid === uuid) {
        return cube
      }
    }
    return null
  }

  createControlCones(center) {
    // 清除现有的控制圆锥体
    this.clearControlCones()

    // 创建圆锥体几何体
    const coneGeometry = new THREE.ConeGeometry(0.5, 1.0, 32)

    // 创建6个方向的圆锥体，位置在立方体外侧
    const cubeSize = cubeConfig.size  // 获取立方体大小
    const directions = [
      { position: [0, cubeSize/2 + 1.0, 0], rotation: [0, 0, 0] },    // 上
      { position: [0, -cubeSize/2 - 1.0, 0], rotation: [Math.PI, 0, 0] }, // 下
      { position: [-cubeSize/2 - 1.0, 0, 0], rotation: [0, 0, Math.PI/2] }, // 左
      { position: [cubeSize/2 + 1.0, 0, 0], rotation: [0, 0, -Math.PI/2] }, // 右
      { position: [0, 0, cubeSize/2 + 1.0], rotation: [Math.PI/2, 0, 0] }, // 前
      { position: [0, 0, -cubeSize/2 - 1.0], rotation: [-Math.PI/2, 0, 0] }  // 后
    ]

    directions.forEach(dir => {
      const cone = new THREE.Mesh(coneGeometry, normalMaterial_Cone)
      cone.position.set(
        center.x + dir.position[0],
        center.y + dir.position[1],
        center.z + dir.position[2]
      )
      cone.rotation.set(dir.rotation[0], dir.rotation[1], dir.rotation[2])
      cone.renderOrder = -1
      cone.userData.isControlCone = true
      this.coneControlGroup.add(cone)
      this.coneControlArray.push(cone)
    })
  }

  clearControlCones() {
    this.coneControlArray.forEach(cone => {
      this.coneControlGroup.remove(cone)
      cone.geometry.dispose()
    })
    this.coneControlArray = []
  }

  updateControlCones(center) {
    if (this.coneControlArray.length > 0) {
      const directions = [
        [0, 1, 0], [0, -1, 0], [-1, 0, 0],
        [1, 0, 0], [0, 0, 1], [0, 0, -1]
      ]

      this.coneControlArray.forEach((cone, index) => {
        cone.position.set(
          center.x + directions[index][0],
          center.y + directions[index][1],
          center.z + directions[index][2]
        )
      })
    }
  }

  // 修改选中立方体的方法
  selectCube(cube) {
    if (cube) {
      // 创建控制圆锥体
      this.createControlCones(cube.position)
    }
  }

  // 修改取消选中立方体的方法
  deselectCube(cube) {
    if (cube) {
      // 清除控制圆锥体
      this.clearControlCones()
    }
  }
} 