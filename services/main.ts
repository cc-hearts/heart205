import {
  app,
  BrowserWindow,
  type BrowserWindowConstructorOptions,
} from 'electron'
import { setup } from '../scripts/utils/preset'
import { registerScheme } from './customScheme.js'
import { handleShowWindowEvent } from './events.js'
setup()
let mainBrowserWindow: BrowserWindow | null = null
app.whenReady().then(() => {
  const webPreferences: BrowserWindowConstructorOptions['webPreferences'] = {
    nodeIntegration: true,
    webSecurity: false,
    allowRunningInsecureContent: true,
    contextIsolation: false,
    webviewTag: true,
    spellcheck: false,
    disableHtmlFullscreenWindowResize: true,
    preload: `${__dirname}/preload.js`,
  }
  mainBrowserWindow = new BrowserWindow({ webPreferences, show: false })
  const IS_DEV = !!process.argv[2]
  if (IS_DEV) {
    mainBrowserWindow.webContents.openDevTools({ mode: 'undocked' })
  }
  handleShowWindowEvent()
  if (IS_DEV) {
    mainBrowserWindow.loadURL(process.argv[2])
  } else {
    registerScheme()
    mainBrowserWindow.loadURL('app://index.html')
  }
})