import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { startDisplay } from './harness.mjs';

const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright');
const runDir = resolve(process.argv[2] ?? '');
const manifest = JSON.parse(await readFile(join(runDir, 'manifest.json'), 'utf8'));
assert.equal(manifest.rehearsal, false, 'A rehearsal has no publishable video');
const staging = join(runDir, 'staging');
await mkdir(join(runDir, 'review'), { recursive: true });
const display = await startDisplay({ mediaDir: staging });
const browser = await chromium.launch();
try {
  for (const item of manifest.results.filter(x => x.status === 'captured')) {
    console.log(`Reviewing encoded playback: ${item.slug}`);
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(display.url);
    await page.evaluate(url => { document.body.innerHTML = ''; const video = document.createElement('video'); video.id = 'review'; video.src = url; video.controls = true; video.muted = true; document.body.append(video); }, display.url + '/media/' + item.slug + '.webm');
    await page.locator('video').evaluate(video => new Promise((resolve, reject) => { if (video.readyState >= 1) resolve(); else { video.onloadedmetadata = resolve; video.onerror = () => reject(new Error('Video metadata failed')); } }));
    const media = await page.locator('video').evaluate(video => ({ duration: video.duration, width: video.videoWidth, height: video.videoHeight }));
    assert.equal(media.width, 1280); assert.equal(media.height, 720); assert.ok(Number.isFinite(media.duration) && media.duration > 10);
    item.media = { ...media, bytes: (await stat(join(staging, item.slug + '.webm'))).size };
    // Decode the entire successful take at normal speed, sampling the visible outcome of each chapter.
    const samples = item.chapters.map(x => Math.min(x.seconds + 3, media.duration - 0.2));
    const frames = await page.locator('video').evaluate(async (video, samples) => {
      const images = [], canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 720;
      let index = 0, lastTime = 0;
      const errors = [];
      video.addEventListener('error', () => errors.push(video.error?.message ?? 'decode error'));
      video.playbackRate = 1;
      await video.play();
      await new Promise((resolve, reject) => {
        const deadline = setTimeout(() => { video.pause(); reject(new Error('Playback timed out')); }, (video.duration + 30) * 1000);
        video.addEventListener('ended', () => { clearTimeout(deadline); resolve(); }, { once: true });
        const tick = () => {
          if (video.paused || video.ended) return;
          lastTime = video.currentTime;
          if (index < samples.length && video.currentTime >= samples[index]) {
            canvas.getContext('2d').drawImage(video, 0, 0); images.push({ seconds: video.currentTime, data: canvas.toDataURL('image/png') }); index++;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      const quality = video.getVideoPlaybackQuality();
      return { images, errors, lastTime, decodedFrames: quality.totalVideoFrames, droppedFrames: quality.droppedVideoFrames };
    }, samples);
    assert.deepEqual(frames.errors, []); assert.ok(frames.decodedFrames > 0); assert.equal(frames.images.length, samples.length);
    item.playback = { normalSpeed: true, decodedFrames: frames.decodedFrames, droppedFrames: frames.droppedFrames, errors: frames.errors };
    for (let i = 0; i < frames.images.length; i++) {
      await writeFile(join(runDir, 'review', `${item.slug}-${i + 1}.png`), Buffer.from(frames.images[i].data.split(',')[1], 'base64'));
      item.chapters[i].sampleSeconds = frames.images[i].seconds;
    }
    const posterIndex = item.slug === 'quarry' ? 2 : item.slug === 'quarry-previews' ? 1 : item.slug === 'quarry-indexing-worker' ? 3 : 2;
    await writeFile(join(staging, item.slug + '-poster.png'), Buffer.from(frames.images[Math.min(posterIndex, frames.images.length - 1)].data.split(',')[1], 'base64'));
    const contact = await page.evaluate(async frames => {
      const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = Math.ceil(frames.length / 2) * 392;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#172033'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < frames.length; i++) {
        const image = new Image(); image.src = frames[i].data; await image.decode(); const x = i % 2 * 640, y = Math.floor(i / 2) * 392;
        ctx.drawImage(image, x, y, 640, 360); ctx.fillStyle = '#fff'; ctx.font = '17px Segoe UI'; ctx.fillText(`Chapter ${i + 1} • ${frames[i].seconds.toFixed(1)}s`, x + 12, y + 383);
      }
      return canvas.toDataURL('image/png');
    }, frames.images);
    await writeFile(join(runDir, 'review', item.slug + '-contact.png'), Buffer.from(contact.split(',')[1], 'base64'));
    await page.close();
    console.log(`${item.slug}: ${media.duration.toFixed(2)}s, ${media.width}×${media.height}; normal-speed playback complete`);
    await writeFile(join(runDir, 'reviewed-manifest.json'), JSON.stringify(manifest, null, 2));
  }
} finally { await browser.close(); await display.close(); }
