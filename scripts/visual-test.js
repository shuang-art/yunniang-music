// 视觉验证：用 mock preload 逐个路由截图，检查 10 个页面真实渲染
const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

const ROOT = '/home/zeroshun/workspace/yunniang-music'
const OUT = '/tmp/ui-shots'
fs.mkdirSync(OUT, { recursive: true })

app.commandLine.appendSwitch('no-sandbox')
app.disableHardwareAcceleration()

const ROUTES = [
  ['home', '/home'],
  ['search', '/search'],
  ['daily', '/daily'],
  ['radar', '/radar'],
  ['heart', '/heart'],
  ['roam', '/roam'],
  ['square', '/square'],
  ['rank', '/rank'],
  ['like', '/like'],
  ['subscribed', '/subscribed'],
  ['cloud', '/cloud'],
  ['playlist', '/playlist/101'],
  ['settings', '/settings'],
]

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1360, height: 900, show: false,
    webPreferences: {
      preload: path.join(ROOT, 'scripts/test-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const indexUrl = 'file://' + path.join(ROOT, 'dist/index.html')
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))

  const errors = []
  win.webContents.on('console-message', (_e, level, message) => {
    if (level >= 2 && !message.includes('Download the React DevTools')) {
      errors.push(message.slice(0, 300))
    }
  })
  win.webContents.on('did-fail-load', (_e, code, desc) => {
    errors.push(`LOAD FAIL ${code} ${desc}`)
  })

  await win.loadURL(indexUrl + '#/home')
  await wait(3500)

  for (const [name, route] of ROUTES) {
    try {
      await win.loadURL(indexUrl + '#' + route)
      await wait(2600)
      const img = await win.webContents.capturePage()
      fs.writeFileSync(path.join(OUT, `${name}.png`), img.toPNG())
      // 抓页面可见文本，判断是否空白/报错
      const txt = await win.webContents.executeJavaScript(
        `(document.querySelector('.content-scroll')||document.body).innerText.slice(0,160)`
      )
      console.log(`[SHOT] ${name.padEnd(11)} ${route.padEnd(16)} text="${String(txt).replace(/\s+/g,' ').slice(0,90)}"`)
    } catch (e) {
      console.log(`[FAIL] ${name} ${e.message}`)
    }
  }

  if (errors.length) {
    console.log('\n=== CONSOLE ERRORS ===')
    ;[...new Set(errors)].slice(0, 15).forEach((e) => console.log(' -', e))
  } else {
    console.log('\n=== 无控制台错误 ===')
  }
  app.quit()
})
