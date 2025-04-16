<template>
  <div class="demo-container">
    <NavBar />
    <div class="scene-container" ref="container"></div>
    <div class="control-panel">
      <button @click="togglePhysics" class="start-button">
        {{ isPhysicsActive ? '暂停' : '开始' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import * as THREE from 'three'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { SceneUtils } from '../utils/sceneUtils'
import { SceneMode } from '../config/modeConfig'
import NavBar from '../components/NavBar.vue'
import { PhysicsManager } from '../utils/physicsManager'

const container = ref(null)
let sceneUtils = null
let physicsManager = null
let cubeBodies = new Map() // 存储立方体与其物理体的映射
const isPhysicsActive = ref(false)

onMounted(() => {
  // 初始化场景
  sceneUtils = new SceneUtils(container.value)
  
  // 在初始化场景之前设置演示模式
  sceneUtils.setSceneMode(SceneMode.DEMO)
  
  // 初始化场景
  sceneUtils.initScene()

  // 初始化物理世界
  physicsManager = new PhysicsManager()

  // 将场景中现有的立方体添加到物理世界
  const addCubesToPhysics = (object) => {
    // 检查是否是立方体
    if (object.type === 'Mesh' && object.geometry.type === "BoxGeometry") {
      object.userData.isCube = true
      try {
        const body = physicsManager.createCubeBody(object)
        cubeBodies.set(object, body)
      } catch (error) {
      }
    }
    
    // 递归检查子对象
    if (object.children && object.children.length > 0) {
      object.children.forEach(child => {
        addCubesToPhysics(child)
      })
    }
  }
  console.log(cubeBodies);
  
  // 从场景根节点开始遍历
  addCubesToPhysics(sceneUtils.scene)
  console.log('Total physics bodies created:', cubeBodies.size)

  // 修改动画循环
  const animate = () => {
    requestAnimationFrame(animate)
    
    // 只在物理激活时更新物理世界
    if (isPhysicsActive.value) {
      physicsManager.update(1/60)
      
      // 同步物理世界到图形世界
      cubeBodies.forEach((body, cube) => {
        physicsManager.syncPhysicsToGraphics(cube, body)
      })
    }

    // 使用 sceneUtils 的 renderer 和 camera
    sceneUtils.renderer.render(sceneUtils.scene, sceneUtils.camera)
  }
  animate()

  // 添加窗口大小调整监听
  window.addEventListener('resize', () => sceneUtils.onWindowResize())
})

onBeforeUnmount(() => {
  if (sceneUtils) {
    sceneUtils.dispose()
  }
  window.removeEventListener('resize', () => sceneUtils.onWindowResize())
})

// 切换物理模拟状态
const togglePhysics = () => {
  isPhysicsActive.value = !isPhysicsActive.value
  console.log('Physics simulation', isPhysicsActive.value ? 'started' : 'paused')
  console.log('Active physics bodies:', cubeBodies.size)
}

// 修改创建立方体的方法
const createCube = (position) => {
  const cube = sceneUtils.cubeManager.createCube(position)
  const body = physicsManager.createCubeBody(cube)
  cubeBodies.set(cube, body)
  return cube
}

// 修改移除立方体的方法
const removeCube = (cube) => {
  const body = cubeBodies.get(cube)
  if (body) {
    physicsManager.removeBody(body)
    cubeBodies.delete(cube)
  }
  sceneUtils.cubeManager.removeCube(cube)
}

// 修改清理方法
const cleanup = () => {
  cubeBodies.forEach((body, cube) => {
    physicsManager.removeBody(body)
  })
  cubeBodies.clear()
  sceneUtils.cubeManager.clearAllCubes()
}
</script>

<style scoped>
.demo-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.scene-container {
  width: 100%;
  height: 100%;
}

.control-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 100;
}

.start-button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.start-button:hover {
  background-color: #45a049;
}
</style> 