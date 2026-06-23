import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'es2020',
    cssMinify: true,
    assetsInlineLimit: 4096,
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        skills: resolve(__dirname, 'skills.html'),
        projects: resolve(__dirname, 'projects.html'),
        experience: resolve(__dirname, 'experience.html'),
        certifications: resolve(__dirname, 'certifications.html'),
        contact: resolve(__dirname, 'contact.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('three')) {
            return 'vendor-three';
          }
          if (id.includes('node_modules/gsap') || id.includes('gsap')) {
            return 'vendor-gsap';
          }
        },
      },
    },
  },
  css: {
    devSourcemap: false,
  },
});
