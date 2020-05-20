import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TeachingPhaseComponent } from './teaching-phase/teaching-phase.component';

@NgModule({
  declarations: [
    AppComponent,
    TeachingPhaseComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
