import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideCsTheme } from '@quinntyne/cornerstone';
import { CatalogPageComponent } from './app/catalog-page.component';
import { ComponentPageComponent } from './app/component-page.component';
import { DocsAppComponent } from './app';
import './styles.scss';

bootstrapApplication(DocsAppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideCsTheme('dark'),
    provideRouter(
      [
        { path: '', pathMatch: 'full', redirectTo: 'components/categories' },
        { path: 'components/categories', component: CatalogPageComponent },
        { path: 'components/:slug', pathMatch: 'full', redirectTo: 'components/:slug/overview' },
        { path: 'components/:slug/:section', component: ComponentPageComponent },
        { path: '**', redirectTo: 'components/categories' },
      ],
      withComponentInputBinding(),
    ),
  ],
}).catch((error: unknown) => console.error(error));
