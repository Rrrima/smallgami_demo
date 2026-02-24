import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { sharedPublicPlugin } from '../shared/viteSharedPublic.js'

function engineDepsPlugin() {
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
        return this.resolve(id, path.join(import.meta.dirname, '_virtual_.ts'), { skipSelf: true })
      }
      return null
    },
  }
}

export default defineConfig({
  plugins: [engineDepsPlugin(), react(), sharedPublicPlugin('../shared/public')],
  assetsInclude: ['**/*.wasm'],
  resolve: {
    alias: {
      '@smallgami/engine': path.resolve(import.meta.dirname, '../../smallGami/src/index.ts'),
    },
  },
  server: {
    port: 3003,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
  },
})
