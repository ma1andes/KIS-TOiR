import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initKeycloak } from './auth/keycloak';

const root = ReactDOM.createRoot(document.getElementById('root')!);

async function bootstrap() {
  await initKeycloak();

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap().catch((error) => {
  console.error('Failed to initialize authentication', error);

  root.render(
    <React.StrictMode>
      <div>Authentication initialization failed. Check your environment variables.</div>
    </React.StrictMode>,
  );
});
