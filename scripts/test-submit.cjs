const { spawn } = require('child_process');

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const proc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--user-data-dir=C:\\forma\\edge-test-data-3',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const resp = await fetch('http://127.0.0.1:9224/json/version');
      const data = await resp.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch {}
  }

  const targetResp = await (await fetch('http://127.0.0.1:9224/json/new?https://forma-app-kz.vercel.app', { method: 'PUT' })).json();
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

  await new Promise(r => setTimeout(r, 3000));

  // Open email form
  await evalInPage(`
    const el = [...document.querySelectorAll('*')].find(e => e.innerText && e.innerText.trim() === 'Email арқылы кіру');
    if (el) el.click();
  `);

  await new Promise(r => setTimeout(r, 1000));

  // Switch to registration
  await evalInPage(`
    const reg = [...document.querySelectorAll('*')].find(e => e.innerText && e.innerText.trim() === 'Аккаунтым жоқ — тіркелемін');
    if (reg) reg.click();
  `);

  await new Promise(r => setTimeout(r, 500));

  // Type email and password
  await evalInPage(`
    const inputs = document.querySelectorAll('input');
    if (inputs[0]) {
      inputs[0].value = 'newtester@forma.kz';
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (inputs[1]) {
      inputs[1].value = 'password123';
      inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
      inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
    }
  `);

  await new Promise(r => setTimeout(r, 500));

  // Click "Тіркелу"
  await evalInPage(`
    const submit = [...document.querySelectorAll('*')].find(e => e.innerText && e.innerText.trim() === 'Тіркелу');
    if (submit) submit.click();
  `);

  // Wait for network response
  await new Promise(r => setTimeout(r, 3000));

  const textAfterSubmit = await evalInPage('document.body.innerText');
  console.log('Text after clicking Register:', JSON.stringify(textAfterSubmit));

  pageWs.close();
  proc.kill();
  process.exit(0);
}

main().catch(console.error);
