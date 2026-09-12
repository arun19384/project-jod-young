import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Register PWA Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((reg) => {
      const checkUpdate = () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      };
      checkUpdate();
      document.addEventListener('visibilitychange', checkUpdate);
      window.addEventListener('pageshow', checkUpdate);
    }).catch((err) => {
      console.log('SW registration failed: ', err);
    });
  });
}

// Do not reload an open form when a new worker takes control.
if ('serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || document.getElementById('pwa-update-button')) return;
    const button = document.createElement('button');
    button.id = 'pwa-update-button';
    button.textContent = 'มีเวอร์ชันใหม่ · แตะอัปเดต';
    button.style.cssText = 'position:fixed;top:max(env(safe-area-inset-top),12px);left:50%;transform:translateX(-50%);z-index:20000;padding:12px 18px;border:0;border-radius:12px;background:#d97757;color:#191917;font-size:16px';
    button.onclick = () => window.location.reload();
    document.body.appendChild(button);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
