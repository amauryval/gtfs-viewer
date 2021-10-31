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

  zoomFromActivityId(geoFeaturesData: any[], activityId: string): void {
    const dataFiltered: any = geoFeaturesData.filter((d: any) => d.properties.id === activityId);
    if (dataFiltered.length === 1) {
      this.mapContainer.setView(
        [dataFiltered[0].geometry.coordinates[1], dataFiltered[0].geometry.coordinates[0]],
        this.ZoomActivityValue
      );
      this.bounceRepeat('#node_location_' + activityId + ' circle')

    }
    // else mean that the geom related is not display

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
    const group: any = d3.select('#activities-container');
    const jobs = group.selectAll('.activityPoint')
      .data(data, (d: any) => d.properties.id); // need to defined an unique id to disordered draw, check doc...

    jobs
      .enter()
      .append('a') // add hyper link and the svg circle
      .attr('xlink:href', (d: any) => '#/resume#' + d.properties.id)
      .attr('id', (d: any) => 'node_location_' + d.properties.id)
      .attr('cursor', 'pointer')
      .append('circle')
      .style('opacity', this.circleOpacity)
      .style('stroke', this.circleStroke)
      .style('stroke-width', this.circleWidth)
      .attr('class', (d: any) => d.properties.type)
      .on('mouseover', (e: any, d: any) => {
        // hightlight map point
        const currentElement: any = d3.select(e.currentTarget);
        currentElement.classed('selected', !currentElement.classed('selected')); // toggle class
        // legends
        // timeline highlight
        const sliderNode: any = d3.select('#slider-bar #location_' + d.properties.id);
        sliderNode.classed('selected', !sliderNode.classed('selected')); // toggle class
        const typeNodeLegend: any = d3.select('#theme-legend .' + d.properties.type);
        typeNodeLegend.classed('selected', !typeNodeLegend.classed('selected')); // toggle class

      })
      .on('mousemove', (e: any, d: any) => {
        // dynamic tooltip position
        this.adaptActivityPopup(d.properties.id, e);

      })
      .on('mouseout', (e: any, d: any) => {
        this.disableActivityPopup(d.properties.id);

        // hightlight map point
        const currentElement: any = d3.select(e.currentTarget);
        currentElement.classed('selected', !currentElement.classed('selected')); // toggle class
        // legends
        // timeline highlight
        const sliderNode: any = d3.select('#slider-bar #location_' + d.properties.id);
        sliderNode.classed('selected', !sliderNode.classed('selected')); // toggle class
        const typeNodeLegend: any = d3.select('#theme-legend .' + d.properties.type);
        typeNodeLegend.classed('selected', !typeNodeLegend.classed('selected')); // toggle class

      });

    d3.selectAll('.activityPoint circle').transition()
      .attr('r', (d: any) => d.properties.months * 2);

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

  adaptActivityPopup(popupId: string, event: any): void {
    d3.select('#popup-feature-' + popupId)
      .style('visibility', 'visible')
      .style('left', () => {
        if (event.x + this.popupWidth + 20 > this.innerWidth) {
          return event.x - this.popupWidth - 15 + 'px';
        } else {
          return event.x + 15 + 'px';
        }
      })
      .style('top', () => {
        if (event.y + this.popupHeight + 20 > this.innerHeight) {
          return event.y - this.popupHeight - 15 + 'px';
        } else {
          return event.y + 15 + 'px';
        }
      });
  }

  disableActivityPopup(popupId: string): void {
    d3
      .select('#popup-feature-' + popupId)
      .style('visibility', 'hidden')
      .style('left', 'unset') // reset position to avoid conflict with popup from timeline
      .style('top', 'unset');
  }

  bounceRepeat(activityPointId: string): void {
    d3.select(activityPointId)
      .transition()
      .duration(1000)
      .ease(d3.easeElastic)
      .attr('r', (d: any) => d.properties.months * 4)
      // .style("opacity", 1)
      .transition()
      .duration(500)
      .ease(d3.easeLinear)
      .attr('r', (d: any) => d.properties.months)
      // .style("opacity", 0)
      .on('end', this.bounceRepeat.bind(this, activityPointId));
  }


}
