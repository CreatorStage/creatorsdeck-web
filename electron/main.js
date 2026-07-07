import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let apiProcess = null;
let scraperProcess = null;

function getServicePath(serviceDirName) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, serviceDirName);
  } else {
    return path.resolve(__dirname, '../../', serviceDirName);
  }
}

function startServices() {
  const apiCwd = getServicePath('creatorsdeck-api');
  const scraperCwd = getServicePath('creatorsdeck-scraper');

  console.log(`Starting API from: ${apiCwd}`);
  if (app.isPackaged) {
    apiProcess = spawn('java', ['-jar', 'backend.jar'], {
      cwd: apiCwd,
      shell: true,
      windowsHide: true,
      env: { 
        ...process.env, 
        SPRING_PROFILES_ACTIVE: 'dev',
        JAVA_TOOL_OPTIONS: '-Xms256m -Xmx768m'
      }
    });
  } else {
    apiProcess = spawn('mvnw.cmd', ['spring-boot:run'], {
      cwd: apiCwd,
      shell: true,
      windowsHide: true,
      env: { 
        ...process.env, 
        SPRING_PROFILES_ACTIVE: 'dev',
        JAVA_TOOL_OPTIONS: '-Xms256m -Xmx768m'
      }
    });
  }

  apiProcess.stdout.on('data', (data) => console.log(`[API]: ${data}`));
  apiProcess.stderr.on('data', (data) => console.error(`[API ERR]: ${data}`));

  console.log(`Starting Scraper from: ${scraperCwd}`);
  scraperProcess = spawn('python', ['worker.py'], {
    cwd: scraperCwd,
    shell: true,
    windowsHide: true
  });

  scraperProcess.stdout.on('data', (data) => console.log(`[Scraper]: ${data}`));
  scraperProcess.stderr.on('data', (data) => console.error(`[Scraper ERR]: ${data}`));
}

function killProcessTree(proc) {
  if (proc && proc.pid) {
    exec(`taskkill /pid ${proc.pid} /T /F`, (err) => {
      if (err) {
        console.error(`Failed to kill process tree for PID ${proc.pid}:`, err);
      }
    });
  }
}

function stopServices() {
  console.log('Stopping background services...');
  killProcessTree(apiProcess);
  killProcessTree(scraperProcess);
}

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    resizable: true,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  win.setMenu(null);

  // Open external HTTP/HTTPS links in the default system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.whenReady().then(() => {
  startServices();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopServices();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
