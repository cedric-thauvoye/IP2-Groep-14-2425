<template>
    <PageLayout>
        <div class="import-container">
            <h1>Import Data</h1>

            <!-- Import Type Selection -->
            <div v-if="currentStep === 1 && !selectedImportType" class="import-type-selection">
                <h2>What would you like to import?</h2>
                <div class="import-type-cards">
                    <div class="import-type-card" @click="selectImportType('students')">
                        <i class="fas fa-user-graduate"></i>
                        <h3>Import Students</h3>
                        <p>Import student information into the system</p>
                    </div>
                    <div class="import-type-card" @click="selectImportType('groups')">
                        <i class="fas fa-users"></i>
                        <h3>Import Groups</h3>
                        <p>Import groups and assign students to them</p>
                    </div>
                </div>
            </div>

            <!-- Step indicator -->
            <div v-if="selectedImportType" class="step-indicator">
                <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
                    <span class="step-number">1</span>
                    <span class="step-label">{{ importType === 'groups' ? 'Select Course & Upload' : 'Upload File' }}</span>
                </div>
                <div class="step-divider"></div>
                <div class="step" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
                    <span class="step-number">2</span>
                    <span class="step-label">Preview & Edit</span>
                </div>
                <div class="step-divider"></div>
                <div class="step" :class="{ active: currentStep === 3, completed: currentStep > 3 }">
                    <span class="step-number">3</span>
                    <span class="step-label">Import</span>
                </div>
            </div>

            <!-- Step 1: File Upload -->
            <div v-if="currentStep === 1 && selectedImportType" class="step-content">
                <!-- Course Selection for Groups -->
                <div v-if="importType === 'groups'" class="course-selection-card">
                    <div class="card-header">
                        <i class="fas fa-university"></i>
                        <h2>Select Course</h2>
                    </div>
                    <div class="course-selection">
                        <label for="course-select">Choose a course for group import:</label>
                        <select id="course-select" v-model="selectedCourseId" class="course-select">
                            <option value="">-- Select a Course --</option>
                            <option v-for="course in availableCourses" :key="course.id" :value="course.id">
                                {{ course.name }} ({{ course.code }})
                            </option>
                        </select>
                    </div>
                </div>

                <div class="import-card">
                    <div class="card-header">
                        <i :class="importType === 'students' ? 'fas fa-user-graduate' : 'fas fa-users'"></i>
                        <h2>{{ importType === 'students' ? 'Import Students' : 'Import Groups' }}</h2>
                        <button class="btn-back" @click="resetImportType">
                            <i class="fas fa-arrow-left"></i>
                            Change Type
                        </button>
                    </div>

                    <!-- Introduction section -->
                    <div class="intro-section">
                        <div class="intro-content">
                            <i class="fas fa-info-circle intro-icon"></i>
                            <div class="intro-text">
                                <h3>How it works</h3>
                                <p v-if="importType === 'students'">Upload a CSV file containing student information. We'll validate the data and let you review it before importing.</p>
                                <p v-else>Upload an XLSX file containing group information and student assignments. We'll validate the data and let you review it before importing.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Template download -->
                    <div class="template-section">
                        <h3>Need a template?</h3>
                        <p v-if="importType === 'students'">Download our CSV template to get started with the correct format. You can also open it in Excel and save as XLSX.</p>
                        <p v-else>Download our XLSX template to get started with the correct format for group imports.</p>
                        <button class="template-button" @click="downloadTemplate" :disabled="downloading">
                            <i class="fas fa-download"></i>
                            {{ downloading ? 'Downloading...' : 'Download Template' }}
                        </button>
                    </div>

                    <!-- File upload area -->
                    <div v-if="importType === 'students' || (importType === 'groups' && selectedCourseId)"
                         class="upload-zone"
                         @dragover.prevent="isDragging = true"
                         @dragleave.prevent="isDragging = false"
                         @drop.prevent="handleFileDrop"
                         :class="{ 'dragging': isDragging, 'has-file': selectedFile }">

                        <input type="file"
                               :accept="importType === 'students' ? '.csv,.xlsx' : '.xlsx'"
                               @change="handleFileSelect"
                               ref="fileInput"
                               class="file-input"
                               id="csv-file-input">

                        <div v-if="!selectedFile">
                            <i class="fas fa-file-upload upload-icon"></i>
                            <h3 v-if="importType === 'students'">Drag & Drop your CSV or Excel file here</h3>
                            <h3 v-else>Drag & Drop your Excel file here</h3>
                            <p>or</p>
                            <label for="csv-file-input" class="browse-button">
                                <i class="fas fa-folder-open"></i>
                                Browse Files
                            </label>
                            <p class="file-requirements" v-if="importType === 'students'">
                                Supported formats: CSV and XLSX files • Max size: 5MB
                            </p>
                            <p class="file-requirements" v-else>
                                Supported formats: XLSX files • Max size: 5MB
                            </p>
                        </div>

                        <div v-else class="file-selected">
                            <i :class="getFileIcon(selectedFile.name)" class="file-icon"></i>
                            <div class="file-info">
                                <h4>{{ selectedFile.name }}</h4>
                                <p>{{ formatFileSize(selectedFile.size) }}</p>
                            </div>
                            <button class="remove-file" @click="removeFile">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Action buttons -->
                    <div class="action-buttons" v-if="selectedFile">
                        <button class="btn-secondary" @click="removeFile">
                            <i class="fas fa-times"></i>
                            Remove File
                        </button>
                        <button class="btn-primary" @click="handlePreviewData" :disabled="processing">
                            <i class="fas fa-eye"></i>
                            {{ processing ? 'Processing...' : 'Preview Data' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Step 2: Preview & Edit -->
            <div v-if="currentStep === 2" class="step-content">
                <div class="preview-card">
                    <div class="card-header">
                        <h2>Preview Import Data</h2>
                        <div class="preview-stats">
                            <span class="stat valid">
                                <i class="fas fa-check-circle"></i>
                                {{ previewResponse?.validRows || 0 }} Valid
                            </span>
                            <span class="stat invalid" v-if="previewResponse?.errors?.length > 0">
                                <i class="fas fa-exclamation-circle"></i>
                                {{ (previewResponse?.totalRows || 0) - (previewResponse?.validRows || 0) }} Invalid
                            </span>
                            <span class="stat total">
                                <i class="fas fa-list"></i>
                                {{ previewResponse?.totalRows || 0 }} Total
                            </span>
                        </div>
                    </div>

                    <!-- Validation errors -->
                    <div v-if="previewResponse?.errors?.length > 0" class="validation-errors">
                        <h3><i class="fas fa-exclamation-triangle"></i> Validation Errors</h3>
                        <div class="error-list">
                            <div v-for="error in previewResponse.errors" :key="error" class="error-item">
                                {{ error }}
                            </div>
                        </div>
                    </div>

                    <!-- Data table -->
                    <div class="data-table-container">
                        <table class="data-table" v-if="importType === 'students'">
                            <thead>
                                <tr>
                                    <th>Row</th>
                                    <th>Email</th>
                                    <th>First Name</th>
                                    <th>Last Name</th>
                                    <th>Q Number</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(row, index) in editableData"
                                    :key="index"
                                    :class="{ 'invalid-row': !row.isValid, 'editing-row': row.editing }">
                                    <td>{{ row.row }}</td>
                                    <td>
                                        <input v-if="row.editing"
                                               v-model="row.email"
                                               type="email"
                                               class="edit-input"
                                               @blur="validateRow(row)">
                                        <span v-else>{{ row.email }}</span>
                                    </td>
                                    <td>
                                        <input v-if="row.editing"
                                               v-model="row.firstName"
                                               type="text"
                                               class="edit-input"
                                               @blur="validateRow(row)">
                                        <span v-else>{{ row.firstName }}</span>
                                    </td>
                                    <td>
                                        <input v-if="row.editing"
                                               v-model="row.lastName"
                                               type="text"
                                               class="edit-input"
                                               @blur="validateRow(row)">
                                        <span v-else>{{ row.lastName }}</span>
                                    </td>
                                    <td>
                                        <input v-if="row.editing"
                                               v-model="row.qNumber"
                                               type="text"
                                               class="edit-input"
                                               @blur="validateRow(row)">
                                        <span v-else>{{ row.qNumber }}</span>
                                    </td>
                                    <td>
                                        <span class="status-badge" :class="row.isValid ? 'valid' : 'invalid'">
                                            <i :class="row.isValid ? 'fas fa-check' : 'fas fa-times'"></i>
                                            {{ row.isValid ? 'Valid' : 'Invalid' }}
                                        </span>
                                    </td>
                                    <td>
                                        <button v-if="!row.editing"
                                                class="btn-edit"
                                                @click="startEditing(row)"
                                                :disabled="importing">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <div v-else class="edit-actions">
                                            <button class="btn-save" @click="stopEditing(row)">
                                                <i class="fas fa-check"></i>
                                            </button>
                                            <button class="btn-cancel" @click="cancelEdit(row)">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <table class="data-table" v-else-if="importType === 'groups'">
                            <thead>
                                <tr>
                                    <th>Row</th>
                                    <th>Group Name</th>
                                    <th>User ID</th>
                                    <th>First Name</th>
                                    <th>Last Name</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(row, index) in editableData"
                                    :key="index"
                                    :class="{ 'invalid-row': !row.isValid, 'editing-row': row.editing }">
                                    <td>{{ row.row }}</td>
                                    <td>
                                        <input v-if="row.editing"
                                               v-model="row.groupName"
                                               type="text"
                                               class="edit-input"
                                               @blur="validateRow(row)">
                                        <span v-else>{{ row.groupName }}</span>
                                    </td>
                                    <td>
                                        <input v-if="row.editing"
                                               v-model="row.userId"
                                               type="text"
                                               class="edit-input"
                                               @blur="validateRow(row)">
                                        <span v-else>{{ row.userId }}</span>
                                    </td>
                                    <td>
                                        <input v-if="row.editing"
                                               v-model="row.firstName"
                                               type="text"
                                               class="edit-input"
                                               @blur="validateRow(row)">
                                        <span v-else>{{ row.firstName }}</span>
                                    </td>
                                    <td>
                                        <input v-if="row.editing"
                                               v-model="row.lastName"
                                               type="text"
                                               class="edit-input"
                                               @blur="validateRow(row)">
                                        <span v-else>{{ row.lastName }}</span>
                                    </td>
                                    <td>
                                        <span class="status-badge" :class="row.isValid ? 'valid' : 'invalid'">
                                            <i :class="row.isValid ? 'fas fa-check' : 'fas fa-times'"></i>
                                            {{ row.isValid ? 'Valid' : 'Invalid' }}
                                        </span>
                                    </td>
                                    <td>
                                        <button v-if="!row.editing"
                                                class="btn-edit"
                                                @click="startEditing(row)"
                                                :disabled="importing">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <div v-else class="edit-actions">
                                            <button class="btn-save" @click="stopEditing(row)">
                                                <i class="fas fa-check"></i>
                                            </button>
                                            <button class="btn-cancel" @click="cancelEdit(row)">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Action buttons -->
                    <div class="action-buttons">
                        <button class="btn-secondary" @click="goBack">
                            <i class="fas fa-arrow-left"></i>
                            Back to Upload
                        </button>
                        <button class="btn-primary"
                                @click="proceedWithImport"
                                :disabled="!canProceedWithImport || importing">
                            <i class="fas fa-upload"></i>
                            {{ importing ? 'Importing...' : `Import ${validRowsCount} ${importType === 'students' ? 'Students' : 'Groups'}` }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Step 3: Import Results -->
            <div v-if="currentStep === 3" class="step-content">
                <div class="results-card">
                    <div class="card-header">
                        <h2>Import Results</h2>
                    </div>

                    <div v-if="importResults?.totalImported > 0" class="success-message">
                        <i class="fas fa-check-circle"></i>
                        <h3>Import Completed Successfully!</h3>
                        <p v-if="importType === 'students'">{{ importResults.totalImported }} students have been imported.</p>
                        <p v-else>{{ importResults.totalImported }} group assignments have been imported.</p>
                    </div>

                    <div v-if="importResults?.errors?.length > 0" class="import-errors">
                        <h3><i class="fas fa-exclamation-triangle"></i> Import Errors</h3>
                        <div class="error-list">
                            <div v-for="error in importResults.errors" :key="error" class="error-item">
                                {{ error }}
                            </div>
                        </div>
                    </div>

                    <div class="import-summary">
                        <div class="summary-item">
                            <i class="fas fa-users"></i>
                            <span>Total Processed: {{ importResults?.totalImported + importResults?.totalErrors || 0 }}</span>
                        </div>
                        <div class="summary-item success">
                            <i class="fas fa-check"></i>
                            <span>Successfully Imported: {{ importResults?.totalImported || 0 }}</span>
                        </div>
                        <div v-if="importResults?.totalErrors > 0" class="summary-item error">
                            <i class="fas fa-times"></i>
                            <span>Failed: {{ importResults?.totalErrors }}</span>
                        </div>
                    </div>

                    <!-- Action buttons -->
                    <div class="action-buttons">
                        <button class="btn-primary" @click="startOver">
                            <i class="fas fa-plus"></i>
                            {{ importType === 'students' ? 'Import More Students' : 'Import More Groups' }}
                        </button>
                        <button class="btn-secondary" @click="navigateToView">
                            <i :class="importType === 'students' ? 'fas fa-users' : 'fas fa-layer-group'"></i>
                            {{ importType === 'students' ? 'View Students' : 'View Groups' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </PageLayout>
</template>

<script>
import PageLayout from '@/components/Layout/PageLayout.vue';
import api from '@/services/api';
import { useNotificationStore } from '@/stores/notificationStore';

export default {
    name: 'ImportView',
    components: {
        PageLayout
    },
    setup() {
        const notificationStore = useNotificationStore();
        return { notificationStore };
    },
    data() {
        return {
            currentStep: 1,
            selectedFile: null,
            isDragging: false,
            downloading: false,
            processing: false,
            importing: false,
            previewResponse: null,
            editableData: [],
            originalData: [],
            importResults: null,
            selectedImportType: false,
            importType: '',
            selectedCourseId: '',
            availableCourses: []
        };
    },
    computed: {
        validRowsCount() {
            return this.editableData?.filter(row => row.isValid).length || 0;
        },
        canProceedWithImport() {
            return this.validRowsCount > 0;
        }
    },
    async mounted() {
        // Load available courses for group import
        await this.loadCourses();
    },
    methods: {
        // Import type selection
        selectImportType(type) {
            this.importType = type;
            this.selectedImportType = true;
        },

        resetImportType() {
            this.selectedImportType = false;
            this.importType = '';
            this.currentStep = 1;
            this.selectedFile = null;
            this.selectedCourseId = '';
            this.previewResponse = null;
            this.editableData = [];
            this.originalData = [];
            this.importResults = null;
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },

        // Load courses for group import
        async loadCourses() {
            try {
                const response = await api.courses.getCourses(true); // Only courses user teaches
                this.availableCourses = response.data;
            } catch (error) {
                console.error('Error loading courses:', error);
                this.notificationStore.addNotification({
                    type: 'error',
                    message: 'Failed to load courses'
                });
            }
        },
        // File handling methods
        handleFileDrop(event) {
            this.isDragging = false;
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        },

        handleFileSelect(event) {
            const file = event.target.files[0];
            if (file) {
                this.processFile(file);
            }
        },

        processFile(file) {
            // Validate file type
            const fileName = file.name.toLowerCase();
            if (this.importType === 'students') {
                if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx')) {
                    this.notificationStore.addNotification({
                        type: 'error',
                        message: 'Please select a CSV or XLSX file'
                    });
                    return;
                }
            } else if (this.importType === 'groups') {
                if (!fileName.endsWith('.xlsx')) {
                    this.notificationStore.addNotification({
                        type: 'error',
                        message: 'Please select an XLSX file for group import'
                    });
                    return;
                }
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                this.notificationStore.addNotification({
                    type: 'error',
                    message: 'File size must be less than 5MB'
                });
                return;
            }

            this.selectedFile = file;
        },

        removeFile() {
            this.selectedFile = null;
            this.$refs.fileInput.value = '';
        },

        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        getFileIcon(filename) {
            const extension = filename.toLowerCase().split('.').pop();
            switch (extension) {
                case 'csv':
                    return 'fas fa-file-csv';
                case 'xlsx':
                    return 'fas fa-file-excel';
                default:
                    return 'fas fa-file';
            }
        },

        // Template download
        async downloadTemplate() {
            try {
                this.downloading = true;
                let response;

                if (this.importType === 'students') {
                    response = await api.import.getStudentTemplate();
                } else {
                    response = await api.import.getGroupTemplate();
                }

                // Create blob and download
                const blob = new Blob([response.data], {
                    type: this.importType === 'students' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = this.importType === 'students' ? 'student_import_template.csv' : 'group_import_template.xlsx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                this.notificationStore.addNotification({
                    type: 'success',
                    message: 'Template downloaded successfully'
                });
            } catch (error) {
                console.error('Download template error:', error);
                this.notificationStore.addNotification({
                    type: 'error',
                    message: 'Failed to download template'
                });
            } finally {
                this.downloading = false;
            }
        },

        // Data preview and validation
        async handlePreviewData() {
            if (!this.selectedFile) return;

            if (this.importType === 'groups' && !this.selectedCourseId) {
                this.notificationStore.addNotification({
                    type: 'error',
                    message: 'Please select a course before uploading the file'
                });
                return;
            }

            console.log('Starting preview process...');
            console.log('Selected file:', this.selectedFile);
            console.log('Import type:', this.importType);

            try {
                this.processing = true;
                const formData = new FormData();
                formData.append('file', this.selectedFile);

                if (this.importType === 'groups') {
                    formData.append('courseId', this.selectedCourseId);
                }

                console.log('Calling API preview...');
                let response;
                if (this.importType === 'students') {
                    response = await api.import.previewStudents(formData);
                } else {
                    response = await api.import.previewGroups(formData);
                }
                console.log('API Response:', response.data);

                this.previewResponse = response.data;

                // Create editable data with original backup
                this.editableData = response.data.preview.map(row => ({
                    ...row,
                    editing: false
                }));
                this.originalData = JSON.parse(JSON.stringify(this.editableData));

                console.log('Moving to step 2...');
                this.currentStep = 2;

                if (this.previewResponse.errors.length > 0) {
                    this.notificationStore.addNotification({
                        type: 'warning',
                        message: `Found ${this.previewResponse.errors.length} validation errors. Please review and fix before importing.`
                    });
                }
            } catch (error) {
                console.error('Preview error:', error);
                this.notificationStore.addNotification({
                    type: 'error',
                    message: error.response?.data?.message || 'Failed to process file'
                });
            } finally {
                this.processing = false;
            }
        },

        // Row editing methods
        startEditing(row) {
            row.editing = true;
            if (this.importType === 'students') {
                row.originalValues = {
                    email: row.email,
                    firstName: row.firstName,
                    lastName: row.lastName,
                    qNumber: row.qNumber
                };
            } else {
                row.originalValues = {
                    groupName: row.groupName,
                    userId: row.userId,
                    firstName: row.firstName,
                    lastName: row.lastName
                };
            }
        },

        stopEditing(row) {
            row.editing = false;
            this.validateRow(row);
            delete row.originalValues;
        },

        cancelEdit(row) {
            if (row.originalValues) {
                if (this.importType === 'students') {
                    row.email = row.originalValues.email;
                    row.firstName = row.originalValues.firstName;
                    row.lastName = row.originalValues.lastName;
                    row.qNumber = row.originalValues.qNumber;
                } else {
                    row.groupName = row.originalValues.groupName;
                    row.userId = row.originalValues.userId;
                    row.firstName = row.originalValues.firstName;
                    row.lastName = row.originalValues.lastName;
                }
            }
            row.editing = false;
            delete row.originalValues;
        },

        validateRow(row) {
            // Basic validation
            const errors = [];

            if (this.importType === 'students') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const qNumberRegex = /^q\d+$/i;

                if (!row.email?.trim()) {
                    errors.push('Email is required');
                } else if (!emailRegex.test(row.email.trim())) {
                    errors.push('Invalid email format');
                }

                if (!row.firstName?.trim()) {
                    errors.push('First name is required');
                }

                if (!row.lastName?.trim()) {
                    errors.push('Last name is required');
                }

                if (!row.qNumber?.trim()) {
                    errors.push('Q Number is required');
                } else if (!qNumberRegex.test(row.qNumber.trim())) {
                    errors.push('Q Number must start with "q" followed by numbers');
                }
            } else {
                // Groups validation
                const qNumberRegex = /^q\d+$/i;

                if (!row.groupName?.trim()) {
                    errors.push('Group name is required');
                }

                if (!row.userId?.trim()) {
                    errors.push('User ID is required');
                } else if (!qNumberRegex.test(row.userId.trim())) {
                    errors.push('User ID must start with "q" followed by numbers');
                }

                if (!row.firstName?.trim()) {
                    errors.push('First name is required');
                }

                if (!row.lastName?.trim()) {
                    errors.push('Last name is required');
                }
            }

            row.isValid = errors.length === 0;
            return errors;
        },

        // Import process
        async proceedWithImport() {
            if (!this.canProceedWithImport) return;

            try {
                this.importing = true;

                if (this.importType === 'students') {
                    // Prepare valid students for import
                    const validStudents = this.editableData
                        .filter(row => row.isValid)
                        .map(row => ({
                            email: row.email?.trim(),
                            firstName: row.firstName?.trim(),
                            lastName: row.lastName?.trim(),
                            qNumber: row.qNumber?.trim()
                        }));

                    const response = await api.import.importStudents(validStudents);
                    this.importResults = response.data;
                } else {
                    // Prepare valid groups for import
                    const validGroups = this.editableData
                        .filter(row => row.isValid)
                        .map(row => ({
                            groupName: row.groupName?.trim(),
                            userId: row.userId?.trim(),
                            firstName: row.firstName?.trim(),
                            lastName: row.lastName?.trim()
                        }));

                    const response = await api.import.importGroups({
                        courseId: this.selectedCourseId,
                        groups: validGroups
                    });
                    this.importResults = response.data;
                }

                this.currentStep = 3;

                if (this.importResults.totalImported > 0) {
                    this.notificationStore.addNotification({
                        type: 'success',
                        message: `Successfully imported ${this.importResults.totalImported} ${this.importType === 'students' ? 'students' : 'group assignments'}`
                    });
                }

                if (this.importResults.errors?.length > 0) {
                    this.notificationStore.addNotification({
                        type: 'warning',
                        message: `${this.importResults.errors.length} ${this.importType === 'students' ? 'students' : 'group assignments'} failed to import`
                    });
                }
            } catch (error) {
                console.error('Import error:', error);
                this.notificationStore.addNotification({
                    type: 'error',
                    message: error.response?.data?.message || `Failed to import ${this.importType}`
                });
            } finally {
                this.importing = false;
            }
        },

        // Navigation methods
        goBack() {
            this.currentStep = 1;
            this.previewResponse = null;
            this.editableData = [];
            this.originalData = [];
        },

        startOver() {
            this.currentStep = 1;
            this.selectedFile = null;
            this.selectedCourseId = '';
            this.previewResponse = null;
            this.editableData = [];
            this.originalData = [];
            this.importResults = null;
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },

        navigateToView() {
            if (this.importType === 'students') {
                this.$router.push('/students');
            } else {
                this.$router.push('/groups');
            }
        }
    }
};
</script>

<style scoped>
.import-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.import-container h1 {
    text-align: center;
    color: #2c3e50;
    margin-bottom: 2rem;
    font-size: 2.5rem;
    font-weight: 300;
}

/* Import Type Selection */
.import-type-selection {
    text-align: center;
    margin-bottom: 3rem;
}

.import-type-selection h2 {
    color: #2c3e50;
    margin-bottom: 2rem;
    font-size: 1.8rem;
    font-weight: 300;
}

.import-type-cards {
    display: flex;
    gap: 2rem;
    justify-content: center;
    flex-wrap: wrap;
}

.import-type-card {
    background: white;
    border: 2px solid #ecf0f1;
    border-radius: 12px;
    padding: 2rem;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 250px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.import-type-card:hover {
    border-color: #3498db;
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.import-type-card i {
    font-size: 3rem;
    color: #3498db;
    margin-bottom: 1rem;
}

.import-type-card h3 {
    color: #2c3e50;
    margin: 0 0 0.5rem 0;
    font-size: 1.3rem;
}

.import-type-card p {
    color: #7f8c8d;
    margin: 0;
    font-size: 0.95rem;
}

/* Course Selection */
.course-selection-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    margin-bottom: 2rem;
}

.course-selection {
    margin-top: 1rem;
}

.course-selection label {
    display: block;
    margin-bottom: 0.5rem;
    color: #2c3e50;
    font-weight: 500;
}

.course-select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #ecf0f1;
    border-radius: 8px;
    font-size: 1rem;
    color: #2c3e50;
    background: white;
    transition: border-color 0.3s ease;
}

.course-select:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.btn-back {
    background: #95a5a6;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.btn-back:hover {
    background: #7f8c8d;
    transform: translateY(-1px);
}

/* Step Indicator */
.step-indicator {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 3rem;
    padding: 1rem;
}

.step {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #bdc3c7;
    transition: all 0.3s ease;
}

.step.active {
    color: #3498db;
}

.step.completed {
    color: #27ae60;
}

.step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #ecf0f1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-bottom: 0.5rem;
    transition: all 0.3s ease;
}

.step.active .step-number {
    background: #3498db;
    color: white;
}

.step.completed .step-number {
    background: #27ae60;
    color: white;
}

.step-label {
    font-size: 0.9rem;
    font-weight: 500;
}

.step-divider {
    width: 60px;
    height: 2px;
    background: #ecf0f1;
    margin: 0 1rem;
    margin-top: -1rem;
}

/* Card Styles */
.import-card, .preview-card, .results-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    margin-bottom: 2rem;
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #ecf0f1;
}

.card-header h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #2c3e50;
    margin: 0;
}

