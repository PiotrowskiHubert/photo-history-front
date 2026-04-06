import 'leaflet/dist/leaflet.css';
import '@vuepic/vue-datepicker/dist/main.css';
import '@/assets/styles/index.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import App from './App.vue';
import router from './router';
import { initLeafletIcons } from './modules/map/map.icons';

library.add(fas);
initLeafletIcons();

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.component('FontAwesomeIcon', FontAwesomeIcon);
app.component('VueDatePicker', VueDatePicker);

app.mount('#app');
