<template>
  <div class="container">
    <!-- 全局加载提示 -->
    <div v-if="showGlobalLoading" class="global-loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">内容加载中（首次加载稍慢），请稍候...</div>
    </div>
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="menu-container">
        <button class="menu-btn" @click="toggleMenu">
          <span class="menu-icon" style="color: grey;">☰</span>
        </button>
        <!-- 下拉菜单 -->
        <transition name="slide-fade">
          <div 
            v-if="isMenuOpen"
            class="dropdown-menu"   
           >
            <ul @mouseleave="startAutoClose" @mouseenter="cancelAutoClose" >
              <li class="user-info">
                <img src="@/assets/user.png" class="avatar">
                <span>{{ userName }}</span>
              </li>
              <li @click="handleKeywordSearch">关键词索引</li>
              <li class="disabled">功能建设中...</li>
              <li @click="handleLogout">登出</li>
            </ul>
          </div>
        </transition>
      </div>
      <div class="search-container">
        <input 
          type="text" 
          class="search-bar" 
          placeholder="输入关键词，用逗号分隔"
          v-model="searchInput"
        />
        <button class="search-btn" @click="handleSearch">检索</button>
      </div>
      <div class="logo-container">
        <!-- <img src="@/assets/riseLogo.png" class="logo"> -->
        <img src="@/assets/logo1.png" class="logo">
        <span class="beta-tag">@Beta 1.0.0</span>
      </div>
    </header>

    <!-- 主体内容区域 -->
    <main class="content">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <!-- Markdown 渲染容器 -->
        <div class="scroll-wrapper"> <!-- 新增滚动包装层 -->
          <!-- 加载状态 -->
          <div v-if="isLoading" class="loading">正在加载 Markdown 文件...</div>
          <!-- 错误提示 -->
          <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
          <!-- Markdown 渲染容器 -->
          <div v-else class="markdown-container" v-html="parsedMarkdown"></div>
        </div>
      </div>
      
      <!-- 右侧主内容面板 -->
      <div class="right-panel">
         
    <div class="pdf-container">
      <VuePdfEmbed
        :source="pdfSource"
        :page="currentPage"
        :scale="scale"
        @loaded="handlePdfLoaded"
        :key="pdfKey"  
        ref="pdfRef"
      />
    </div>
    <div class="pdf-controls">
        <button
          class="page-btn prev-btn"
         @click="prevPage" 
         :disabled="currentPage <= 1"
         >« 上一页</button>
        <div class="page-input-group">
          <input
            type="number"
            class="page-input"
            v-model.number="inputPage"
            :min="1"
            :max="pageCount"
            @keyup.enter="goToPage"
            @blur="validatePage"
          >
          <span class="total-pages">/ {{ pageCount }}</span>
        </div>
        <button 
          class="page-btn next-btn"
          @click="nextPage" 
          :disabled="currentPage >= pageCount"
        >
          下一页 »
        </button>
    

    </div>
      </div>
    </main>
  </div>
</template>

<script  setup>

import { ref, onMounted, watch ,nextTick,onBeforeUnmount,computed} from 'vue';
import MarkdownIt from 'markdown-it';
import mkatex from 'markdown-it-katex';
import hljs from 'highlight.js';
import axios from 'axios'; // 引入 axios
import VuePdfEmbed from 'vue-pdf-embed';

import 'katex/dist/katex.min.css';
import router from '../router';

// 初始化 markdown-it 实例
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  highlight: function (code, lang) {
    try {
      return hljs.highlight(code, { language: lang }).value;
    } catch (e) {
      return hljs.highlightAuto(code).value;
    }
  }

}).use(mkatex);  // 添加 katex 插件

// 搜索相关状态
const searchInput = ref('');


// PDF配置
const pdfSource = ref('https://rise-swu.cn:6565/CPDFR/pdf/6016B.pdf');
const currentPage = ref(1);
const pageCount = ref(0);
const inputPage = ref(1);
const scale = ref(1);
const pdfRef = ref(null);
const pdfKey = ref(0); // 用于强制重新渲染
const pdfLoaded = ref(false);


// 计算全局加载状态
const showGlobalLoading = computed(() => {
  return isLoading.value || !pdfLoaded.value;
});

// Markdown 配置
const markdownContent = ref('');
const parsedMarkdown = ref('');
const isLoading = ref(false);
const errorMessage = ref('');