.card-header i {
    color: #3498db;
    font-size: 1.5rem;
}

/* Introduction Section */
.intro-section {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2.5rem;
    border: 1px solid #dee2e6;
}

.intro-content {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.intro-icon {
    color: #3498db;
    font-size: 1.5rem;
    margin-top: 0.25rem;
    flex-shrink: 0;
}

.intro-text h3 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
    font-size: 1.1rem;
    font-weight: 600;
}

.intro-text p {
    margin: 0;
    color: #6c757d;
    line-height: 1.5;
}

/* Template Section */
.template-section {
    background: #ffffff;
    border: 2px solid #3498db;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    position: relative;
    overflow: hidden;
}

.template-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3498db, #2980b9);
}

.template-section h3 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.template-section h3::before {
    content: '📄';
    font-size: 1.2rem;
}

.template-section p {
    margin: 0 0 1rem 0;
    color: #6c757d;
}

.template-button {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
    border: none;
    padding: 0.875rem 1.75rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
}

.template-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #2980b9, #1f5f8b);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.template-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(52, 152, 219, 0.1);
}

/* Upload Zone */
.upload-zone {
    border: 3px dashed #bdc3c7;
    border-radius: 12px;
    padding: 3rem;
    text-align: center;
    transition: all 0.3s ease;
    background: #fafafa;
    position: relative;
    margin-bottom: 2rem;
}

