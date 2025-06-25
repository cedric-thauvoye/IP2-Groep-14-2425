<template>
  <form @submit.prevent="submitForm">
    <div class="form-group">
      <label for="first-name">First Name</label>
      <input type="text" id="first-name" v-model="user.first_name" required />
    </div>

    <div class="form-group">
      <label for="last-name">Last Name</label>
      <input type="text" id="last-name" v-model="user.last_name" required />
    </div>

    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" v-model="user.email" required />
    </div>

    <div class="form-group">
      <label for="role">Role</label>
      <select id="role" v-model="user.role" required>
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="admin">Admin</option>
      </select>
    </div>

    <div class="form-group" v-if="user.role === 'student'">
      <label for="q-number">Q-Number</label>
      <input type="text" id="q-number" v-model="user.q_number" required />
    </div>

    <div class="form-actions">
      <button type="button" class="cancel-button" @click="$emit('close')">Cancel</button>
      <button type="submit" class="save-button">Add Student</button>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import { userService } from '../services/mockApi';

const emit = defineEmits(['close', 'created']);


const user = ref({
  first_name: '',
  last_name: '',
  email: '',
  role: 'student',
  q_number: '',
  password: 'Test123!'

});

const submitForm = async () => {
  try {
    await userService.createUser(user.value);
    emit('created');
    emit('close');
  } catch (error) {
    console.error('Error creating user:', error);
    alert('Failed to create user');
  }
};

</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
}

input,
select {
  width: 100%;
  padding: 0.5rem;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-button,
.save-button {
  padding: 0.5rem 1rem;
  border-radius: 5px;
  border: none;
}

.cancel-button {
  background: #ccc;
  color: #333;
}

.save-button {
  background: #3498db;
  color: white;
}
</style>
