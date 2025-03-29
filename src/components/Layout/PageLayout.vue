<template>
  <div class="page-container">
    <NavBar />
    <main>
      <slot></slot>
    </main>
  </div>
</template>

<script setup>
import NavBar from '../Nav/NavBar.vue';
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

main {
  padding: 20px;
  margin-left: 20%; /* Same as NavBar width */
  transition: margin-left 0.3s ease;
}

@media (max-width: 1150px) {
  main {
    margin-left: 0;
  }
}
</style>
