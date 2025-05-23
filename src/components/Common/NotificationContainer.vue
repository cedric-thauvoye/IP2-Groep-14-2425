<template>
  <div class="notifications-container">
    <Notification
      v-for="notification in notifications"
      :key="notification.id"
      :show="notification.show"
      :message="notification.message"
      :type="notification.type"
      @close="removeNotification(notification.id)"
    />
  </div>
</template>

<script setup>
import Notification from './Notification.vue';
import notificationStore from '../../stores/notificationStore';

const { notifications, removeNotification } = notificationStore;
</script>

<style scoped>
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999;
}
</style>