// 获取 Markdown 文件
const fetchMarkdown = async (url) => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await axios.get(url);
    markdownContent.value = response.data;
    parsedMarkdown.value = md.render(markdownContent.value); // 使用 markdown-it 渲染
  } catch (error) {
    errorMessage.value = '无法加载 Markdown 文件，请检查 URL 是否正确。';
    console.error('加载 Markdown 文件失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 处理搜索请求
const handleSearch = async () => {
  const rawKeywords = searchInput.value;
  
  // 增强分割逻辑
  const keywords = rawKeywords
    .split(/[,，]/) // 支持中英文逗号
    .map(k => k.trim().replace(/\s+/g, ' ')) // 合并连续空格
    .filter(k => k !== '');

  if (keywords.length === 0) {
    
    return;
  }

  try {
    console.log('发送的关键词数组:', keywords);
    
    const response = await axios.post(
      'https://www.rise-swu.cn:6565/api/CPDFR/select/byKeyword',
      keywords, // 直接发送数组
      {
        headers: {
          'Content-Type': 'application/json'
        },
        transformRequest: [(data) => JSON.stringify(data)] // 确保数组被正确序列化
      }
    );

    if (typeof response.data === 'string') {
      parsedMarkdown.value = md.render(response.data);
    } else {
      throw new Error('返回数据格式异常');
    }
  } catch (error) {
    console.error('完整错误信息:', error);
    if (error.response) {
      errorMessage.value = `请求失败 [${error.response.status}]: ${error.response.data}`;
    } else {
      errorMessage.value = `网络错误: ${error.message}`;
    }
  }
}


onMounted(() => {
  import('highlight.js/styles/github.css');
  const markdownUrl = 'https://rise-swu.cn:6565/CPDFR/md/relevantText.md';
  fetchMarkdown(markdownUrl);
  // 引入highlight.js样式
  
});

//---------------------pdf处理----------------------------------------
// 正确获取PDF信息
const handlePdfLoaded = (pdf) => {
  console.log('PDF loaded:', pdf);
  pageCount.value = pdf.numPages;
  pdfLoaded.value = true; // 添加PDF加载完成标记
  console.log('Total pages:', pageCount.value);
};
// 监听当前页码变化同步输入框
watch(currentPage, (val) => {
  inputPage.value = val;
});


// 增强的页码跳转逻辑
const validatePage = () => {
  const validPage = Math.max(1, Math.min(
    Number.isInteger(inputPage.value) ? inputPage.value : 1,
    pageCount.value
  ));
  
  if (currentPage.value !== validPage) {
    currentPage.value = validPage;
    inputPage.value = validPage;
    // 强制重新渲染PDF组件
    pdfKey.value++;
    nextTick(() => {
      if (pdfRef.value?.pdf) {
        pageCount.value = pdfRef.value.pdf.numPages;
      }
    });
  }
};



const prevPage = () => {
  currentPage.value = Math.max(1, currentPage.value - 1);
};

const nextPage = () => {
  currentPage.value = Math.min(pageCount.value, currentPage.value + 1);
};

const goToPage = () => {
  currentPage.value = Math.max(1, Math.min(
    Number.isInteger(inputPage.value) ? inputPage.value : 1,
    pageCount.value
  ));
  inputPage.value = currentPage.value;
};

//---------------------菜单----------------------------------------
// 菜单状态
const userName = localStorage.getItem("userName")
const isMenuOpen = ref(false);
let closeTimer = null;

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  // 每次打开时启动自动关闭
  if (isMenuOpen.value) {
    startAutoClose();
  }
};

const cancelAutoClose = () => {
  console.log('取消自动关闭');
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
};

const startAutoClose = () => {
  console.log('启动自动关闭');
  // 先清除已有定时器
  if (closeTimer) {
    clearTimeout(closeTimer);
  }
  closeTimer = setTimeout(() => {
    console.log('执行自动关闭');
    isMenuOpen.value = false;
    closeTimer = null;
  }, 600);
};

onBeforeUnmount(() => {
  if (closeTimer) clearTimeout(closeTimer);
});

// 处理关键词搜索
const handleKeywordSearch = () => {
  isMenuOpen.value = false;
  router.replace('/index');
};

// 处理登出
const handleLogout = () => {
  isMenuOpen.value = false;
  console.log('执行登出操作');
  localStorage.removeItem('userName');
  router.replace('/');
};
</script>

<style scoped>

/* 整体容器 */
.container {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 改为固定视口高度 */
  overflow: hidden;  /* 新增：防止整个页面滚动 */
}

.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 999;
  backdrop-filter: blur(3px);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.loading-text {
  color: #555;
  font-size: 1.2em;
  letter-spacing: 1px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 顶部导航栏样式 */
.header {
  /* height: 60px; 给明确的高度值 */
  justify-content: space-between;
  flex-shrink: 0; /* 防止被压缩 */
  display: flex;
  align-items: center;
  /* background: #f0f2f5; */
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
  border-bottom: 1px solid #ccc;
}

/* 菜单相关样式 */

.user-info {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: default;
  border-bottom: 1px solid #eee;
}
.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 10px;
}
.menu-container {
  position: relative;
  margin-right: 1rem;
  display: inline-block;
}

.menu-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  position: relative;
}

