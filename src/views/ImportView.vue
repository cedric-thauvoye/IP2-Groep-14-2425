<template>
    <PageLayout>
        <div class="import-container">
            <h1>Import Data</h1>

            <div class="import-options">
                <div class="import-card">
                    <div class="card-header">
                        <i class="fas fa-user-graduate"></i>
                        <h2>Import Students</h2>
                    </div>
                    <p>Import students from Excel file (.xlsx, .csv)</p>
                    <div class="upload-zone"
                         @dragover.prevent="isDraggingStudents = true"
                         @dragleave.prevent="isDraggingStudents = false"
                         @drop.prevent="handleStudentsDrop"
                         :class="{ 'dragging': isDraggingStudents }">
                        <input type="file"
                               accept=".xlsx,.csv"
                               @change="handleStudentsFile"
                               ref="studentFileInput"
                               class="file-input">
                        <i class="fas fa-file-upload"></i>
                        <p>Drag & Drop or Click to Upload</p>
                        <button class="browse-button" @click="triggerStudentFileInput">
                            Browse Files
                        </button>
                    </div>
                    <div class="template-download">
                        <a href="#" @click.prevent="downloadStudentTemplate">
                            <i class="fas fa-download"></i> Download Template
                        </a>
                    </div>
                </div>

                <div class="import-card">
                    <div class="card-header">
                        <i class="fas fa-users"></i>
                        <h2>Import Groups</h2>
                    </div>
                    <p>Import groups from Excel file (.xlsx, .csv)</p>
                    <div class="upload-zone"
                         @dragover.prevent="isDraggingGroups = true"
                         @dragleave.prevent="isDraggingGroups = false"
                         @drop.prevent="handleGroupsDrop"
                         :class="{ 'dragging': isDraggingGroups }">
                        <input type="file"
                               accept=".xlsx,.csv"
                               @change="handleGroupsFile"
                               ref="groupFileInput"
                               class="file-input">
                        <i class="fas fa-file-upload"></i>
                        <p>Drag & Drop or Click to Upload</p>
                        <button class="browse-button" @click="triggerGroupFileInput">
                            Browse Files
                        </button>
                    </div>
                    <div class="template-download">
                        <a href="#" @click.prevent="downloadGroupTemplate">
                            <i class="fas fa-download"></i> Download Template
                        </a>
                    </div>
                </div>
            </div>

            <div v-if="importResults.length" class="import-results">
                <h2>Import Results</h2>
                <div v-for="(result, index) in importResults"
                     :key="index"
                     class="result-item"
                     :class="result.status">
                    <i :class="result.status === 'success' ? 'fas fa-check' : 'fas fa-times'"></i>
                    <span>{{ result.message }}</span>
                </div>
            </div>
        </div>
    </PageLayout>
</template>

<script setup>
import { ref } from 'vue';
import PageLayout from '../components/Layout/PageLayout.vue';
import axios from 'axios';

const studentFileInput = ref(null);
const groupFileInput = ref(null);
const isDraggingStudents = ref(false);
const isDraggingGroups = ref(false);
const importResults = ref([]);

const triggerStudentFileInput = () => studentFileInput.value.click();
const triggerGroupFileInput = () => groupFileInput.value.click();

// Process student file upload
const handleStudentsFile = async (event) => {
    const file = event.target.files[0];
    if (file) {
        try {
            // In a real implementation, we would send the file to the API
            // using FormData and axios
            /*
            const formData = new FormData();
            formData.append('file', file);
            const response = await axios.post('/api/import/students', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            */

            // For now, just simulate success
            importResults.value.push({
                status: 'success',
                message: `File "${file.name}" uploaded successfully. 3 students imported.`
            });
        } catch (error) {
            console.error('Error uploading student file:', error);
            importResults.value.push({
                status: 'error',
                message: `Error uploading "${file.name}": ${error.message}`
            });
        }
    }
};

// Process group file upload
const handleGroupsFile = async (event) => {
    const file = event.target.files[0];
    if (file) {
        try {
            // Simulate processing
            importResults.value.push({
                status: 'success',
                message: `File "${file.name}" uploaded successfully. 2 groups imported.`
            });
        } catch (error) {
            console.error('Error uploading group file:', error);
            importResults.value.push({
                status: 'error',
                message: `Error uploading "${file.name}": ${error.message}`
            });
        }
    }
};

// Handle file drops
const handleStudentsDrop = (e) => {
    isDraggingStudents.value = false;
    const file = e.dataTransfer.files[0];
    if (file) {
        // Update the file input for consistency
        studentFileInput.value.files = e.dataTransfer.files;
        handleStudentsFile({ target: { files: [file] } });
    }
};

const handleGroupsDrop = (e) => {
    isDraggingGroups.value = false;
    const file = e.dataTransfer.files[0];
    if (file) {
        // Update the file input for consistency
        groupFileInput.value.files = e.dataTransfer.files;
        handleGroupsFile({ target: { files: [file] } });
    }
};

// Generate and download template files
const downloadStudentTemplate = () => {
    // Generate a simple CSV template
    const csvContent = 'Email,First Name,Last Name,Q Number\nalice@example.com,Alice,Johnson,q1703022\nbob@example.com,Bob,Smith,q1703023';

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'student_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const downloadGroupTemplate = () => {
    // Generate a simple CSV template
    const csvContent = 'Group Name,Course Code,Student Emails\nWeb Team A,WEB101,alice@example.com;bob@example.com\nProject Team B,PM202,charlie@example.com;dave@example.com';

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'group_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
</script>

<style scoped>
.import-container {
    max-width: 1200px;
    margin: 0 auto;
}

.import-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.import-card {
    background: white;
    border-radius: 10px;
    padding: 2rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.card-header i {
    font-size: 2rem;
    color: #3498db;
}

.upload-zone {
    border: 2px dashed #bdc3c7;
    border-radius: 10px;
    padding: 2rem;
    text-align: center;
    margin: 1.5rem 0;
    transition: all 0.3s;
    position: relative;
    cursor: pointer;
}

.upload-zone.dragging {
    border-color: #3498db;
    background: #ebf5fb;
}

.upload-zone i {
    font-size: 2rem;
    color: #7f8c8d;
    margin-bottom: 1rem;
}

.file-input {
    display: none;
}

.browse-button {
    background: #3498db;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 5px;
    margin-top: 1rem;
    cursor: pointer;
    transition: background 0.3s;
}

.browse-button:hover {
    background: #2980b9;
}

.template-download {
    text-align: center;
    margin-top: 1rem;
}

.template-download a {
    color: #3498db;
    text-decoration: none;
}

.import-results {
    margin-top: 2rem;
    background: white;
    border-radius: 10px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.result-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border-bottom: 1px solid #eee;
}

.result-item.success {
    color: #27ae60;
}

.result-item.error {
    color: #e74c3c;
}

@media (max-width: 768px) {
    .import-options {
        grid-template-columns: 1fr;
    }
}
</style>
