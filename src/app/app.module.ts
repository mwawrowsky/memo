import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { AppComponent } from './app.component';
import { TeachingPhaseComponent } from './teaching-phase/teaching-phase.component';
import { HomeComponent } from './home/home.component';
import { resultReducer } from './store/result.reducer'

const routes: Routes = [
  // basic routes
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'teach', component: TeachingPhaseComponent },

  // authentication demo
  // { path: 'login', component: LoginComponent }, {
  //   path: 'protected',
  //   component: ProtectedComponent, canActivate: [LoggedInGuard]
  // },

  // nested
  // {
  //   path: 'products',
  //   component: ProductsComponent,
  //   children: childRoutes
  // }
];

@NgModule({
  declarations: [
    AppComponent,
    TeachingPhaseComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    StoreModule.forRoot({ result: resultReducer }),
    StoreDevtoolsModule.instrument({ maxAge: 10 })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
