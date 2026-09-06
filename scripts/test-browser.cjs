const { spawn } = require('child_process');
const http = require('http');

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const proc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--user-data-dir=C:\\forma\\edge-test-data',
    'about:blank'
  ]);

  // Wait for DevTools port
  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const resp = await fetch('http://127.0.0.1:9222/json/version');
      const data = await resp.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch {}
  }

  if (!wsUrl) {
    console.error('Failed to get WebSocket debugger URL');
    proc.kill();
    return;
  }

  console.log('Connected to Edge DevTools:', wsUrl);
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve) => ws.onopen = resolve);

  let id = 1;
  const send = (method, params = {}) => {
    const msgId = id++;
    ws.send(JSON.stringify({ id: msgId, method, params }));
    return msgId;
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log(`[BROWSER CONSOLE ${msg.params.type.toUpperCase()}]:`, msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]:', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
    }
  };

  send('Page.enable');
  send('Runtime.enable');

  // Create a new target/page
  const targetResp = await (await fetch('http://127.0.0.1:9222/json/new?https://forma-app-kz.vercel.app', { method: 'PUT' })).json();
  const pageWsUrl = targetResp.webSocketDebuggerUrl;
  console.log('Page target created:', targetResp.url);

  const pageWs = new WebSocket(pageWsUrl);
  await new Promise((resolve) => pageWs.onopen = resolve);

  pageWs.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log(`[PAGE CONSOLE ${msg.params.type.toUpperCase()}]:`, msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[PAGE EXCEPTION]:', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
    }
  };

  const sendPage = (method, params = {}) => {
    pageWs.send(JSON.stringify({ id: id++, method, params }));
  };

  sendPage('Runtime.enable');
  sendPage('Page.enable');

  await new Promise(r => setTimeout(r, 6000));

  // Evaluate DOM to see what rendered
  pageWs.send(JSON.stringify({
    id: id++,
    method: 'Runtime.evaluate',
    params: { expression: 'document.body.innerText' }
  }));

  pageWs.addEventListener('message', function onRes(e) {
    const msg = JSON.parse(e.data);
    if (msg.result && msg.result.result) {
      console.log('[PAGE INNER TEXT]:', JSON.stringify(msg.result.result.value));
      pageWs.removeEventListener('message', onRes);
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  pageWs.close();
  ws.close();
  proc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
