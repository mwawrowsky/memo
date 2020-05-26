import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { TeachingPhaseComponent } from './teaching-phase/teaching-phase.component';
import { HomeComponent } from './home/home.component';


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
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
