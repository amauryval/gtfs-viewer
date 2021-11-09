import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';

import { Subscription } from 'rxjs';

import * as L from 'leaflet';
import 'leaflet/dist/images/marker-shadow.png';

import { MapService } from 'src/app/services/map.service';


@Component({
  selector: 'app-background-map',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent implements OnInit {

  private InitialViewCoords: any = [44.896741, 4.932861];
  private zoomValue = 8;
  private osmLayer: any = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png', {
    maxZoom: 13,
    minZoom: 8
  });

  isBlurred!: boolean;

  map: any;
  screenMapBounds!: number[];

  mapContainerCalledSubscription!: Subscription;
  mapServiceSubscription!: Subscription;

  constructor(
    private mapService: MapService,
  ) {


    this.mapContainerCalledSubscription = this.mapService.mapContainerCalled.subscribe(
      (status) => {
        this.sendMapContainer()
      },
      (error) => {
        console.log('error');
      }
    );


    this.mapServiceSubscription = this.mapService.isMapViewReset.subscribe(
      (status) => {
        this.resetView();
      },
      (error) => {
        console.log('error');
      }
    );

  }

  ngOnInit(): void {
    this.initMap();

  }

  ngOnDestroy(): void {
    this.mapContainerCalledSubscription.unsubscribe();
    this.mapServiceSubscription.unsubscribe();
  }

  sendMapContainer(): void {
    this.mapService.sendMapContainer(this.map);
  }

  initMap(): void {
    this.map = L.map('map', {
      center: this.InitialViewCoords,
      zoom: this.zoomValue,
      zoomControl: false,
    }).addLayer(this.osmLayer);


    this.map.on(
      'moveend',
      this.getMapScreenBounds.bind(this)
    );

    // to add scale
    // L.control.scale(
    //   {
    //     imperial: false,
    //     position: 'bottomright'
    //   }
    // ).addTo(this.map);
  }

  getMapScreenBounds(): void {
    console.log("baaam")
    this.mapService.sendScreenMapBounds([
      this.map.getBounds().getWest(),
      this.map.getBounds().getSouth(),
      this.map.getBounds().getEast(),
      this.map.getBounds().getNorth()
    ]);
  }


  resetView(): void {
    this.map.setView(
      this.InitialViewCoords,
      this.zoomValue
    )
  }

}
