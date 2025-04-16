import { createRouter, createWebHistory } from 'vue-router'
import Create from '../views/Create.vue'
import Hinge from '../views/Hinge.vue'
import Demo from '../views/Demo.vue'

const routes = [
  {
    path: '/',
    redirect: '/create'
  },
  {
    path: '/create',
    name: 'Create',
    component: Create
  },
  {
    path: '/hinge',
    name: 'Hinge',
    component: Hinge
  },
  {
    path: '/demo',
    name: 'Demo',
    component: Demo
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
