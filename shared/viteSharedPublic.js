import fs from 'node:fs'
import path from 'node:path'

/**
 * Vite plugin that serves files from a shared public directory.
 * The demo's own public/ directory always takes priority — shared files
 * are only used as a fallback for paths not found locally.
 *
 * Works for both dev (middleware) and build (copies to outDir).
 *
 * @param {string} sharedPublicDir - Path to the shared public dir, relative to project root
 */
export function sharedPublicPlugin(sharedPublicDir) {
  let resolvedSharedDir
  let resolvedConfig

  return {
    name: 'vite-shared-public',

    configResolved(config) {
      resolvedSharedDir = path.resolve(config.root, sharedPublicDir)
      resolvedConfig = config
    },

    configureServer(server) {
      // Pre-middleware: runs BEFORE Vite's built-in static file serving.
      // We check the project's own publicDir first so local files always win.
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url || '').split('?')[0])
        if (url.includes('..')) return next()

        // If the file exists in the project's own public dir, skip — let Vite serve it
        if (resolvedConfig.publicDir) {
          const localPath = path.join(resolvedConfig.publicDir, url)
          try {
            if (fs.statSync(localPath).isFile()) return next()
          } catch {}
        }

        // Try serving from the shared public dir
        const sharedPath = path.join(resolvedSharedDir, url)
        try {
          const stat = fs.statSync(sharedPath)
          if (stat.isFile()) {
            const ext = path.extname(sharedPath).toLowerCase()
            const mime = MIME_TYPES[ext]
            if (mime) res.setHeader('Content-Type', mime)
            fs.createReadStream(sharedPath).pipe(res)
            return
          }
        } catch {}

        next()
      })
    },

    closeBundle() {
      if (resolvedConfig.command !== 'build') return
      const outDir = path.resolve(resolvedConfig.root, resolvedConfig.build.outDir)
      copyDirSync(resolvedSharedDir, outDir)
    },
  }
}

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.wasm': 'application/wasm',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true })
      copyDirSync(srcPath, destPath)
    } else if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}
