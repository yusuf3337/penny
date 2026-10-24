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

function openExpoGo() {
  execFile('xcrun', ['simctl', 'openurl', 'booted', expoUrl], (error) => {
    if (error) {
      console.error('Açık bir iOS simülatörü bulunamadı. Simulator uygulamasını açıp yeniden deneyin.');
      return;
    }
    console.log(`Expo Go açıldı: ${expoUrl}`);
  });
}

async function waitForMetro(child) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child?.exitCode !== null && child?.exitCode !== undefined) return;
    if (await isMetroReady()) { openExpoGo(); return; }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  console.error('Metro 60 saniye içinde hazır olmadı. Yukarıdaki Expo hatasını kontrol edin.');
}

async function main() {
  if (await isMetroReady()) {
    console.log('Metro zaten çalışıyor; Expo Go açılıyor.');
    openExpoGo();
    return;
  }

  const cli = path.join(__dirname, '../node_modules/expo/bin/cli');
  const child = spawn(process.execPath, [cli, 'start', '--go', '--host', 'lan', '--port', String(port)], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
  child.on('error', (error) => { console.error(error); process.exitCode = 1; });
  child.on('exit', (code) => { process.exitCode = code ?? 0; });
  process.on('SIGINT', () => child.kill('SIGINT'));
  void waitForMetro(child);
}

void main();
