import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideZonelessChangeDetection } from '@angular/core';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { HomeComponent } from './app/home/home.component';
import { TeachingPhaseComponent } from './app/teaching-phase/teaching-phase.component';
import { reducer } from './app/store/result.reducer';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'teach', component: TeachingPhaseComponent },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideStore({ result: reducer }),
    provideStoreDevtools({ maxAge: 10, logOnly: environment.production }),
    provideRouter(routes),
  ],
}).catch(err => console.error(err));
