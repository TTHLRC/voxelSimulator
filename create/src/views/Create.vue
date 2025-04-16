<template>
  <div class="create-container">
    <div class="tag">
        <div @click="handleExport">
          <svg t="1743774915120" class="icon" viewBox="0 0 1024 1024" version="1.1"
          xmlns="http://www.w3.org/2000/svg" p-id="2698" id="mx_n_1743774915121"
          data-spm-anchor-id="a313x.search_index.0.i6.48a73a81gHKLlg" width="32" height="32">
          <path
            d="M712.533333 371.2l-128 128-59.733333-59.733333 128-128L597.333333 256l-42.666666-42.666667h256v256l-42.666667-42.666666-55.466667-55.466667zM657.066667 256H768v110.933333V256h-110.933333zM298.666667 298.666667v426.666666h426.666666v-256l85.333334 85.333334v256H213.333333V213.333333h256l85.333334 85.333334H298.666667z"
            fill="#f4ea2a" p-id="2699" data-spm-anchor-id="a313x.search_index.0.i2.48a73a81gHKLlg" class="selected">
          </path>
        </svg>
        </div>

        <div>
          <input 
            type="file" 
            accept=".json" 
            @change="handleImport" 
            style="display: none" 
            ref="fileInput"
          >
          <svg t="1744735971578" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2645" width="32" height="32" @click="$refs.fileInput.click()">
            <path d="M780.8 482.133333l29.866667 29.866667h-298.666667V213.333333l42.666667 42.666667 98.133333 98.133333L789.333333 213.333333l29.866667 29.866667L682.666667 384l98.133333 98.133333z m-72.533333-12.8L554.666667 315.733333V469.333333h153.6zM469.333333 213.333333v42.666667H213.333333v554.666667h554.666667v-256h42.666667v298.666666H170.666667V213.333333h298.666666z" fill="#FFD700" p-id="2646"></path>
          </svg>
        </div>
    </div>
    <ThreeScene ref="threeScene" @scene-ready="onSceneReady" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ThreeScene from '../components/ThreeScene.vue'
import { SceneExporter } from '../utils/sceneExporter'
import * as THREE from 'three'
import { selectedMaterial_Hinge, preMaterial_Hinge } from '../config/materials'

const threeScene = ref(null)
const fileInput = ref(null)
let sceneExporter = null

const onSceneReady = (scene) => {
  try {
    sceneExporter = new SceneExporter(scene)
  } catch (error) {
    console.error('Failed to initialize SceneExporter:', error)
  }
}

const handleExport = () => {
  if (!sceneExporter) {
    alert('场景未准备好，请稍后再试')
    return
  }
  const success = sceneExporter.exportScene()
  if (!success) {
    alert('导出场景失败，请查看控制台获取详细信息')
  }
}

const handleImport = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!threeScene.value?.cubeManager || !threeScene.value?.sceneStateManager) {
    alert('场景未准备好，请稍后再试')
    return
  }

  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const state = JSON.parse(e.target.result)
        if (!state) {
          throw new Error('Invalid scene data')
        }

        // 清除当前场景
        threeScene.value.cubeManager.clearAllCubes()
        threeScene.value.cubeManager.cameraControls?.clearSelection()

        // 加载导入的场景状态
        threeScene.value.sceneStateManager.loadSceneState(state)

        alert('场景导入成功')
      } catch (error) {
        console.error('Error parsing scene data:', error)
        alert('导入失败：场景数据格式错误')
      }
    }
    reader.readAsText(file)
  } catch (error) {
    console.error('Error importing scene:', error)
    alert('导入失败：' + error.message)
  }
}
</script>

<style scoped>
.create-container {
  width: 100%;
  height: 100vh;
  position: relative;
}
.tag{
  position: absolute;
  left: 80px;
  top: 80px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tag div{
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag div:hover{
  background: #ddc23a;
  border-radius: 8px;
}
</style> 