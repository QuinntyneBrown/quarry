const canvas = document.querySelector('.hero-gpu');
const hero = canvas?.closest('.hero');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const forcedColors = window.matchMedia('(forced-colors: active)');
const savesData = navigator.connection?.saveData === true;

let controller;
let booting = false;

async function boot() {
  if (booting || controller || !canvas || !hero || !navigator.gpu || savesData) return;

  booting = true;
  try {
    controller = await createFoundationField(canvas, hero);
    controller.setEnabled(!reducedMotion.matches);
  } catch {
    document.documentElement.classList.remove('webgpu-ready');
  } finally {
    booting = false;
  }
}

function effectsAllowed() {
  return !reducedMotion.matches && !forcedColors.matches;
}

function handlePreferenceChange() {
  if (!controller && effectsAllowed()) void boot();
  controller?.setEnabled(effectsAllowed());
}

reducedMotion.addEventListener('change', handlePreferenceChange);
forcedColors.addEventListener('change', handlePreferenceChange);

if (effectsAllowed()) void boot();

async function createFoundationField(target, boundary) {
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'low-power' });
  if (!adapter) throw new Error('No WebGPU adapter');

  const device = await adapter.requestDevice();
  const context = target.getContext('webgpu');
  if (!context) throw new Error('No WebGPU canvas context');

  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'premultiplied' });

  const shader = device.createShaderModule({
    label: 'Cornerstone foundation field',
    code: /* wgsl */ `
      struct Uniforms {
        resolution: vec2f,
        pointer: vec2f,
        time: f32,
        intensity: f32,
        padding: vec2f,
      };

      @group(0) @binding(0) var<uniform> uniforms: Uniforms;

      fn hash21(value: vec2f) -> f32 {
        return fract(sin(dot(value, vec2f(127.1, 311.7))) * 43758.5453);
      }

      @vertex
      fn vertex_main(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
        let positions = array<vec2f, 3>(
          vec2f(-1.0, -1.0),
          vec2f(3.0, -1.0),
          vec2f(-1.0, 3.0)
        );
        return vec4f(positions[index], 0.0, 1.0);
      }

      @fragment
      fn fragment_main(@builtin(position) position: vec4f) -> @location(0) vec4f {
        let uv = position.xy / uniforms.resolution;
        let aspect = uniforms.resolution.x / uniforms.resolution.y;
        let point = (uv - vec2f(0.5)) * vec2f(aspect, 1.0);
        let pointer = (uniforms.pointer - vec2f(0.5)) * vec2f(aspect, 1.0);

        let cellPosition = point * vec2f(7.0, 8.0);
        let cell = floor(cellPosition);
        let local = fract(cellPosition);
        let edgeDistance = min(min(local.x, 1.0 - local.x), min(local.y, 1.0 - local.y));
        let grid = 1.0 - smoothstep(0.0, 0.025, edgeDistance);
        let diagonal = 1.0 - smoothstep(0.0, 0.014, abs(local.x - local.y));
        let variation = hash21(cell);

        let travelling = 0.5 + 0.5 * sin(
          point.x * 3.4 + point.y * 2.2 - uniforms.time * 0.42 + variation * 4.0
        );
        let sweepAxis = point.x + point.y * 0.42;
        let sweepCenter = sin(uniforms.time * 0.21) * 0.58;
        let sweep = exp(-pow(sweepAxis - sweepCenter, 2.0) * 9.0);
        let pointerLight = exp(-distance(point, pointer) * 4.2);
        let vignette = smoothstep(1.05, 0.12, length(point * vec2f(0.72, 1.0)));

        let structure = grid * (0.055 + travelling * 0.055) + diagonal * 0.018;
        let light = sweep * 0.1 + pointerLight * 0.12;
        let strength = (structure + light) * vignette * uniforms.intensity;
        let lime = vec3f(0.839, 1.0, 0.212);
        let warm = vec3f(1.0, 0.996, 0.969);
        let color = mix(warm, lime, 0.78 + travelling * 0.16);

        return vec4f(color * strength, clamp(strength * 1.28, 0.0, 0.3));
      }
    `,
  });

  const pipeline = await device.createRenderPipelineAsync({
    label: 'Cornerstone foundation field pipeline',
    layout: 'auto',
    vertex: { module: shader, entryPoint: 'vertex_main' },
    fragment: {
      module: shader,
      entryPoint: 'fragment_main',
      targets: [
        {
          format,
          blend: {
            color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
          },
        },
      ],
    },
    primitive: { topology: 'triangle-list' },
  });

  const uniformBuffer = device.createBuffer({
    label: 'Cornerstone foundation field uniforms',
    size: 32,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const bindGroup = device.createBindGroup({
    label: 'Cornerstone foundation field bindings',
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  const values = new Float32Array(8);
  const pointerTarget = { x: 0.66, y: 0.46 };
  const pointer = { ...pointerTarget };
  const startedAt = performance.now();
  let enabled = true;
  let visible = true;
  let frame;
  let lastFrame = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.floor(target.clientWidth * ratio));
    const height = Math.max(1, Math.floor(target.clientHeight * ratio));
    if (target.width !== width || target.height !== height) {
      target.width = width;
      target.height = height;
    }
  }

  function shouldRender() {
    return enabled && visible && document.visibilityState === 'visible';
  }

  function schedule() {
    if (shouldRender() && frame === undefined) frame = requestAnimationFrame(render);
  }

  function render(now) {
    frame = undefined;
    if (!shouldRender()) return;
    if (now - lastFrame < 1000 / 30) {
      schedule();
      return;
    }
    lastFrame = now;

    resize();
    pointer.x += (pointerTarget.x - pointer.x) * 0.055;
    pointer.y += (pointerTarget.y - pointer.y) * 0.055;
    values.set([
      target.width,
      target.height,
      pointer.x,
      pointer.y,
      (now - startedAt) / 1000,
      1,
      0,
      0,
    ]);
    device.queue.writeBuffer(uniformBuffer, 0, values);

    const encoder = device.createCommandEncoder({ label: 'Cornerstone foundation field frame' });
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
    pass.setBindGroup(0, bindGroup);
    pass.draw(3);
    pass.end();
    device.queue.submit([encoder.finish()]);
    schedule();
  }

  function setEnabled(next) {
    enabled = next;
    document.documentElement.classList.toggle('webgpu-ready', next);
    if (!next && frame !== undefined) {
      cancelAnimationFrame(frame);
      frame = undefined;
    }
    schedule();
  }

  boundary.addEventListener('pointermove', (event) => {
    const bounds = boundary.getBoundingClientRect();
    pointerTarget.x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    pointerTarget.y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
  });
  boundary.addEventListener('pointerleave', () => {
    pointerTarget.x = 0.66;
    pointerTarget.y = 0.46;
  });

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  });
  intersection.observe(boundary);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(boundary);
  document.addEventListener('visibilitychange', schedule);
  device.lost.then(() => {
    enabled = false;
    document.documentElement.classList.remove('webgpu-ready');
    if (frame !== undefined) cancelAnimationFrame(frame);
    intersection.disconnect();
    resizeObserver.disconnect();
  });

  resize();
  schedule();
  return { setEnabled };
}
