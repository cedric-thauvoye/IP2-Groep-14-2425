<template>
    <div class="demo-banner">
        <div class="demo-content">
            <div class="demo-icon">
                🎯
            </div>
            <div class="demo-info">
                <h3>Demo Mode Active</h3>
                <p>You're exploring the <strong>Peer Evaluation System</strong> demonstration. All data is hardcoded for testing purposes.</p>
                <div class="demo-tips">
                    <span class="tip">💡 Try switching between user roles</span>
                    <span class="tip">📝 Create assessments as a teacher</span>
                    <span class="tip">✅ Submit evaluations as a student</span>
                </div>
            </div>
            <button @click="dismiss" class="dismiss-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['dismiss']);

const dismiss = () => {
    emit('dismiss');
};
</script>

<style scoped>
.demo-banner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem;
    margin-bottom: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.demo-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    max-width: 1200px;
    margin: 0 auto;
}

.demo-icon {
    font-size: 2rem;
    flex-shrink: 0;
}

.demo-info {
    flex: 1;
}

.demo-info h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
}

.demo-info p {
    margin: 0 0 1rem 0;
    opacity: 0.9;
}

.demo-tips {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.tip {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.75rem;
    border-radius: 15px;
    font-size: 0.85rem;
    backdrop-filter: blur(10px);
}

.dismiss-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 0.5rem;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s ease;
    flex-shrink: 0;
}

.dismiss-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
    .demo-content {
        flex-direction: column;
        text-align: center;
    }

    .demo-tips {
        justify-content: center;
    }

    .dismiss-btn {
        align-self: flex-end;
        position: absolute;
        top: 1rem;
        right: 1rem;
    }
}
</style>
