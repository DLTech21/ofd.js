import Vue from 'vue'
import App from './App.vue'
import './styles/index.css'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import axios from 'axios';

Vue.prototype.$axios = axios
library.add(fas)
Vue.config.productionTip = false
Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.use(ElementUI);

new Vue({
  render: h => h(App),
}).$mount('#app')
