<template>
  <el-container class="elcontainer" >
    <el-row justify="center" align="middle" style="height: 100%">
      <el-col :xs="22" :sm="18" :md="12" :lg="8" :xl="6">
        <el-card class="login-form" shadow="always">
            <div class="logo-container">
            <img 
                src="@/assets/logo1.png" 
                alt="CPDFR"
                class="logo-image"
            >
            </div>
          <h2 style="text-align: center; margin-bottom: 20px; color: #333;">用户登录</h2>
          <el-form 
            @submit.prevent="handleLogin" 
            label-position="top"
            :model="loginForm"
            :rules="rules"
          >
            <el-form-item prop="account">
              <template #label>
                <span>{{ isEmailLogin ? '邮箱' : '用户名' }}</span>
                <el-link 
                  type="primary" 
                  @click="toggleLoginMethod"
                  style="margin-left: 10px; font-size: 12px;"
                >
                  {{ isEmailLogin ? '使用用户名登录' : '使用邮箱登录' }}
                </el-link>
              </template>
              <el-input 
                v-model="loginForm.account" 
                :placeholder="isEmailLogin ? '请输入邮箱' : '请输入用户名'" 
                :prefix-icon="isEmailLogin ? Message : User"
              />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input 
                v-model="loginForm.password" 
                type="password" 
                placeholder="请输入密码" 
                show-password
                :prefix-icon="Lock"
              />
            </el-form-item>
            <!-- 滑块验证 -->
            <el-form-item>
              <div class="slider-container">
                <div class="slider-track" ref="track">
                  <div 
                    class="slider-button"
                    :class="{ 'verified': isVerified }"
                    :style="{ left: sliderLeft + 'px' }"
                    @mousedown="startDrag"
                  >
                    {{ isVerified ? '✓' : '→' }}
                  </div>
                </div>
                <div v-if="!isVerified" class="slider-text">请按住滑块拖动到最右侧</div>
                <div v-else class="slider-success">验证通过</div>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                style="width: 100%; background-color: #409EFF; border: none;" 
                :loading="isLoading"
                :disabled="!isVerified"
                native-type="submit"
              >
                登录
              </el-button>
            </el-form-item>
            <el-form-item>
                <div style="text-align: center; font-size: 14px; margin-top: 10px;">
                    <span style="color: #666;">还没有账户？</span>
                    <el-link 
                    type="primary" 
                    style="font-size: 14px;"
                    @click="handleCreateAccount"
                    >
                    创建账户
                    </el-link>
                </div>
            </el-form-item>
            <el-form-item>
              <div v-if="errorMsg" style="color: red; text-align: center; font-size: 14px;">{{ errorMsg }}</div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </el-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { User, Lock, Message } from '@element-plus/icons-vue'

const router = useRouter()
const loginForm = ref({
  account: '',
  password: ''
})
const isEmailLogin = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')

