// Lanternfall: seven days in a canal town, six neighbours and one missing moon.
import './style.css';
import { createApp } from './ui/app.js';

export default {
  start(ctx) {
    const app = createApp(ctx);
    return { dispose() { app.dispose(); } };
  },
};
