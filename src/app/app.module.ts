import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BackgroundComponent } from './background/map/background.component';

import { MapService } from './services/map.service';
import { MapViewComponent } from './map/map-view/map-view.component';
import { TimeLegendComponent } from './map/time-legend/time-legend.component';


registerLocaleData(localeFr);

@NgModule({
  declarations: [
    AppComponent,
    BackgroundComponent,
    MapViewComponent,
    TimeLegendComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    FontAwesomeModule
  ],
  providers: [
    MapService,
    {provide: LOCALE_ID, useValue: 'fr'}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
