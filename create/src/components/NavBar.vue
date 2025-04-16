<template>
  <div class="nav-container">
    <div class="nav-bar">
      <router-link
        v-for="(route, index) in routes"
        :key="index"
        :to="route.path"
        custom
        v-slot="{ isActive, navigate }"
      >
        <div
          :class="['nav-item', { active: isActive }]"
          @click="navigate"
        >
          {{ route.name }}
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
const routes = [
  { name: 'Creation Mode', path: '/create' },
  { name: 'Hinge Mode', path: '/hinge' },
  { name: 'Demo Mode', path: '/demo' }
]
</script>

<style scoped>
.nav-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  pointer-events: auto;
}

.nav-bar {
  display: flex;
  gap: 10px;
  background: rgba(51, 51, 51, 0.8);
  padding: 10px 20px;
  border-radius: 30px;
  backdrop-filter: blur(5px);
}

.nav-item {
  padding: 8px 20px;
  color: #ffffff;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  background: #ffd700;
  color: #333;
}
</style> 