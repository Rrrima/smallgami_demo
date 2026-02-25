import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { sharedPublicPlugin } from '../shared/viteSharedPublic.js'

function saveAssetsPlugin() {
  return {
    name: 'vite-plugin-save-assets',
    configureServer(server) {
      server.middlewares.use('/api/save-assets', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', () => {
          try {
            const { folder, assets } = JSON.parse(body)
            const dir = path.resolve(import.meta.dirname, 'public/assets', folder)
            fs.mkdirSync(dir, { recursive: true })

            const saved = []
            for (const { name, dataUrl } of assets) {
              const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
              if (!match) continue
              const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
              const filename = `${name}.${ext}`
              fs.writeFileSync(path.join(dir, filename), Buffer.from(match[2], 'base64'))
              saved.push(filename)
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, folder, saved }))
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ ok: false, error: err.message }))
          }
        })
      })
    },
  }
}

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
  plugins: [saveAssetsPlugin(), engineDepsPlugin(), react(), sharedPublicPlugin('../shared/public')],
  assetsInclude: ['**/*.wasm'],
  resolve: {
    alias: {
      '@smallgami/engine': path.resolve(import.meta.dirname, '../../smallGami/src/index.ts'),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
  },
})
