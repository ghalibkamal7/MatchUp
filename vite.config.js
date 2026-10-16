import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    host: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'three':  ['three'],
          'gsap':   ['gsap'],
          'howler': ['howler'],
        },
      },
    },
  },
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.mp3', '**/*.wav', '**/*.ogg'],
  optimizeDeps: {
    include: ['three', 'gsap', 'howler'],
  },
});
