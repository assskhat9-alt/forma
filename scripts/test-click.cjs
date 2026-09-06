const { spawn } = require('child_process');

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const proc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--user-data-dir=C:\\forma\\edge-test-data-2',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const resp = await fetch('http://127.0.0.1:9223/json/version');
      const data = await resp.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch {}
  }

  const targetResp = await (await fetch('http://127.0.0.1:9223/json/new?https://forma-app-kz.vercel.app', { method: 'PUT' })).json();
  const pageWs = new WebSocket(targetResp.webSocketDebuggerUrl);
  await new Promise((resolve) => pageWs.onopen = resolve);

  let id = 1;
  const evalInPage = async (expr) => {
    return new Promise((resolve) => {
      const curId = id++;
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === curId) {
          pageWs.removeEventListener('message', handler);
          resolve(msg.result?.result?.value);
        }
      };
      pageWs.addEventListener('message', handler);
      pageWs.send(JSON.stringify({
        id: curId,
        method: 'Runtime.evaluate',
        params: { expression: expr, returnByValue: true, awaitPromise: true }
      }));
    });
  };

  pageWs.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log(`[CONSOLE ${msg.params.type}]:`, msg.params.args.map(a => a.value || a.description).join(' '));
    }
  };

  await new Promise(r => setTimeout(r, 3000));

  // Find and click "Email арқылы кіру"
  console.log('Finding Email button...');
  const clicked = await evalInPage(`
    (() => {
      const el = [...document.querySelectorAll('*')].find(e => e.innerText && e.innerText.trim() === 'Email арқылы кіру');
      if (el) {
        el.click();
        return true;
      }
      return false;
    })()
  `);
  console.log('Email button clicked:', clicked);

  await new Promise(r => setTimeout(r, 1500));

  const textAfterEmail = await evalInPage('document.body.innerText');
  console.log('Text after clicking email:', JSON.stringify(textAfterEmail));

  // Find and click "Apple ID арқылы кіру"
  const clickedApple = await evalInPage(`
    (() => {
      // Go back first
      const back = [...document.querySelectorAll('*')].find(e => e.innerText && e.innerText.trim() === 'Артқа');
      if (back) back.click();
      return true;
    })()
  `);
  await new Promise(r => setTimeout(r, 1000));

  const clickedAppleBtn = await evalInPage(`
    (() => {
      const apple = [...document.querySelectorAll('*')].find(e => e.innerText && e.innerText.trim() === 'Apple ID арқылы кіру');
      if (apple) {
        apple.click();
        return true;
      }
      return false;
    })()
  `);
  console.log('Apple button clicked:', clickedAppleBtn);
  await new Promise(r => setTimeout(r, 3000));

  const textAfterApple = await evalInPage('document.body.innerText');
  console.log('Text after Apple click:', JSON.stringify(textAfterApple));

  pageWs.close();
  proc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
