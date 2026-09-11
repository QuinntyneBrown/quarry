import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'cs-fixture-app',
  imports: [RouterOutlet],
  templateUrl: './fixture-app.component.html',
  styleUrl: './fixture-app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FixtureAppComponent {}
