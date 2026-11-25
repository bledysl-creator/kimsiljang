import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site at https://bledysl-creator.github.io/kimsiljang/
export default defineConfig({
  base: '/kimsiljang/',
  plugins: [react()],
});
