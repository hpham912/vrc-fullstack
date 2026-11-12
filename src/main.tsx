import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fullscreen splash: Android 12+ forces the system splash icon into a
// small circle, so show the fullscreen lockup from here as soon as the
// web app starts. It hides once the app has loaded (see App.tsx).
if (typeof window !== 'undefined') {
  import('@capacitor/splash-screen')
    .then(({ SplashScreen }) => {
      SplashScreen.show({ showDuration: 3000, autoHide: true }).catch(() => {});
    })
    .catch(() => {});
}

createRoot(document.getElementById('root')!).render(<App />);
