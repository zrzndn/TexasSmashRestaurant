import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isGitHubPages = mode === 'github-pages';
  const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
  const base = isGitHubPages && repository && !repository.endsWith('.github.io')
    ? `/${repository}/`
    : '/';

  return {
    base,
    define: {
      __DEMO_MODE__: JSON.stringify(isGitHubPages)
    },
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true
        }
      }
    }
  };
});
