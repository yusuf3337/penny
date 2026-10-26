const { spawn, execFile } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const port = 8081;
const expoUrl = `exp://127.0.0.1:${port}`;
const statusUrl = `http://127.0.0.1:${port}/status`;

function isMetroReady() {
  return new Promise((resolve) => {
    const request = http.get(statusUrl, { timeout: 1000 }, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve(body.includes('packager-status:running')));
    });
    request.on('error', () => resolve(false));
    request.on('timeout', () => { request.destroy(); resolve(false); });
  });
}

function openUrl() {
  return new Promise((resolve, reject) => {
    execFile('xcrun', ['simctl', 'openurl', 'booted', expoUrl], (error, _stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.trim() || error.message));
        return;
      }
      resolve();
    });
  });
}

async function openExpoGo() {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await openUrl();
      console.log(`Expo Go açıldı: ${expoUrl}`);
      return;
    } catch (error) {
      if (attempt === 1) {
        console.error(`Expo Go açılamadı: ${error.message}`);
        process.exitCode = 1;
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
}

async function waitForMetro(child) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child?.exitCode !== null && child?.exitCode !== undefined) return;
    if (await isMetroReady()) { await openExpoGo(); return; }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  console.error('Metro 60 saniye içinde hazır olmadı. Yukarıdaki Expo hatasını kontrol edin.');
}

async function main() {
  if (await isMetroReady()) {
    console.log('Metro zaten çalışıyor; Expo Go açılıyor.');
    await openExpoGo();
    return;
  }

  const cli = path.join(__dirname, '../node_modules/expo/bin/cli');
  const child = spawn(process.execPath, [cli, 'start', '--go', '--host', 'localhost', '--port', String(port)], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
  child.on('error', (error) => { console.error(error); process.exitCode = 1; });
  child.on('exit', (code) => { process.exitCode = code ?? 0; });
  process.on('SIGINT', () => child.kill('SIGINT'));
  void waitForMetro(child);
}

void main();
