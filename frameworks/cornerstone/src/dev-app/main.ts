import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideCsTheme } from '@quinntyne/cornerstone';
import { DevAppComponent } from './app/dev-app.component';
import './styles.scss';
bootstrapApplication(DevAppComponent, {
  providers: [provideZonelessChangeDetection(), provideCsTheme('light')],
}).catch((error: unknown) => console.error(error));
