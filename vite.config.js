import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// On Vercel, base is root '/'. On GitHub Pages, base is '/gsfcugottalent/'.
const isVercel = Boolean(process.env.VERCEL);
const isGitHubPages = !isVercel && Boolean(process.env.GITHUB_ACTIONS || process.env.GITHUB_PAGES || process.env.VITE_BASE_PATH);

// Dynamically use repo name from GitHub Actions (e.g. 'GSFCU_GOT_TALENT'), or custom base, or fallback to '/GSFCU_GOT_TALENT/'
const repoName = process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : '/GSFCU_GOT_TALENT/';
const basePath = process.env.VITE_BASE_PATH || (isGitHubPages ? repoName : '/');

/**
 * Middleware plugin enabling execution of identical /api/* serverless endpoints
 * against MongoDB Atlas during local development (`npm run dev`)
 */
function vercelApiDevPlugin() {
  return {
    name: 'vercel-api-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || (!req.url.startsWith('/api/') && req.url !== '/api')) {
          return next();
        }

        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;
        req.query = Object.fromEntries(parsedUrl.searchParams.entries());

        try {
          if (pathname === '/api/health') {
            const mod = await import('./api/health.js');
            return await mod.default(req, res);
          }
          if (pathname === '/api/registrations') {
            const mod = await import('./api/registrations.js');
            return await mod.default(req, res);
          }
          if (pathname === '/api/check-in' || pathname === '/api/registrations/check-in') {
            const mod = await import('./api/check-in.js');
            return await mod.default(req, res);
          }
          if (pathname === '/api/sponsors') {
            const mod = await import('./api/sponsors.js');
            return await mod.default(req, res);
          }
          if (pathname === '/api/stats') {
            const mod = await import('./api/stats.js');
            return await mod.default(req, res);
          }

          const regIdMatch = pathname.match(/^\/api\/registrations\/([^/]+)$/);
          if (regIdMatch) {
            req.query.id = decodeURIComponent(regIdMatch[1]);
            const mod = await import('./api/registrations/[id].js');
            return await mod.default(req, res);
          }

          return next();
        } catch (err) {
          console.error('[vercelApiDevPlugin] Error handling request:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss(), vercelApiDevPlugin()],
});
