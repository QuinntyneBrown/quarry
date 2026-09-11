// Traces to: L2-193
import { startConfetti } from './start-confetti.function';

describe('GPU resource ownership', () => {
  it('destroys a device obtained after an aborted request', async () => {
    let finish: (device: GPUDevice) => void = () => {};
    const device = { destroy: vi.fn() };
    const pending = new Promise<GPUDevice>((resolve) => {
      finish = resolve;
    });
    const previous = Object.getOwnPropertyDescriptor(window.navigator, 'gpu');
    Object.defineProperty(window.navigator, 'gpu', {
      configurable: true,
      value: { requestAdapter: async () => ({ requestDevice: () => pending }) },
    });
    try {
      const abort = new AbortController();
      const result = startConfetti(document.createElement('canvas'), vi.fn(), abort.signal);
      await Promise.resolve();
      abort.abort();
      finish(device as unknown as GPUDevice);
      const stop = await result;
      stop();
      expect(device.destroy).toHaveBeenCalledOnce();
    } finally {
      if (previous) Object.defineProperty(window.navigator, 'gpu', previous);
      else Reflect.deleteProperty(window.navigator, 'gpu');
    }
  });

  it('cleans up configured context and device when pipeline creation fails', async () => {
    const device = {
      destroy: vi.fn(),
      createShaderModule: vi.fn(),
      createRenderPipelineAsync: async () => {
        throw new Error('Bad pipeline');
      },
    };
    const context = { configure: vi.fn(), unconfigure: vi.fn() };
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue(context as unknown as GPUCanvasContext);
    const previous = Object.getOwnPropertyDescriptor(window.navigator, 'gpu');
    Object.defineProperty(window.navigator, 'gpu', {
      configurable: true,
      value: {
        requestAdapter: async () => ({ requestDevice: async () => device }),
        getPreferredCanvasFormat: () => 'bgra8unorm',
      },
    });
    try {
      await expect(startConfetti(canvas, vi.fn(), new AbortController().signal)).rejects.toThrow(
        'Bad pipeline',
      );
      expect(context.unconfigure).toHaveBeenCalledOnce();
      expect(device.destroy).toHaveBeenCalledOnce();
    } finally {
      if (previous) Object.defineProperty(window.navigator, 'gpu', previous);
      else Reflect.deleteProperty(window.navigator, 'gpu');
    }
  });
});
