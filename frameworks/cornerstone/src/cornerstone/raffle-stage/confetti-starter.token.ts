import { InjectionToken } from '@angular/core';
import { startConfetti } from './start-confetti.function';
export const CONFETTI_STARTER = new InjectionToken<typeof startConfetti>(
  'Cornerstone confetti renderer',
  { providedIn: 'root', factory: () => startConfetti },
);