.upload-zone.dragging {
    border-color: #3498db;
    background: #ebf3fd;
    transform: scale(1.02);
}

.upload-zone.has-file {
    border-color: #27ae60;
    background: #eafaf1;
}

.file-input {
    display: none;
}

.upload-icon {
    font-size: 4rem;
    color: #bdc3c7;
    margin-bottom: 1rem;
}

.upload-zone h3 {
    color: #2c3e50;
    margin: 0 0 0.5rem 0;
}

.upload-zone p {
    color: #7f8c8d;
    margin: 0.5rem 0;
}

.browse-button {
    background: #3498db;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
}

.browse-button:hover {
    background: #2980b9;
    transform: translateY(-1px);
}

.file-requirements {
    font-size: 0.9rem;
    color: #95a5a6;
    margin-top: 1rem;
}

/* File Selected */
.file-selected {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.file-icon {
    font-size: 2rem;
    color: #27ae60;
}

.file-info {
    flex: 1;
}

.file-info h4 {
    margin: 0 0 0.25rem 0;
    color: #2c3e50;
}

.file-info p {
    margin: 0;
    color: #7f8c8d;
    font-size: 0.9rem;
}

.remove-file {
    background: #e74c3c;
    color: white;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.remove-file:hover {
    background: #c0392b;
    transform: scale(1.1);
}

/* Preview Stats */
.preview-stats {
    display: flex;
    gap: 1rem;
}

.stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
}

.stat.valid {
    background: #d5f4e6;
    color: #27ae60;
}

.stat.invalid {
    background: #fadbd8;
    color: #e74c3c;
}

.stat.total {
    background: #dbeafe;
    color: #3498db;
}

/* Validation Errors */
.validation-errors {
    background: #fadbd8;
    border: 1px solid #e74c3c;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.validation-errors h3 {
    margin: 0 0 1rem 0;
    color: #e74c3c;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.error-list {
    max-height: 200px;
    overflow-y: auto;
}

.error-item {
    background: white;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    border-radius: 4px;
    color: #721c24;
    font-size: 0.9rem;
}

/* Data Table */
.data-table-container {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
    max-height: 500px;
    overflow-y: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th {
    background: #f8f9fa;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #2c3e50;
    border-bottom: 2px solid #ecf0f1;
    position: sticky;
    top: 0;
    z-index: 10;
}

.data-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #ecf0f1;
    vertical-align: middle;
}

.data-table tr:hover {
    background: #f8f9fa;
}

.invalid-row {
    background: #fadbd8 !important;
}

.editing-row {
    background: #e3f2fd !important;
}

.edit-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #bdc3c7;
    border-radius: 4px;
    font-size: 0.9rem;
}

