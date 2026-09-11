/// <reference types="@webgpu/types" />
import { CONFETTI_SHADER } from './confetti-shader.constant';

/** Browser-only renderer. Every asynchronous allocation is paired with cancellation cleanup. */
export async function startConfetti(
  canvas: HTMLCanvasElement,
  lost: () => void,
  signal: AbortSignal,
): Promise<() => void> {
  const view = canvas.ownerDocument.defaultView;
  const gpu = view?.navigator.gpu;
  if (!view || !gpu || signal.aborted) throw new Error('GPU unavailable');
  const adapter = await gpu.requestAdapter();
  if (!adapter || signal.aborted) throw new Error('GPU adapter unavailable');
  const device = await adapter.requestDevice();
  let stopped = false;
  let frame = 0;
  let context: GPUCanvasContext | null = null;
  let buffer: GPUBuffer | undefined;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    view.cancelAnimationFrame(frame);
    signal.removeEventListener('abort', stop);
    context?.unconfigure();
    buffer?.destroy();
    device.destroy();
  };
  signal.addEventListener('abort', stop, { once: true });
  if (signal.aborted) {
    stop();
    return stop;
  }
  try {
    context = canvas.getContext('webgpu');
    if (!context) throw new Error('GPU canvas unavailable');
    const format = gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: 'premultiplied' });
    const module = device.createShaderModule({ code: CONFETTI_SHADER });
    const pipeline = await device.createRenderPipelineAsync({
      layout: 'auto',
      vertex: { module, entryPoint: 'vertex' },
      fragment: { module, entryPoint: 'fragment', targets: [{ format }] },
      primitive: { topology: 'triangle-list' },
    });
    if (signal.aborted) {
      stop();
      return stop;
    }
    buffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const bindings = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer } }],
    });
    const values = new Float32Array(16);
    const styles = view.getComputedStyle(canvas);
    const palette = canvas.ownerDocument.createElement('canvas');
    palette.width = palette.height = 1;
    const paint = palette.getContext('2d');
    if (!paint) throw new Error('Color resolution unavailable');
    ['--cs-lime', '--cs-success', '--cs-ink'].forEach((role, index) => {
      paint.clearRect(0, 0, 1, 1);
      paint.fillStyle = styles.getPropertyValue(role).trim() || '#16160c';
      paint.fillRect(0, 0, 1, 1);
      values.set(
        Array.from(paint.getImageData(0, 0, 1, 1).data, (channel) => channel / 255),
        4 + index * 4,
      );
    });
    const started = view.performance.now();
    const render = (now: number) => {
      if (stopped || !context || !buffer) return;
      try {
        const bounds = canvas.getBoundingClientRect();
        const scale = Math.min(view.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.round(bounds.width * scale));
        const height = Math.max(1, Math.round(bounds.height * scale));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        values[0] = (now - started) / 1000;
        values[1] = width / height;
        device.queue.writeBuffer(buffer, 0, values);
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: context.getCurrentTexture().createView(),
              clearValue: { r: 0, g: 0, b: 0, a: 0 },
              loadOp: 'clear',
              storeOp: 'store',
            },
          ],
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindings);
        pass.draw(6, 180);
        pass.end();
        device.queue.submit([encoder.finish()]);
        frame = view.requestAnimationFrame(render);
      } catch {
        stop();
        lost();
      }
    };
    void device.lost.then(() => {
      if (!stopped) {
        stop();
        lost();
      }
    });
    frame = view.requestAnimationFrame(render);
    return stop;
  } catch (error) {
    stop();
    throw error;
  }
}
