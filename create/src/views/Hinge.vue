<template>
  <div class="hinge-container">
    <NavBar />
    <div class="scene-container" ref="container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { SceneUtils } from '../utils/sceneUtils'
import { SceneStateManager } from '../utils/sceneStateManage'
import NavBar from '../components/NavBar.vue'
import { SceneMode } from '../config/modeConfig'

const container = ref(null)
let sceneUtils = null
let sceneStateManager = null

onMounted(() => {
  // 初始化场景
  sceneUtils = new SceneUtils(container.value)
  sceneUtils.initScene()

  // 隐藏网格和地板
  sceneUtils.setGridVisible(false)
  sceneUtils.setGroundVisible(false)

  // 设置为铰接模式并禁用创建和删除功能
  if (sceneUtils.cameraControls) {
    sceneUtils.cameraControls.setMode(SceneMode.HINGE)
    sceneUtils.cameraControls.enabled = false
  }

  // 初始化场景状态管理器
  sceneStateManager = new SceneStateManager(sceneUtils.getCubeManager())

  // 加载保存的场景
  const hinges = sceneStateManager.loadSceneState()
  console.log('Loaded hinges:', hinges)

  // 添加窗口大小调整监听
  window.addEventListener('resize', () => sceneUtils.onWindowResize())
})

onBeforeUnmount(() => {
  if (sceneUtils) {
    sceneUtils.dispose()
  }
  window.removeEventListener('resize', () => sceneUtils.onWindowResize())
})

// 铰接相关方法
const addHinge = () => {
  // 铰接点添加逻辑
  console.log('添加铰接点')
}

const removeHinge = () => {
  // 铰接点删除逻辑
  console.log('删除铰接点')
}
</script>

<style scoped>
.hinge-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.scene-container {
  width: 100%;
  height: 100%;
}

.hinge-controls {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(51, 51, 51, 0.8);
  padding: 20px;
  border-radius: 10px;
  backdrop-filter: blur(5px);
  color: white;
  z-index: 1000;
}

.control-panel {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.control-panel h3 {
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-btn {
  padding: 8px 16px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:hover {
  background: #357abd;
}

.control-btn:active {
  transform: scale(0.98);
}
</style> 