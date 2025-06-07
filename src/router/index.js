import { createRouter, createWebHistory } from 'vue-router'; // Vue3 写法
import MainPage from '@/views/MainPage.vue'; // 引入新页面
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue';

const routes = [
  {
    path: '/login',
    name: 'LoginView',
    component: LoginView, 
    meta:{
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView, 
    meta:{
      requiresAuth: false
    }
  },
  {
    path: '/index',
    name: 'MainPage',
    component: MainPage, 
    meta:{
      requiresAuth: true
    }
  },
  {
    path: '/',
    redirect: '/login'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta.requiresAuth
  const userName = localStorage.getItem('userName')
  
  if (requiresAuth && !userName) {
    next('/login')
  } else if (!requiresAuth && userName) {
    next('/index')
  } else {
    next()
  }
})

export default router;