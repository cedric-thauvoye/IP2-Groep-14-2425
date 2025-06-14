<template>
    <router-link :to="to" class="nav-option" :style="{ color }" @click="handleClick">
        <slot></slot>
    </router-link>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

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

const emit = defineEmits(['click']);

const handleClick = () => {
    emit('click');
};
</script>

<style scoped>
.nav-option {
    display: block;
    margin: 10px 0 0 0;
    padding: 12px 20px;
    border-radius: 8px;
    transition: all 0.3s ease;
    text-decoration: none;
    color: inherit;
    font-weight: bold;
    font-size: 14px;
    position: relative;
    overflow: hidden;
}

.nav-option:hover {
    background-color: rgba(255, 255, 255, 0.1);
    cursor: pointer;
    color: white !important;
    transform: translateX(4px);
}

.nav-option:active {
    transform: translateX(2px) scale(0.98);
}

/* Active/current route styling */
.nav-option.router-link-active {
    background-color: rgba(255, 255, 255, 0.2);
    color: white !important;
}

/* Mobile optimizations */
@media (max-width: 768px) {
    .nav-option {
        padding: 14px 16px;
        margin: 8px 0;
        font-size: 15px;
        border-radius: 6px;
        /* Increase touch target size for better mobile UX */
        min-height: 44px;
        display: flex;
        align-items: center;
    }

    .nav-option:hover {
        transform: none; /* Remove transform on mobile for better performance */
        background-color: rgba(255, 255, 255, 0.15);
    }

    .nav-option:active {
        background-color: rgba(255, 255, 255, 0.25);
        transform: scale(0.98);
    }
}

/* Tablet optimizations */
@media (min-width: 769px) and (max-width: 1150px) {
    .nav-option {
        padding: 11px 18px;
        font-size: 13px;
    }
}
</style>
