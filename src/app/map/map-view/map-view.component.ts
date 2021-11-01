import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';

import { Subscription } from 'rxjs';

import * as L from 'leaflet';
import 'leaflet/dist/images/marker-shadow.png';
import * as d3 from 'd3';

import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';


import { MapService } from '../../services/map.service';

import { locationIcon, tagsIcon, centerIcon } from '../../core/inputs';


@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.scss']
})
export class MapViewComponent implements OnInit, OnDestroy {

  locationIcon = locationIcon;
  tagIcon = tagsIcon;
  centerIcon = centerIcon;


  currentDate!: number;

  isGeodataCanBeDisplayed = false;
  isLegendDisplayed = true;

  innerWidth!: any;
  innerHeight!: any;

  mapContainer!: any;
  zoomInitDone!: boolean;
  maxZoomValue = 9;
  ZoomActivityValue = 12;

  helpPopup = 'Voici une cartographie spatio-temporelles de mes expériences';

  // check css code related to popup
  popupWidth = 330;
  popupHeight = 190;
  geoFeaturesData!: any[];
  svgLayerId = 'svgLayer';
  circleOpacity = 0.7;
  circleStroke = 'ghostwhite';
  circleWidth = '2.5px';

  mapContainerSubscription!: Subscription;
  pullGeoDataToMapSubscription!: Subscription;
  pullTripsGeoDataToMapSubscription!: Subscription;

  constructor(
    private mapService: MapService,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
  ) {

    // to get the data properties from routes (app.module.ts)
    this.titleService.setTitle(this.activatedRoute.snapshot.data.title);

    this.mapContainerSubscription = this.mapService.mapContainer.subscribe(
      (element: any) => {
        this.mapContainer = element;
        this.initActivitiesSvgLayer();

        // to add scale
        const scaleLeaflet: any = L.control.scale(
          {
            imperial: false,
            position: 'bottomright'
          }
        );
        const AttributionLeaflet: any = L.control.attribution(
          {
            position: 'bottomright'
          }
        );

        scaleLeaflet.addTo(this.mapContainer);
        AttributionLeaflet.addTo(this.mapContainer);

        const divScale: any = window.document.getElementById('legend-scale');
        const divAttribution: any = window.document.getElementById('attribution')
        divScale.appendChild(scaleLeaflet.getContainer())
        divAttribution.appendChild(AttributionLeaflet.getContainer())


      }
    );

    this.pullGeoDataToMapSubscription = this.mapService.GeoDataToMap.subscribe(
      (geoFeaturesData: any[]) => {
        this.geoFeaturesData = geoFeaturesData;
        this.activitiesMapping(geoFeaturesData);
      }
    );

  }

  ngOnInit(): void {
    this.zoomInitDone = false;
    this.innerWidth = window.innerWidth;
    this.innerHeight = window.innerHeight;

  }



  ngOnDestroy(): void {
    this.mapContainerSubscription.unsubscribe();
    this.pullGeoDataToMapSubscription.unsubscribe();
    this.pullTripsGeoDataToMapSubscription.unsubscribe();

    d3.select('#' + this.svgLayerId).remove();

    d3.select(".leaflet-control-scale").remove();
    d3.select(".leaflet-control-attribution").remove();
    this.mapService.resetMapView()
  }


  zoomOnData(): void {
    if (this.geoFeaturesData !== undefined) {
      this.zoomFromDataBounds(this.geoFeaturesData);
    }
  }

  showHideLegend(): void {
    this.isLegendDisplayed = !this.isLegendDisplayed;
  }

  zoomFromDataBounds(geojsonData: any): void {

    this.mapContainer.fitBounds(
      L.geoJSON(geojsonData).getBounds(),
      {
        maxZoom: this.maxZoomValue
      }
    );
  }

  initActivitiesSvgLayer(): void {
    const svgLayerContainer: any = L.svg().addTo(this.mapContainer);
    const svgLayerObject = d3.select(svgLayerContainer._container)
      .attr('id', this.svgLayerId)
      .attr('pointer-events', 'auto');
    svgLayerObject.select('g')
      .attr('class', 'leaflet-zoom-hide')
      .attr('id', 'activities-container');

  }


  activitiesMapping(data: any): void {
    // remove existing nodes
    d3.selectAll('#activities-container a').remove()

    const group: any = d3.select('#activities-container');
    const jobs = group.selectAll('.activityPoint')
      .data(data, (d: any) => d.properties.stop_code); // need to defined an unique id to disordered draw, check doc...

    jobs
      .enter()
      .append('a') // add hyper link and the svg circle
      .attr('xlink:href', (d: any) => '#/resume#' + d.properties.id)
      .attr('id', (d: any) => 'node_location_' + d.properties.id)
      .attr('cursor', 'pointer')
      .append('circle')
      .style('opacity', this.circleOpacity)
      .style('stroke', this.circleStroke)
      .style('fill', function(d: any) {
        // if (d.properties.stop_type == 'metro' && d.properties.direction_id == "back") {
        //   return 'blue'
        // } else if (d.properties.stop_type == 'metro' && d.properties.direction_id == "forth") {
        //   return 'teal'
        // }
        // else if (d.properties.stop_type == 'tramway' && d.properties.direction_id == "back") {
        //   return 'red'
        // } else if (d.properties.stop_type == 'tramway' && d.properties.direction_id == "forth") {
        //   return 'orange'
        // }
        // else {
        //   return 'black'
        // }

        if (d.properties.line_name_short == 'A') {
          return 'blue'
        } else if (d.properties.line_name_short == 'B') {
          return 'teal'
        }
        else if (d.properties.line_name_short == 'T1') {
          return 'red'
        } else if (d.properties.line_name_short == 'T2') {
          return 'orange'
        }
        else {
          return 'black'
        }
      })
      .style('r', '5')
      .style('stroke-width', this.circleWidth)
      .attr('class', (d: any) => d.properties.type)
      .on('mouseover', (e: any, d: any) => {})
      .on('mousemove', (e: any, d: any) => {})
      .on('mouseout', (e: any, d: any) => {

      });

    d3.selectAll('.activityPoint circle').transition()
      .attr('r', '5');

    jobs
      .exit()
      // .transition()
      // .attr('r', 0)
      .remove();

    this.mapContainer.on('moveend', this.reset.bind(this));
    this.reset();
  }

  reset(): void {
    // for the points we need to convert from latlong to map units
    d3.select('#' + this.svgLayerId)
      .selectAll('circle')
      .attr('transform', (d: any) => {
        return 'translate(' +
          this.applyLatLngToLayer(d).x + ',' +
          this.applyLatLngToLayer(d).y + ')';
      });
  }

  applyLatLngToLayer(d: any): any {
    const y: number = d.geometry.coordinates[1];
    const x: number = d.geometry.coordinates[0];
    return this.mapContainer.latLngToLayerPoint(new L.LatLng(y, x));
  }

}
