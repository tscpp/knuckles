<template>
  <div class="container">
    <div class="wrapper">
      <p class="text">Loading...</p>
      <div class="loader">
        <span class="progress"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  place-content: center;
  place-items: center;
  height: 100%;
  width: 100%;
}

.wrapper {
  display: flex;
  flex-direction: column;
  place-items: center;
  gap: 0.5rem;
}

.loader {
  width: 25rem;
  max-width: 100%;
  line-height: 0;
  background-color: color-mix(in srgb, currentColor 20%, transparent);
  overflow: hidden;
  border-radius: 99px;
}

.progress {
  height: 4.8px;
  display: inline-block;
  position: relative;
  background: currentColor;
  box-shadow: 0 0 10px color-mix(in srgb, currentColor 20%, transparent);
  box-sizing: border-box;
  animation: animFw 60s ease infinite;
}

@keyframes animFw {
  0% {
    width: 0;
  }
  35% {
    width: 90%;
  }
  100% {
    width: 100%;
  }
}
</style>
