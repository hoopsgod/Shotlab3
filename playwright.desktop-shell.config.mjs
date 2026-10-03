import base from "./playwright.config.mjs";

const target = process.env.DESKTOP_SHELL_BASE_URL;
export default {
  ...base,
  use: { ...base.use, baseURL: target || "http://127.0.0.1:4173",
    ...(target && process.env.HTTPS_PROXY ? { launchOptions: { proxy: { server: process.env.HTTPS_PROXY } } } : {}) },
  projects: [{ name: "desktop-shell", use: { viewport: { width: 1440, height: 1000 } } }],
  webServer: target ? undefined : {
    ...base.webServer,
    command: "node scripts/run-route-enhancers.mjs dev && vite --host 127.0.0.1 --port 4173",
  },
};
