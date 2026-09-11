import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** A countdown driven by the consumer's clock, with no background timer. */
@Component({
  selector: 'cs-countdown',
  templateUrl: './countdown.component.html',
  styleUrl: './countdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownComponent {
  readonly target = input.required<number>();
  readonly now = input.required<number>();
  readonly ariaLabel = input('Time remaining');
  readonly pendingCaption = input('The event will begin soon.');
  readonly expiredCaption = input('The countdown is complete.');
  readonly remaining = computed(() => {
    const difference = this.target() - this.now();
    return Number.isFinite(difference) ? Math.max(0, Math.ceil(difference / 1000)) : 0;
  });
  readonly units = computed(() => {
    const seconds = this.remaining();
    return [
      { label: 'Days', value: Math.floor(seconds / 86400) },
      { label: 'Hours', value: Math.floor(seconds / 3600) % 24 },
      { label: 'Minutes', value: Math.floor(seconds / 60) % 60 },
      { label: 'Seconds', value: seconds % 60 },
    ].filter((unit, index) => index > 0 || unit.value > 0);
  });
  protected pad(value: number): string {
    return String(value).padStart(2, '0');
  }
}
