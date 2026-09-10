import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, basename } from 'node:path';

export function assertOwnedDatabase(name, runId) {
  if (!/^[a-z0-9]+$/.test(runId) || name !== `Quarry_Demo_${runId}_Evaluation`) throw new Error('Refusing cleanup of an unowned database');
  return name;
}

export function runCommand(command, args, { cwd, env = process.env, timeout = 180_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '', expired = false;
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { output += data; });
    const timer = setTimeout(() => { expired = true; child.kill(); }, timeout);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      if (expired) reject(new Error(`${command} timed out`));
      else if (code !== 0) reject(new Error(`${command} exited ${code}: ${output.slice(-5000)}`));
      else resolve(output);
    });
  });
}

export async function until(action, predicate, timeout = 60_000) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    try { last = await action(); if (predicate(last)) return last; } catch (error) { last = error.message; }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Readiness deadline exceeded: ${JSON.stringify(last)}`);
}

export async function startDisplay({ previewUrl = '', mediaDir } = {}) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Quarry demo studio</title><style>
    *{box-sizing:border-box}body{margin:0;background:#0c1424;color:#edf3ff;font:20px 'Segoe UI',sans-serif}
    main{padding:56px 64px}small{color:#9aacd1;letter-spacing:3px;font-size:15px}h1{font-size:38px;font-weight:600;margin:16px 0 12px}
    p{color:#bccbe5;line-height:1.6}#request{color:#8fe3c4;margin-top:28px;font:21px Consolas,monospace}
    #status{font:18px Consolas,monospace;color:#9aacd1;margin:12px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:19px/1.55 Consolas,monospace;margin:0;max-height:380px;overflow:auto}
    iframe{width:100%;height:345px;background:white;border:0;border-radius:12px;margin-top:18px}button{font:18px 'Segoe UI';padding:12px;border:1px solid #849ac4;border-radius:7px}
    #feedback{color:#8fe3c4}video{width:1280px;height:720px;background:#000}
    </style></head><body><main><small>QUARRY / LIVE LOCAL DEMONSTRATION</small><h1 id="title">Quarry services</h1>
    <p id="subtitle">Real execution · isolated evaluation catalog</p><div id="request"></div><div id="status"></div><pre id="output"></pre>
    <section id="preview" hidden><iframe title="Illustrative component preview" sandbox="allow-scripts"></iframe><p id="feedback">Waiting for preview handshake</p><button id="after">Continue in the host</button></section></main>
    <script>
    window.showResult=(request,status,output)=>{document.querySelector('#request').textContent=request;document.querySelector('#status').textContent=String(status);document.querySelector('#output').textContent=output;};
    if(location.pathname==='/preview'){
      document.querySelector('#title').textContent='Try the component. Keep the context.';
      document.querySelector('#subtitle').textContent='The shipped illustrative bundle, running in a sandboxed frame. Changes last only inside this preview.';
      document.querySelector('#preview').hidden=false;
      const frame=document.querySelector('iframe'), token=crypto.randomUUID();
      frame.addEventListener('load',()=>frame.contentWindow.postMessage({type:'init',sessionToken:token,protocolVersion:1},'*'));
      addEventListener('message',event=>{const data=event.data;if(event.source!==frame.contentWindow||data?.sessionToken!==token||data.protocolVersion!==1)return;
        document.querySelector('#feedback').textContent=data.type==='ready'?'Preview ready':data.type==='focus-exit'?'Keyboard focus returned to the host':data.type==='dismiss'?'Escape returned control to the host':'Preview reported '+data.type;
        if(data.type==='focus-exit'||data.type==='dismiss')document.querySelector('#after').focus();
      });
      frame.src=${JSON.stringify(previewUrl)};
    }
    </script></body></html>`;
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(404); response.end(); return; }
    if (url.pathname === '/' || url.pathname === '/preview') { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end(html); return; }
    if (mediaDir && /^\/media\/[a-z0-9-]+\.webm$/.test(url.pathname)) {
      try {
        const path = join(mediaDir, basename(url.pathname)), info = await stat(path);
        const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range ?? '');
        const start = range ? Number(range[1]) : 0, end = range?.[2] ? Number(range[2]) : info.size - 1;
        if (start > end || end >= info.size) { response.writeHead(416); response.end(); return; }
        response.writeHead(range ? 206 : 200, { 'Content-Type': 'video/webm', 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1,
          ...(range ? { 'Content-Range': `bytes ${start}-${end}/${info.size}` } : {}) });
        if (request.method === 'HEAD') response.end(); else createReadStream(path, { start, end }).pipe(response);
      } catch { response.writeHead(404); response.end(); }
      return;
    }
    response.writeHead(404); response.end();
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }) };
}

export async function narrate(page, text) {
  await page.evaluate(value => {
    let box = document.querySelector('#demo-caption');
    if (!box) {
      box = document.createElement('div'); box.id = 'demo-caption';
      box.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);max-width:1120px;width:max-content;padding:13px 22px;border:1px solid #627697;border-radius:10px;background:#101c30f5;color:#fff;font:19px/1.5 "Segoe UI",sans-serif;z-index:2147483647;pointer-events:none;text-align:center;box-shadow:0 4px 20px #0003';
      // A manual popover stays above native dialogs without intercepting controls.
      box.setAttribute('popover', 'manual'); document.body.append(box); box.showPopover();
      box.style.margin = '0'; box.style.top = 'auto';
    }
    box.textContent = value; box.style.display = value ? 'block' : 'none';
  }, text);
}
