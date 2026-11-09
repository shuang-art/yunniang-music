import { build } from 'esbuild'
import { watch } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const isWatch = process.argv.includes('--watch')

const common = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  external: ['electron'],
  sourcemap: true,
  logLevel: 'info',
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
  },
}

async function buildOnce() {
  await build({
    ...common,
    entryPoints: [path.join(root, 'electron/main.ts')],
    outfile: path.join(root, 'dist-electron/main.js'),
  })
  await build({
    ...common,
    entryPoints: [path.join(root, 'electron/preload.ts')],
    outfile: path.join(root, 'dist-electron/preload.js'),
  })
  console.log('[build-electron] done')
}

await buildOnce()

if (isWatch) {
  console.log('[build-electron] watching...')
  let timer = null
  watch(path.join(root, 'electron'), { recursive: true }, () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      buildOnce().catch((e) => console.error(e))
    }, 150)
  })
}
