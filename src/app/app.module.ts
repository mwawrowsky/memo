import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {StoreModule} from '@ngrx/store';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';

import {AppComponent} from './app.component';
import {TeachingPhaseComponent} from './teaching-phase/teaching-phase.component';
import {HomeComponent} from './home/home.component';
import {reducer} from './store/result.reducer';

const routes: Routes = [
  // basic routes
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'teach', component: TeachingPhaseComponent },
];

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        RouterModule.forRoot(routes),
        StoreModule.forRoot({ result: reducer }),
        StoreDevtoolsModule.instrument({ maxAge: 10 }),
        TeachingPhaseComponent,
        HomeComponent
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
