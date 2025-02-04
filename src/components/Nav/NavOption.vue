<template>
    <div class="nav-option">
        <router-link :to="to" class="nav-link" :style="{ color }">
            <slot></slot>
        </router-link>
    </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    to: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: '#7F7F7F'
    }
});
</script>

<style scoped>
.nav-option {
    margin: 10px 0 0 0;
    padding: 10px 20px;
    border-radius: 5px;
    transition: background-color 0.3s ease;
}

.nav-option:hover {
    background-color: #F1F1F1;
    cursor: pointer;
}

.nav-link {
    text-decoration: none;
    color: #333;
    font-weight: bold;
}
</style>
