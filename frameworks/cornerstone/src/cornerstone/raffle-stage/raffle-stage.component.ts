import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { BadgeComponent } from '../badge/badge.component';
import { CsButtonDirective } from '../core/foundations/cs-button.directive';
import { RaffleResult } from './raffle-result.interface';
import { RaffleStageText } from './raffle-stage-text.interface';
import { raffleStageText } from './raffle-stage-text.constant';
import { CONFETTI_STARTER } from './confetti-starter.token';

/** Presents a consumer-supplied draw; never generates a winner or stores participant data. */
@Component({
  selector: 'cs-raffle-stage',
  imports: [BadgeComponent, CsButtonDirective],
  templateUrl: './raffle-stage.component.html',
  styleUrl: './raffle-stage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaffleStageComponent {
  readonly result = input<RaffleResult | null>(null);
  readonly now = input<number | null>(null);
  readonly forceFallback = input(false, { transform: booleanAttribute });
  readonly text = input<Partial<RaffleStageText>>({});
  protected readonly labels = computed(() => ({ ...raffleStageText, ...this.text() }));
  private readonly ready = signal(false);
  private readonly clock = signal(0);
  private readonly reduced = signal(false);
  private readonly stopped = signal(false);
  private readonly late = signal(false);
  protected readonly fallback = signal(false);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly startConfetti = inject(CONFETTI_STARTER);
  private previousId: string | undefined;
  private readonly time = computed(() => {
    const now = this.now();
    return now !== null && Number.isFinite(now) ? now : this.clock();
  });
  readonly drawing = computed(() => {
    const draw = this.result();
    return !!draw && Number.isFinite(draw.reveal) && this.time() < draw.reveal;
  });
  readonly celebrating = computed(() => {
    const draw = this.result();
    return (
      this.ready() &&
      !!draw &&
      !this.drawing() &&
      this.time() < draw.reveal + 5000 &&
      !this.reduced() &&
      !this.stopped() &&
      !this.late()
    );
  });
  protected readonly cycling = computed(() => {
    const draw = this.result();
    if (!draw || !this.drawing() || this.reduced() || this.stopped() || !draw.candidates.length)
      return this.labels().drawingName;
    const elapsed =
      Math.max(0, this.time() - (Number.isFinite(draw.start) ? draw.start : this.time())) / 1000;
    const index = Math.floor(26 * (1 - Math.exp(-elapsed * 0.7)));
    return draw.candidates[index % draw.candidates.length] || this.labels().drawingName;
  });
  protected readonly winnerName = computed(
    () => this.result()?.winnerName ?? this.result()?.label.split(' · ')[0] ?? '',
  );
  protected readonly winnerDetail = computed(
    () =>
      this.result()?.winnerDetail ?? this.result()?.label.split(' · ').slice(1).join(' · ') ?? '',
  );
  protected readonly effectsActive = computed(
    () =>
      this.ready() && (this.drawing() || this.celebrating()) && !this.stopped() && !this.reduced(),
  );
  protected readonly pieces = Array.from({ length: 60 }, (_, id) => ({
    id,
    x: (id * 37) % 100,
    delay: -(id % 7) / 3,
    drift: (id % 2 ? 1 : -1) * ((id % 8) + 2),
    color: ['var(--cs-lime)', 'var(--cs-success)', 'var(--cs-ink)'][id % 3],
  }));

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const query =
        typeof matchMedia === 'function'
          ? matchMedia('(prefers-reduced-motion: reduce)')
          : undefined;
      this.reduced.set(query?.matches ?? false);
      const onMotion = () => this.reduced.set(query?.matches ?? false);
      query?.addEventListener('change', onMotion);
      destroy.onDestroy(() => query?.removeEventListener('change', onMotion));
      this.clock.set(Date.now());
      this.ready.set(true);
    });
    effect(() => {
      const draw = this.result();
      if (draw?.id === this.previousId) return;
      this.previousId = draw?.id;
      this.stopped.set(false);
      const suppliedNow = untracked(() => this.now());
      const arrival =
        suppliedNow !== null && Number.isFinite(suppliedNow) ? suppliedNow : Date.now();
      this.late.set(!!draw && arrival >= draw.reveal);
    });
    effect((cleanup) => {
      const draw = this.result();
      const suppliedNow = this.now();
      if (
        !this.ready() ||
        (suppliedNow !== null && Number.isFinite(suppliedNow)) ||
        !draw ||
        !Number.isFinite(draw.reveal)
      )
        return;
      const deadline = draw.reveal + (this.reduced() || this.stopped() || this.late() ? 0 : 5000);
      this.clock.set(Date.now());
      if (Date.now() >= deadline) return;
      const timer = setInterval(() => {
        const now = Date.now();
        this.clock.set(now);
        if (now >= deadline) clearInterval(timer);
      }, 50);
      cleanup(() => clearInterval(timer));
    });
    effect((cleanup) => {
      const canvas = this.canvas()?.nativeElement;
      if (!canvas || !this.celebrating()) return;
      this.fallback.set(this.forceFallback());
      if (this.forceFallback()) return;
      const abort = new AbortController();
      let stop = () => {};
      void this.startConfetti(
        canvas,
        () => {
          if (!abort.signal.aborted) this.fallback.set(true);
        },
        abort.signal,
      )
        .then((dispose) => {
          if (abort.signal.aborted) dispose();
          else stop = dispose;
        })
        .catch(() => {
          if (!abort.signal.aborted) this.fallback.set(true);
        });
      cleanup(() => {
        abort.abort();
        stop();
      });
    });
  }

  stopEffects(): void {
    this.stopped.set(true);
  }
}
