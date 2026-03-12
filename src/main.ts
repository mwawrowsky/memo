import {enableProdMode, importProvidersFrom} from '@angular/core';


import {environment} from './environments/environment';
import {AppComponent} from './app/app.component';
import {reducer} from './app/store/result.reducer';
import {provideStore} from '@ngrx/store';
import {provideStoreDevtools} from '@ngrx/store-devtools';
import {TeachingPhaseComponent} from './app/teaching-phase/teaching-phase.component';
import {HomeComponent} from './app/home/home.component';
import {provideRouter, Routes} from '@angular/router';
import {BrowserModule, bootstrapApplication} from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';


const routes: Routes = [
  // basic routes
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent},
  {path: 'teach', component: TeachingPhaseComponent},
];


if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideStore({result: reducer}),
    provideStoreDevtools({maxAge: 10, logOnly: environment.production}),
    provideRouter(routes)
  ]
})
  .catch(err => console.error(err));