// 表单验证规则
const rules = computed(() => ({
  account: [
    { required: true, message: isEmailLogin.value ? '请输入邮箱地址' : '请输入用户名', trigger: 'blur' },
    ...(isEmailLogin.value ? [{ 
      type: 'email', 
      message: '请输入有效的邮箱地址', 
      trigger: ['blur', 'change'] 
    }] : [])
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}))

// 切换登录方式
const toggleLoginMethod = () => {
  isEmailLogin.value = !isEmailLogin.value
  loginForm.value.account = ''
  errorMsg.value = ''
  isVerified.value = false
  sliderLeft.value = 0
}

// 滑块验证相关状态
const isVerified = ref(false)
const sliderLeft = ref(0)
const dragging = ref(false)
const startX = ref(0)
const startLeft = ref(0)
const track = ref(null)
const sliderWidth = ref(0)

onMounted(() => {
  sliderWidth.value = track.value?.offsetWidth - 40
})

const startDrag = (e) => {
  if (isVerified.value) return
  dragging.value = true
  startX.value = e.clientX
  startLeft.value = sliderLeft.value
  document.addEventListener('mousemove', onDragging)
  document.addEventListener('mouseup', stopDrag)
}

const onDragging = (e) => {
  if (!dragging.value) return
  const deltaX = e.clientX - startX.value
  let newLeft = startLeft.value + deltaX
  newLeft = Math.max(0, Math.min(newLeft, sliderWidth.value))
  sliderLeft.value = newLeft
  if (newLeft >= sliderWidth.value - 2) {
    isVerified.value = true
  }
}

const stopDrag = () => {
  dragging.value = false
  document.removeEventListener('mousemove', onDragging)
  document.removeEventListener('mouseup', stopDrag)
  if (!isVerified.value) {
    sliderLeft.value = 0
  }
}

const handleCreateAccount = async () =>{
    router.push("/register")
}

const handleLogin = async () => {
  if (!isVerified.value) return
  
  try {
    isLoading.value = true
    errorMsg.value = ''

    const formData = new URLSearchParams()
    if (isEmailLogin.value) {
      formData.append('email', loginForm.value.account)
    } else {
      formData.append('username', loginForm.value.account)
    }
    formData.append('password', loginForm.value.password)

    const url = isEmailLogin.value 
      ? 'http://localhost:8081/CPDFR/user/loginByEmail'
      : 'http://localhost:8081/CPDFR/user/loginByUsername'

    const response = await axios.post(
      url,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    if (response.data == "用户名或密码错误") {
        errorMsg.value = isEmailLogin.value ? '邮箱或密码错误' : '用户名或密码错误'
        resetVerification()
    } else {
        localStorage.setItem('userName', response.data)
        router.push('/index')
    }
  } catch (error) {
    errorMsg.value = '登录失败，请重试'
    resetVerification()
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

const resetVerification = () => {
  isVerified.value = false
  sliderLeft.value = 0
  loginForm.value.password = ''
}
</script>

<style scoped>
.elcontainer{
        height: 100vh;
        background: linear-gradient(
            135deg, 
            rgba(230, 247, 255, 0.9) 50%,  /* 浅蓝色 */
            rgba(255, 250, 205, 0.9) 50%   /* 浅黄色 */
        );
        /* 可选：添加细微的纹理效果 */
        background-image: 
            linear-gradient(135deg, 
            rgba(230, 247, 255, 0.9) 30%,
            rgba(255, 250, 205, 0.9) 70%),
            repeating-linear-gradient(
            45deg,
            transparent,
            transparent 3px,
            rgba(255,255,255,0.1) 3px,
            rgba(255,255,255,0.1) 6px
            );
        display: block;
}
.login-form {
  width: 100%;
  max-width: 400px;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}
/* Logo样式 */
.logo-container {
  text-align: center;
  margin: 20px 0 30px;
}

.logo-image {
  width: 120px;  /* 推荐尺寸 */
  height: auto;  /* 保持原始比例 */
  max-width: 100%;  /* 防止溢出 */
  transition: transform 0.3s ease;  /* 添加悬停动画 */
}

/* 添加悬停效果 */
.logo-image:hover {
  transform: scale(1.05);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .logo-image {
    width: 80px;
    margin-top: 10px;
  }
  .logo-container {
    margin: 10px 0 20px;
  }
}
.el-input__inner {
  border-radius: 8px;
}

::v-deep .el-form-item__content {
  display: block !important;
  width: 100%; /* 确保宽度占满 */
}

.el-button {
  border-radius: 8px;
  font-weight: bold;
}

/* 新增滑块样式 */
.slider-container {
  margin: 20px 0;
}

.slider-track {
  width: 100%;
  height: 40px;
  background-color: #f5f7fa;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

.slider-button {
  position: absolute;
  width: 40px;
  height: 40px;
  background-color: #409EFF;
  border-radius: 20px;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: background-color 0.3s;
}

.slider-button.verified {
  background-color: #67c23a;
  cursor: not-allowed;
}

.slider-text, .slider-success {
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.slider-success {
  color: #67c23a;
}
</style>