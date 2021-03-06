import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {timeout} from 'rxjs/operators';

import { Subject } from 'rxjs';

import { apiUrl } from '../core/inputs';



@Injectable({
  providedIn: 'root'
})
export class MapService {

  mapContainer: Subject<any> = new Subject<any>();
  screenMapBound: Subject<any> = new Subject<any>();

  private apiUrlData = apiUrl;
  ErrorapiUrlDataApiFound: Subject<string> = new Subject<string>();
  GeoData: Subject<any> = new Subject<any>();
  rangeDateData: Subject<any> = new Subject<any>();

  GeoDataToMap: Subject<any[]> = new Subject<any[]>();

  mapContainerCalled: Subject<boolean> = new Subject<boolean>();
  isMapViewReset: Subject<boolean> = new Subject<boolean>();


  constructor(
    private http: HttpClient
  ) { }

  getMapContainer(): void {
    this.mapContainerCalled.next(true);
  }

  resetMapView(): void {
    this.isMapViewReset.next(true)
  }

  sendMapContainer(mapContainer: any): void {
    this.mapContainer.next(mapContainer);
  }

  sendScreenMapBounds(screenMapBound: number[]): void {
    this.screenMapBound.next(screenMapBound);
  }

  pullGeoData(currentData: string, current_date: string, bounds: number[]): void {
    this.http.get<any>(this.apiUrlData + currentData.toLowerCase() + '/moving_nodes_by_date?current_date=' + current_date + "&bounds=" + bounds).subscribe({
      complete: () => {
      },
      error: error => {
      // TODO improve error message, but API need improvments
      this.ErrorapiUrlDataApiFound.next(error.error.message);
      },
      next: response => {
        this.GeoData.next(response);
      },
    });
  }

  pullRangeDateData(currentData: string): void {
    // HERE ADD CURRENT DATE ARG LINKED TO THE timeline !!!!
    this.http.get<any>(this.apiUrlData + currentData.toLowerCase() + '/range_dates').subscribe({
      complete: () => {
      },
      error: error => {
      // TODO improve error message, but API need improvments
      this.ErrorapiUrlDataApiFound.next(error.error.message);
      },
      next: response => {
        this.rangeDateData.next(response);
      },
    });
  }

  pullGeoDataToMap(dataToMap: any[]): void {
    this.GeoDataToMap.next(dataToMap);
  }


}
