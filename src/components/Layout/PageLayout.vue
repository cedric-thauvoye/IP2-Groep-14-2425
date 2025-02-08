<template>
    <div class="page-layout">
        <NavBar />
        <main class="main-content">
            <slot></slot>
        </main>
    </div>
</template>

<script setup>
import NavBar from '../Nav/NavBar.vue';
</script>

<style scoped>
.page-layout {
    display: flex;
    min-height: 100vh;
}

.main-content {
    flex: 1;
    padding: 2rem;
    margin-left: 20%;
    background-color: #f5f5f5;
    min-height: 100vh;
    box-sizing: border-box;
}

@media (max-width: 1150px) {
    .main-content {
        margin-left: 0;
        width: 100%;
    }
}
</style>