.edit-input:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
}

.status-badge.valid {
    background: #d5f4e6;
    color: #27ae60;
}

.status-badge.invalid {
    background: #fadbd8;
    color: #e74c3c;
}

/* Action Buttons */
.action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
}

.btn-primary, .btn-secondary {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
}

.btn-primary {
    background: #3498db;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: #2980b9;
    transform: translateY(-1px);
}

.btn-secondary {
    background: #95a5a6;
    color: white;
}

.btn-secondary:hover:not(:disabled) {
    background: #7f8c8d;
    transform: translateY(-1px);
}

.btn-primary:disabled, .btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.btn-edit, .btn-save, .btn-cancel {
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.3s ease;
}

.btn-edit {
    background: #f39c12;
    color: white;
}

.btn-edit:hover:not(:disabled) {
    background: #e67e22;
}

.btn-save {
    background: #27ae60;
    color: white;
}

.btn-save:hover {
    background: #229954;
}

.btn-cancel {
    background: #e74c3c;
    color: white;
}

.btn-cancel:hover {
    background: #c0392b;
}

.edit-actions {
    display: flex;
    gap: 0.5rem;
}

/* Results */
.success-message {
    background: #d5f4e6;
    border: 1px solid #27ae60;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    margin-bottom: 2rem;
}

