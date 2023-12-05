import Vue from 'vue'
import App from './App.vue'
import FEMonitor from '../../index'
Vue.config.productionTip = false
Vue.use(FEMonitor, {
  reportUrl: 'http://localhost:3000/report',
  token: '121324',
})
new Vue({
  render: h => h(App),
}).$mount('#app')
