import "./assets/main.css";
import "./assets/animations.css";
import "./assets/professional-animations.css";
import "./assets/thunder-effect.css";
import { initAutoAnimations } from "./utils/autoAnimate";

import { createPinia } from "pinia";
import { createApp } from "vue";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Toast, {
  position: "top-right",
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false,
  transition: "Vue-Toastification__bounce",
  maxToasts: 5,
  newestOnTop: true,
});

app.mount("#app");

// Initialize auto-animations
setTimeout(initAutoAnimations, 100);
