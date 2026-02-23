import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Resolves bare imports (e.g. "gsap") made from engine source files using
// this demo's node_modules, since the engine has no node_modules of its own.
function engineDepsPlugin(): Plugin {
  return {
    name: 'vite-plugin-engine-deps',
    enforce: 'pre',
    async resolveId(id, importer) {
      if (
        importer?.includes('/smallGami/src/') &&
        !id.startsWith('.') &&
        !id.startsWith('/') &&
        !id.startsWith('\0')
      ) {
        return this.resolve(id, path.join(__dirname, '_virtual_.ts'), { skipSelf: true });
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [engineDepsPlugin(), react()],
  assetsInclude: ['**/*.wasm'],
  resolve: {
    alias: {
      '@smallgami/engine': path.resolve(__dirname, '../../smallGami/src/index.ts'),
    },
  },
  server: {
    port: 3001,
    open: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
});
