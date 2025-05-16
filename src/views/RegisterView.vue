<template>
  <el-container class="elcontainer">
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
          <h2 style="text-align: center; margin-bottom: 20px; color: #333;">用户注册</h2>
          <el-form 
          @submit.prevent="handleRegister" 
          label-position="top" 
          :model="registerForm"
          :rules="rules"
           ref="formRef"
          >
            <el-form-item label="用户名" prop="username" >
              <el-input 
                v-model="registerForm.username" 
                placeholder="请输入用户名" 
                :prefix-icon="User"
              />
            </el-form-item>
            
            <el-form-item label="邮箱" prop="email">
              <el-input 
                v-model="registerForm.email" 
                placeholder="请输入邮箱" 
                :prefix-icon="Message"
              />
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input 
                v-model="registerForm.password" 
                type="password" 
                placeholder="请输入密码" 
                show-password
                :prefix-icon="Lock"
              />
            </el-form-item>

            <el-form-item label="确认密码" prop="passwordConfirm">
              <el-input 
                v-model="registerForm.passwordConfirm" 
                type="password" 
                placeholder="请再次输入密码" 
                show-password
                :prefix-icon="Lock"
              />
          </el-form-item>

            <el-form-item label="邀请码" prop="inviteCode">
              <el-input 
                v-model="registerForm.inviteCode" 
                placeholder="请输入邀请码" 
                :prefix-icon="Key"
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
                注册
              </el-button>
            </el-form-item>

            <el-form-item>
              <div style="text-align: center; font-size: 14px; margin-top: 10px;">
                <span style="color: #666;">已有账号？</span>
                <el-link 
                  type="primary" 
                  style="font-size: 14px;"
                  @click="handleLogin"
                >
                  去登录
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { User, Lock, Message, Key } from '@element-plus/icons-vue'

const INVITCODE = "LWZDLWF"
const formRef = ref(null)
const router = useRouter()
const registerForm = ref({
  username: '',
  email: '',
  password: '',
  passwordConfirm: '',
  inviteCode: ''
})
// 验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 16, message: '长度在 3 到 16 个字符', trigger: 'blur' },
    { 
      pattern: /^[a-zA-Z0-9_]+$/,
      message: '只能包含字母、数字和下划线',
      trigger: 'blur'
    }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { 
      type: 'email', 
      message: '请输入有效的邮箱地址', 
      trigger: ['blur', 'change'] 
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' },
    {
      pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
      message: '必须包含字母和数字',
      trigger: 'blur'
    }
  ],
  passwordConfirm: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.value.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: ['blur', 'change']
    }
  ]
}


const isLoading = ref(false)
const errorMsg = ref('')


// 滑块验证相关状态（与登录页面相同）
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

const handleLogin = () => {
  router.push('/login')
}

const handleRegister = async () => {
    try {
    await formRef.value.validate()
    if (!isVerified.value) return
    
    // 简单前端验证
    if (!registerForm.value.username || 
        !registerForm.value.email || 
        !registerForm.value.password||
        !registerForm.value.passwordConfirm) {
        errorMsg.value = '请填写所有必填字段'
        resetVerification()
        return
    }
    if (registerForm.value.password !== registerForm.value.passwordConfirm) {
      errorMsg.value = '两次输入密码不一致'
      resetVerification()
      return
    }
    if(!registerForm.value.inviteCode){
        errorMsg.value = '请联系管理员获取邀请码'
        resetVerification()
        return
    }
    if(registerForm.value.inviteCode != INVITCODE){
        errorMsg.value = '请联系管理员获取正确邀请码'
        resetVerification()
        return
    }
    isLoading.value = true
    errorMsg.value = ''
    
    try {
        const response = await axios.post(
          //生产环境用
        'https://www.rise-swu.cn:6565/api/CPDFR/user/register',
        //开发环境用
        // 'http://localhost:8081/CPDFR/user/register',
        {
            username: registerForm.value.username,
            email: registerForm.value.email,
            password: registerForm.value.password,
        },
        {
            headers: {
            'Content-Type': 'application/json'
            }
        }
        )

        if (response.data == "注册成功") {
        router.push('/login')
        } else {
        errorMsg.value = response.data || '用户名或邮箱已存在，注册失败'
        resetVerification()
        }
    } catch (error) {
        errorMsg.value = error.response?.data?.message || '注册请求失败'
        resetVerification()
        console.error(error)
    } finally {
        isLoading.value = false
    }
    }catch (error){
        console.log('表单验证失败:', error)
    }

}

const resetVerification = () => {
  isVerified.value = false
  sliderLeft.value = 0
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
  padding: 10px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}
/* Logo样式 */
.logo-container {
  text-align: center;
  /* margin: 20px 0 30px; */
}

.logo-image {
  width: 100px;  /* 推荐尺寸 */
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