.menu-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.menu-icon {
  font-size: 1.5rem;
  line-height: 1;
  margin-left: 1rem;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  width: 100%;
  margin-top: 8px;
  box-sizing: border-box;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  z-index: 10000;
}

.dropdown-menu ul {
  width: 100%;
  position: relative;
  list-style: none;
  padding: 8px 0;
  margin: 0;
}

.dropdown-menu li {
  user-select: none;
  position: relative;
  overflow: hidden;
  padding: 12px 16px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.dropdown-menu li:hover {
  background-color: #f5f5f5;
}

.dropdown-menu li:active {
  background-color: #ebebeb;
}

.dropdown-menu li:active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  animation: ripple 0.3s linear;
}

.disabled {
  color: #999 !important;
  cursor: not-allowed !important;
  background-color: transparent !important;
}

/* 菜单动画 */
.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

@keyframes ripple {
  from {
    opacity: 1;
    transform: scale(0);
  }
  to {
    opacity: 0;
    transform: scale(2);
  }
}

/* 点击外部关闭菜单 */
@media (hover: hover) {
  .dropdown-menu::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
  }
}

/* 新增搜索容器样式 */
.search-container {
  display: inline-flex;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-grow: 1;
  max-width: 70vw;
}

.search-btn {
  padding: 6px 12px;
   gap: 6px;
  background: linear-gradient(145deg, #f0f4ff, #e3e9ff);
  color: #2c3e50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  color: black;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.search-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  background: linear-gradient(145deg, #e3e9ff, #d6deff);
}
.menu-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.search-bar {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin: 0 1rem;
}

.logo-container {
  padding: 5px;
  margin-left: auto;
  display: flex;
  gap: 15px;
  align-items: center;
  max-width: 220px; /* 容器最大宽度限制 */
}
.logo {
  /* 基础尺寸限制 */
  max-height: 60px;  /* 最大高度限制 */
  max-width: 100px;  /* 最大宽度限制 */
  width: auto;       /* 保持原始宽高比 */
  height: auto;      /* 保持原始宽高比 */
  object-fit: contain; /* 保持比例填充容器 */
}


/* 移动端适配 */
@media (max-width: 768px) {
  .logo-container {
    max-width: 180px;  /* 缩小容器 */
    gap: 10px;
  }
  
  .logo {
    max-height: 35px;
    max-width: 80px;
  }

}

/* 超小屏幕处理 */
@media (max-width: 480px) {
  .logo-container {
    max-width: 140px;
  }
  
  .logo {
    max-height: 30px;
    max-width: 65px;
  }
}

.beta-tag {
  color: #ff9800;       /* 橙色文字 */
  background-color: #fffde7; /* 浅黄色背景 */
  padding: 4px 8px;     /* 内边距 */
  border-radius: 12px;  /* 圆角 */
  font-size: 0.9em;     /* 字体大小 */
  margin-left: 8px;     /* 与Logo间距 */
  font-weight: 500;     /* 中等粗体 */
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); /* 轻微阴影 */
}
/* 主体内容区域 */
.content {
  background: linear-gradient(
    135deg, 
    rgba(230, 247, 255, 0.9) 50%,  /* 浅蓝色 */
    rgba(255, 250, 205, 0.9) 50%   /* 浅黄色 */
  );
  /* 可选：添加细微的纹理效果 */
  background-image: 
    linear-gradient(135deg, 
      rgba(230, 247, 255, 0.9) 20%,
      rgba(255, 250, 205, 0.9) 80%),
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 3px,
      rgba(255,255,255,0.1) 3px,
      rgba(255,255,255,0.1) 6px
    );
  position: relative;
  display: flex;
  flex: 1;
  padding: 1rem;
  gap: 1rem;
  min-height: 0; /* 关键：修复flex容器高度溢出问题 */
  overflow: hidden; /* 防止内容区域产生滚动 */
}

