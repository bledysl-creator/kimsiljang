import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// Vercel 은 루트(/)에, GitHub Pages 는 /kimsiljang/ 에 배포돼요.
const base = process.env.VERCEL ? '/' : process.env.GITHUB_PAGES ? '/kimsiljang/' : '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
