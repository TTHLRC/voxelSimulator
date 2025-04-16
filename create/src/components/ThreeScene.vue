<template>
  <div class="scene-container">
    <NavBar />
    <div  ref="container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { SceneUtils } from '../utils/sceneUtils'
import NavBar from './NavBar.vue'

const container = ref(null)
let sceneUtils = null
const emit = defineEmits(['scene-ready'])

// 暴露给父组件的属性
defineExpose({
  cubeManager: computed(() => sceneUtils?.cameraControls?.cubeManager),
  sceneStateManager: computed(() => sceneUtils?.cameraControls?.sceneStateManager)
})

onMounted(() => {
  sceneUtils = new SceneUtils(container.value)
  sceneUtils.initScene()
  window.addEventListener('resize', () => sceneUtils.onWindowResize())
  emit('scene-ready', sceneUtils.scene)
})

onBeforeUnmount(() => {
  if (sceneUtils) {
    sceneUtils.dispose()
  }
})
</script>

<style scoped>
.scene-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style> 