import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideCsTheme } from '@quinntyne/cornerstone';
import { FixtureAppComponent } from './app/fixture-app.component';
import { ComponentFixtureComponent } from './app/component-fixture.component';
import { EventComponentsFixtureComponent } from './app/event-components-fixture.component';
import './styles.scss';
bootstrapApplication(FixtureAppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideCsTheme('light'),
    provideRouter(
      [
        { path: '', pathMatch: 'full', redirectTo: 'components/badge' },
        { path: 'event-components', component: EventComponentsFixtureComponent },
        { path: 'components/:slug', component: ComponentFixtureComponent },
      ],
      withComponentInputBinding(),
    ),
  ],
}).catch((error: unknown) => console.error(error));
