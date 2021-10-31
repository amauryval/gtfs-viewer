import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Subject } from 'rxjs';

import { apiUrl } from '../core/inputs';



@Injectable({
  providedIn: 'root'
})
export class MapService {

  mapContainer: Subject<any> = new Subject<any>();

  private apiUrlData = apiUrl + 'nodes_by_date';
  ErrorapiUrlDataApiFound: Subject<string> = new Subject<string>();
  GeoData: Subject<any> = new Subject<any>();

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

  // pullActivitiesGeoData(): void {

  //   this.http.get<any>(this.apiUrlActivitiesGeoData).subscribe({
  //     complete: () => {
  //     },
  //     error: error => {
  //     // TODO improve error message, but API need improvments
  //     this.ErrorapiUrlActivitiesGeoDataApiFound.next(error.error.message);
  //     },
  //     next: response => {
  //       this.activitiesGeoData.next(response);
  //     },
  //   });
  // }

  // pullActivitiesGeoDataToMap(dataToMap: any[]): void {
  //   this.activitiesGeoDataToMap.next(dataToMap);
  // }

  // pullTripsGeoDataToMap(dataToMap: any[]): void {
  //   this.tripsGeoDataToMap.next(dataToMap);
  // }
}
