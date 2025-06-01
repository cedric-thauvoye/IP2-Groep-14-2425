import { ref } from 'vue'

const notifications = ref([]);
let notificationId = 0;

export const useNotificationStore = () => {
  const addNotification = (message, type = 'info', duration = 3000) => {
    const id = notificationId++;
    const notification = {
      id,
      message,
      type,
      show: true
    };
    notifications.value.push(notification);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  };

  const clearNotifications = () => {
    notifications.value = [];
  };

  const success = (message, duration) => addNotification(message, 'success', duration);
  const error = (message, duration) => addNotification(message, 'error', duration);
  const warning = (message, duration) => addNotification(message, 'warning', duration);
  const info = (message, duration) => addNotification(message, 'info', duration);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    success,
    error,
    warning,
    info
  };
};

// Create a singleton instance
const notificationStore = useNotificationStore();
export default notificationStore;