.success-message i {
    font-size: 3rem;
    color: #27ae60;
    margin-bottom: 1rem;
}

.success-message h3 {
    color: #27ae60;
    margin: 0 0 0.5rem 0;
}

.success-message p {
    color: #229954;
    margin: 0;
}

.import-errors {
    background: #fadbd8;
    border: 1px solid #e74c3c;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.import-errors h3 {
    margin: 0 0 1rem 0;
    color: #e74c3c;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.import-summary {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.summary-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    color: #2c3e50;
}

.summary-item.success {
    color: #27ae60;
}

.summary-item.error {
    color: #e74c3c;
}

.summary-item i {
    width: 20px;
    text-align: center;
}

/* Responsive Design */
@media (max-width: 768px) {
    .import-container {
        padding: 1rem;
    }

    .intro-content {
        flex-direction: column;
        gap: 0.75rem;
    }

    .intro-icon {
        align-self: flex-start;
    }

    .step-indicator {
        flex-direction: column;
        gap: 1rem;
    }

    .step-divider {
        width: 2px;
        height: 30px;
        margin: 0;
    }

    .action-buttons {
        flex-direction: column;
    }

    .data-table-container {
        overflow-x: auto;
    }

    .preview-stats {
        flex-direction: column;
        gap: 0.5rem;
    }
}
</style>
