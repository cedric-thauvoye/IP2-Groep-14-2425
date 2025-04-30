<template>
    <router-link :to="to" class="nav-option" :style="{ color }">
        <slot></slot>
    </router-link>
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
        default: '#e0dddd'
    }
});
</script>

<style scoped>
.nav-option {
    display: block;
    margin: 10px 0 0 0;
    padding: 10px 20px;
    border-radius: 5px;
    transition: background-color 0.3s ease;
    text-decoration: none;
    color: inherit;
    font-weight: bold;
}

.nav-option:hover {
    background-color: #f5f7fa;
    cursor: pointer;
    color: #555 !important;
}
</style>