/* 左右面板基础样式 */
.left-panel,
.right-panel {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

/* 左侧面板默认占45%宽度 */
.left-panel {
  flex: 1 1 45%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 外层容器隐藏溢出 */
  /* min-width: 200px; */
}

/* 新增关键滚动层 */
.scroll-wrapper {
  flex: 1;
  min-height: 0; /* 允许内容收缩 */
  overflow-y: auto; /* 真正产生滚动的层 */
  padding: 20px;
}

.loading {
  text-align: center;
  font-size: 16px;
  color: #888;
  padding: 20px;
}

.error {
  text-align: center;
  font-size: 14px;
  color: red;
  padding: 10px;
  background-color: #ffe6e6;
}
/* 公式容器样式 */
.katex {
  font-size: 1.1em;
  overflow-x: auto;
}


.katex-display {
  margin: 1em 0;
  padding: 0.5em;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.katex-display > .katex {
  white-space: pre-wrap;
}

/* 特殊字符转义 */
.katex .base {
  white-space: pre-wrap;
}
/* 右侧面板默认占55%宽度 */
.right-panel {
  flex: 1 1 55%;
}

/* 新增Markdown内容样式 */
.markdown-container {
  padding: 20px;
  line-height: 1.6;
}

.markdown-container h1 {
  font-size: 2em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}

.markdown-container code {
  background-color: #f3f3f3;
  padding: 2px 4px;
  border-radius: 4px;
}

.markdown-container pre {
  background-color: #f8f8f8;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-container pre code {
  background-color: transparent;
  padding: 0;
}

/* 如果样式是 scoped 的，需要使用深度选择器 */
.markdown-container :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
  border: 1px solid #ddd;
}

.markdown-container :deep(th),
.markdown-container :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.markdown-container :deep(th) {
  background-color: #f2f2f2;
  font-weight: bold;
}
@media (max-width: 768px) {
  .content {
    flex-direction: column;
  }
  
  .left-panel, .right-panel {
    flex: none;
    height: 50vh;
  }
}

/* 新增PDF相关样式 */
.right-panel {
  flex: 1 1 55%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 新增页码输入框验证样式 */
input:invalid {
  border-color: #ff4444;
  background-color: #ffe6e6;
}

.pdf-controls {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap; 
  justify-content: center;
  padding: 5px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  gap: 8px;
  align-items: center;
}

.page-controls input {
  width: 60px;
  padding: 4px;
  text-align: center;
}

/* 通用按钮样式 */
.page-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 25px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(145deg, #f0f4ff, #e3e9ff);
  color: #2c3e50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 按钮悬停效果 */
.page-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  background: linear-gradient(145deg, #e3e9ff, #d6deff);
}

/* 禁用状态 */
.page-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

/* 输入框组 */
.page-input-group {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 20px;
  padding: 4px 12px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 页码输入框 */
.page-input {
  width: 60px;
  padding: 8px;
  border: none;
  background: transparent;
  text-align: center;
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
  -moz-appearance: textfield;
}

.page-input::-webkit-outer-spin-button,
.page-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* 输入框聚焦状态 */
.page-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(70, 130, 255, 0.2);
  border-radius: 4px;
}

/* 总页数显示 */
.total-pages {
  color: #7f8c8d;
  font-size: 14px;
  margin-left: 4px;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .page-btn {
    padding: 8px 16px;
    font-size: 14px;
  }
  
  .page-input {
    width: 50px;
  }
}

/* 优化PDF容器尺寸 */
.pdf-container {
  flex: 1;
  overflow: auto;
  background: #f0f0f0;
  padding: 20px;
  transform-origin: 0 0; /* 确保缩放基于左上角 */
  transition: transform 0.3s ease; /* 添加平滑过渡 */
}


/* 按钮基础样式 */
button {
  padding: 6px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

select {
  padding: 4px;
  border-radius: 4px;
}

/* 适配移动端 */

@media (max-width: 768px) {
  .vue-pdf-embed {
    min-width: 100%;
    min-height: auto;
  }
}

</style>