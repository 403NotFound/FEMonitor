import Vue from 'vue'
import App from './App.vue'
import FEMonitor from '../../index'
Vue.config.productionTip = false

// try {
//   Vue.use(FEMonitor, {
//     reportUrl: 'http://localhost:3000/report',
//     token: '121324',
//     record: true,
//   })
// } catch (error) {
//   console.error('Error occurred while using FEMonitor:', error)
// }
new Vue({
  render: h => h(App),
}).$mount('#app')
