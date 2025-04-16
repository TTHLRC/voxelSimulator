<script>
export default {
  name: 'App',
  methods: {
    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
  }
}
</script>

<template>
  <div class="tag">
        <div @click="toggleFullscreen">
          <i class="fas fa-expand-arrows-alt"></i>
        </div>
    </div>
  <router-view />
</template>

<style>
*{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.tag{
  position: absolute;
  top: 40px;
  left: 40px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.tag div{
    width:30px;
    height:30px;
    line-height: 30px;
    background:#000;
    border-radius: 8px;
    text-align: center;
    cursor: pointer;
    
  }
  .tag div:hover{
    i{
      color: #000;
    }
      background:#ddc23a
    }
    i{
      color: #ffdd31;
    }
    
</style>
