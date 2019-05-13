import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Connectors from './views/Connectors.vue'
import Sensor from './views/Sensor.vue'
import Datasheet from './views/Datasheet.vue'
import Dongle from './views/Dongle.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/home',
      name: 'home',
      component: Home
    },
    {
      path: '/dongle',
      name: 'dongle',
      component: Dongle
    },
    {
      path: '/sensor',
      name: 'sensor',
      component: Sensor
    },
    {
      path: '/connectors',
      name: 'connectors',
      component: Connectors
    },
    {
      path: '/datasheet',
      name: 'Datasheet',
      component: Datasheet
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/About.vue')
    },
    { path: '*', redirect: { name: 'home' }}
  ]
})
