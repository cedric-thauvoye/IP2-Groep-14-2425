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
  min-height: 100vh;
}

/* Mobile styles */
@media (max-width: 768px) {
  main {
    margin-left: 0;
    padding: 80px 15px 20px 15px; /* Add top padding for mobile toggle button */
  }
}

/* Tablet styles */
@media (min-width: 769px) and (max-width: 1150px) {
  main {
    margin-left: 0;
    padding: 20px 25px;
  }
}

/* Desktop styles when nav is open */
@media (min-width: 1151px) {
  main {
    margin-left: 20%;
  }
}
</style>
