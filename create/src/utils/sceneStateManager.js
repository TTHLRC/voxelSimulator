import * as THREE from 'three'
import { selectedMaterial_Hinge, preMaterial_Hinge } from '../config/materials'

export class SceneStateManager {
  constructor(cubeManager) {
    this.cubeManager = cubeManager
    this.scene = cubeManager.scene
    this.STORAGE_KEY = 'scene_state'
  }

  // 获取当前场景状态
  getCurrentState() {
    // 从场景中获取所有立方体
    const cubes = []
    this.scene.traverse((object) => {
      if (object.type === 'Mesh' && object.geometry.type === 'BoxGeometry') {
        cubes.push(object)
      }
    })

    const state = {
      cubes: cubes.map(cube => ({
        position: {
          x: cube.position.x,
          y: cube.position.y,
          z: cube.position.z
        },
        uuid: cube.uuid
      })),
      selectedCubes: (this.cubeManager.cameraControls?.selectedCubes || []).map(cube => ({
        position: {
          x: cube.position.x,
          y: cube.position.y,
          z: cube.position.z
        },
        uuid: cube.uuid
      })),
      hingePoints: (this.cubeManager.cameraControls?.selectedHingePoints || []).map(hinge => ({
        position: {
          x: hinge.position.x,
          y: hinge.position.y,
          z: hinge.position.z
        },
        uuid: hinge.uuid,
        status: hinge.userData?.status || false,
        connectedCubes: (hinge.userData?.connectedCubes || []).map(cube => cube.uuid)
      }))
    }
    return state
  }

  // 保存场景状态
  saveSceneState(state = {}) {
    const sceneState = {
      cubes: this.cubeManager.getAllCubes().map(cube => ({
        position: {
          x: cube.position.x,
          y: cube.position.y,
          z: cube.position.z
        },
        uuid: cube.uuid
      })),
      selectedCubes: (state.selectedCubes || []).map(cube => ({
        position: {
          x: cube.position.x,
          y: cube.position.y,
          z: cube.position.z
        },
        uuid: cube.uuid
      })),
      hingePoints: (state.selectedHinges || []).map(hinge => ({
        position: {
          x: hinge.position.x,
          y: hinge.position.y,
          z: hinge.position.z
        },
        uuid: hinge.uuid,
        status: hinge.userData?.status || false,
        connectedCubes: (hinge.userData?.connectedCubes || []).map(cube => cube.uuid)
      }))
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sceneState))
  }

  // 加载场景状态
  loadSceneState(importedState = null) {
    let sceneState = null

    // 如果有导入的状态，使用导入的状态
    if (importedState) {
      sceneState = importedState
    } else {
      // 否则从本地存储加载
      const savedState = localStorage.getItem(this.STORAGE_KEY)
      if (!savedState) return null
      sceneState = JSON.parse(savedState)
    }
    
    console.log('Loading scene state:', sceneState)

    // 恢复立方体
    if (sceneState.cubes && Array.isArray(sceneState.cubes)) {
      sceneState.cubes.forEach(cubeData => {
        const position = new THREE.Vector3(
          cubeData.position.x,
          cubeData.position.y,
          cubeData.position.z
        )
        const cube = this.cubeManager.createCube(position)
        cube.uuid = cubeData.uuid // 确保UUID一致
      })
    }

    // 恢复选中的立方体
    const selectedCubes = []
    if (sceneState.selectedCubes && Array.isArray(sceneState.selectedCubes)) {
      sceneState.selectedCubes.forEach(cubeData => {
        const cube = this.cubeManager.getCubeByUUID(cubeData.uuid)
        if (cube) {
          selectedCubes.push(cube)
        }
      })
    }

    // 恢复铰接点
    if (selectedCubes.length === 2) {
      const cameraControls = this.cubeManager.cameraControls
      if (cameraControls) {
        // 设置选中的立方体
        cameraControls.selectedCubes = selectedCubes
        // 创建铰链点
        cameraControls.createHingePoints()
        
        // 恢复铰接点状态
        if (sceneState.hingePoints && Array.isArray(sceneState.hingePoints)) {
          sceneState.hingePoints.forEach(hingeData => {
            const hinge = cameraControls.hingePoints.find(point => 
              point.position.distanceTo(new THREE.Vector3(
                hingeData.position.x,
                hingeData.position.y,
                hingeData.position.z
              )) < 0.1
            )
            if (hinge) {
              hinge.userData.status = hingeData.status
              hinge.material = hingeData.status ? selectedMaterial_Hinge : preMaterial_Hinge
              if (hingeData.status) {
                cameraControls.selectedHingePoints.push(hinge)
              }
            }
          })
        }
      }
    }

    return sceneState
  }

  // 更新铰接信息
  updateHinges(hingeData) {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY)
      if (savedState) {
        const sceneState = JSON.parse(savedState)
        sceneState.hinges = hingeData
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sceneState))
        console.log('Hinge data updated successfully')
        return true
      }
    } catch (error) {
      console.error('Error updating hinge data:', error)
    }
    return false
  }

  // 获取铰接信息
  getHingeData() {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY)
      if (savedState) {
        const sceneState = JSON.parse(savedState)
        return sceneState.hinges || []
      }
    } catch (error) {
      console.error('Error getting hinge data:', error)
    }
    return []
  }

  // 自动保存场景
  autoSave() {
    const state = {
      selectedCubes: this.cubeManager.cameraControls?.selectedCubes || [],
      selectedHinges: this.cubeManager.cameraControls?.selectedHingePoints || []
    }
    this.saveSceneState(state)
  }

  // 检查是否有保存的场景状态
  hasSavedState() {
    return localStorage.getItem(this.STORAGE_KEY) !== null
  }

  // 获取最后保存的时间
  getLastSaveTime() {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY)
      if (savedState) {
        const sceneState = JSON.parse(savedState)
        return new Date(sceneState.timestamp)
      }
    } catch (error) {
      console.error('Error getting last save time:', error)
    }
    return null
  }
} 