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

  pullGeoData(): void {
    // HERE ADD CURRENT DATE ARG LINKED TO THE timeline !!!!
    this.http.get<any>(this.apiUrlData).subscribe({
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

  pullGeoDataToMap(dataToMap: any[]): void {
    this.GeoDataToMap.next(dataToMap);
  }

}
