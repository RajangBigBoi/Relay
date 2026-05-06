import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx';

const root = createRoot(document.getElementById('root')!);

async function loadRuntimeFirebaseConfig() {
  try {
    const response = await fetch('/firebase-config.json', { cache: 'no-store' });
    if (!response.ok) return;
    const json = await response.json();
    (globalThis as any).__RELAY_FIREBASE_CONFIG__ = json;
  } catch {
    // No runtime config file found; env-based config will be used.
  }
}

async function bootstrap() {
  try {
    await loadRuntimeFirebaseConfig();
    const { default: App } = await import('./App.tsx');
    root.render(
      <StrictMode>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </StrictMode>,
    );
  } catch (error: any) {
    console.error('Failed to load app bundle:', error);
    root.render(
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: 680, width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>Relay failed to load</h1>
          <p style={{ marginTop: 10, fontSize: 14, color: '#475569' }}>
            The app bundle could not be initialized. This is usually a deployment or cached-asset issue.
          </p>
          <p style={{ marginTop: 10, fontSize: 12, color: '#64748b', wordBreak: 'break-word' }}>
            {error?.message || String(error)}
          </p>
        </div>
      </div>
    );
  }
}

bootstrap();
