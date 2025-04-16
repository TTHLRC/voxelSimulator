import { SceneStateManager } from './SceneStateManager'
import { CubeManager } from './cubeManager'

export class SceneExporter {
  constructor(scene) {
    if (!scene) {
      throw new Error('Scene is required for SceneExporter initialization')
    }
    this.scene = scene
    this.cubeManager = new CubeManager(scene)
    if (!this.cubeManager) {
      throw new Error('Failed to initialize CubeManager')
    }
    this.sceneStateManager = new SceneStateManager(this.cubeManager)
    if (!this.sceneStateManager) {
      throw new Error('Failed to initialize SceneStateManager')
    }
  }

  /**
   * 导出场景到JSON文件
   * @param {string} filename - 导出文件名，默认为 'scene.json'
   */
  exportScene(filename = 'scene.json') {
    try {
      if (!this.sceneStateManager) {
        throw new Error('SceneStateManager not initialized')
      }
      
      const state = this.sceneStateManager.getCurrentState()
      if (!state) {
        throw new Error('Failed to get current scene state')
      }

      const dataStr = JSON.stringify(state, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', filename)
      linkElement.click()
      
      return true
    } catch (error) {
      console.error('Error exporting scene:', error)
      return false
    }
  }

  /**
   * 从JSON文件导入场景
   * @param {File} file - 要导入的JSON文件
   * @returns {Promise<boolean>} - 导入是否成功
   */
  async importScene(file) {
    if (!file) {
      console.error('No file provided')
      return false
    }

    if (!this.sceneStateManager) {
      console.error('SceneStateManager not initialized')
      return false
    }

    try {
      const state = await this.readFileAsJSON(file)
      if (!state) {
        throw new Error('Failed to parse scene state')
      }
      this.sceneStateManager.loadSceneState(state)
      return true
    } catch (error) {
      console.error('Error importing scene:', error)
      return false
    }
  }

  /**
   * 将文件读取为JSON对象
   * @param {File} file - 要读取的文件
   * @returns {Promise<Object>} - 解析后的JSON对象
   */
  readFileAsJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result)
          resolve(json)
        } catch (error) {
          reject(new Error('Invalid JSON format'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Error reading file'))
      }
      
      reader.readAsText(file)
    })
  }

  /**
   * 获取当前场景状态
   * @returns {Object} - 当前场景状态
   */
  getCurrentState() {
    if (!this.sceneStateManager) {
      throw new Error('SceneStateManager not initialized')
    }
    return this.sceneStateManager.getCurrentState()
  }

  /**
   * 加载场景状态
   * @param {Object} state - 要加载的场景状态
   */
  loadState(state) {
    if (!this.sceneStateManager) {
      throw new Error('SceneStateManager not initialized')
    }
    this.sceneStateManager.loadSceneState(state)
  }
} 