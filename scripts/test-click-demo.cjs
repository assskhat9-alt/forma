const { spawn } = require('child_process');

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const proc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    '--user-data-dir=C:\\forma\\edge-test-data-demo',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const resp = await fetch('http://127.0.0.1:9225/json/version');
      const data = await resp.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch {}
  }

  const targetResp = await (await fetch('http://127.0.0.1:9225/json/new?https://forma-app-kz.vercel.app', { method: 'PUT' })).json();
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
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[EXCEPTION]:', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
    }
  };

  // Wait for initial render
  await new Promise(r => setTimeout(r, 3000));

  const initialText = await evalInPage('document.body.innerText');
  console.log('Initial page text:', JSON.stringify(initialText));

  // Click "Тест режимімен кіру"
  console.log('Clicking "Тест режимімен кіру"...');
  const clickedDemo = await evalInPage(`
    (() => {
      const el = [...document.querySelectorAll('*')].find(e => e.innerText && e.innerText.trim() === 'Тест режимімен кіру');
      if (el) {
        el.click();
        return true;
      }
      return false;
    })()
  `);
  console.log('Demo button clicked:', clickedDemo);

  // Wait for transition to main app
  await new Promise(r => setTimeout(r, 4000));

  const textAfterDemo = await evalInPage('document.body.innerText');
  console.log('Text after demo login:', JSON.stringify(textAfterDemo));

  pageWs.close();
  proc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
