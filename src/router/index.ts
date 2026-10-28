import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';

import TabsPage from '../views/TabsPage.vue';

import { auth, authStateReady } from '@/firebase';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/bem-vindo',
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue'),
  },
  {
    path: '/criar-conta',
    component: () => import('@/views/LoginPage.vue'),
  },
  {
    path: '/recuperar-senha',
    component: () => import('@/views/LoginPage.vue'),
  },
  {
    path: '/perfil',
    component: () => import('@/views/PessoaPage.vue'),
  },
  {
    path: '/bem-vindo',
    component: () => import('@/views/BemvindoPage.vue'),
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/tab1',
      },
      {
        path: 'tab1',
        component: () => import('@/views/Tab1Page.vue'),
      },
      {
        path: 'tab2',
        component: () => import('@/views/Tab2Page.vue'),
      },
      {
        path: 'tab3',
        component: () => import('@/views/Tab3Page.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const isPublicRoute = ['/login', '/criar-conta', '/recuperar-senha'].includes(to.path);

  if (!auth) {
    return isPublicRoute ? true : '/login';
  }

  await authStateReady;
  const user = auth.currentUser;

  if (!user && !isPublicRoute) {
    return '/login';
  }

  if (user && isPublicRoute) {
    return '/bem-vindo';
  }

  return true;
});

export default router;
