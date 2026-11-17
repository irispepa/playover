// Patch & Kettle: cozy IT for a house full of neighbours.
import './style.css';
import { createApp } from './app.js';

export default {
  start(ctx) {
    const app = createApp(ctx);
    return { dispose() { app.dispose(); } };
  },
};
