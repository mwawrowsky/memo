import {enableProdMode, importProvidersFrom} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';


import {environment} from './environments/environment';
import {AppComponent} from './app/app.component';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {reducer} from './app/store/result.reducer';
import {StoreModule} from '@ngrx/store';
import {TeachingPhaseComponent} from './app/teaching-phase/teaching-phase.component';
import {HomeComponent} from './app/home/home.component';
import {provideRouter, Routes} from '@angular/router';
import {BrowserModule, bootstrapApplication} from '@angular/platform-browser';

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
    importProvidersFrom(BrowserModule,
      StoreModule.forRoot({result: reducer}),
      StoreDevtoolsModule.instrument({maxAge: 10})),
    provideRouter(routes)
  ]
})
  .catch(err => console.error(err));
