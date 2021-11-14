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

  available_data = ["ter", "toulouse"];
  currentData = this.available_data[0];

  currentDate!: number;

  isGeodataCanBeDisplayed = false;
  isLegendDisplayed = true;

  innerWidth!: any;
  innerHeight!: any;

  mapContainer!: any;
  zoomInitDone!: boolean;
  maxZoomValue = 19;
  dataBoundingBox!: number[];

  canvas!: any;
  context!: any;
  tooltipCanvas!: any;
  tooltipContext!: any;
  pi2 = Math.PI * 2;
  radius = 4;
  popups: any[] = [];

  // check css code related to popup
  popupWidth = 330;
  popupHeight = 190;
  geoFeaturesData!: any[];
  svgLayerId = 'svgLayer';
  circleOpacity = 0.7;
  circleStroke = 'ghostwhite';
  circleWidth = '1px';

  mapContainerSubscription!: Subscription;
  pullGeoDataToMapSubscription!: Subscription;
  pullTripsGeoDataToMapSubscription!: Subscription;
  pullBoundingBoxDataSubscription!: Subscription;

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

        // this.initnodesSvgLayer();
        this.initCircleCanvasLayer();

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
        this.circlesMapping(this.geoFeaturesData);

        // this.svgNodesMapping(geoFeaturesData);
      }
    );

    this.pullBoundingBoxDataSubscription = this.mapService.rangeDateData.subscribe(
      (element) => {
        this.dataBoundingBox = element.data_bounds;
        this.zoomFromDataBounds(this.dataBoundingBox);
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

  updateTimeline(data: string): void {
    this.currentData = data
    this.mapService.pullRangeDateData(this.currentData);
  }


  zoomOnData(): void {
    if (this.geoFeaturesData !== undefined) {
      this.zoomFromDataBounds(this.dataBoundingBox);
    }
  }

  showHideLegend(): void {
    this.isLegendDisplayed = !this.isLegendDisplayed;
  }

  zoomFromDataBounds(bounds: number[]): void {
    const ne = { lng: bounds[2], lat: bounds[3] };
    const sw = { lng: bounds[0], lat: bounds[1] };

    this.mapContainer.fitBounds(
      L.latLngBounds(L.latLng(sw), L.latLng(ne)),
      {
        maxZoom: this.maxZoomValue
      }
    );
  }

  initnodesSvgLayer(): void {
    const svgLayerContainer: any = L.svg().addTo(this.mapContainer);
    const svgLayerObject = d3.select(svgLayerContainer._container)
      .attr('id', this.svgLayerId)
      .attr('pointer-events', 'auto');
    svgLayerObject.select('g')
      .attr('class', 'leaflet-zoom-hide')
      .attr('id', 'nodes-container');


  }

  initCircleCanvasLayer(): void {
    // const tooltipsCanvas = new L.Canvas().addTo(this.mapContainer);
    // d3.select('canvas').attr('id', 'tooltips')
    const canvas = new L.Canvas().addTo(this.mapContainer);
    d3.select('canvas:not(#tooltips)').attr('id', 'stop_nodes')
    this.canvas = document.querySelector('#stop_nodes');
    this.context = this.canvas.getContext('2d')


    // this.tooltipCanvas = document.querySelector('#tooltips');
    // this.tooltipContext = this.tooltipCanvas.getContext('2d')

  }

  circlesMapping(data: any): void {
    // https://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing

    // IN ORDER TO CLEAN THE CANVAS
    // Store the current transformation matrix
    this.context.save();
    // Use the identity matrix while clearing the canvas
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Restore the transform
    this.context.restore();

    this.popups = [];

    let i!: number
    for (i = 0; i < data.length; i++) {


      this.context.beginPath();

      const coords: any = this.mapContainer.latLngToLayerPoint(new L.LatLng(data[i].y, data[i].x))

      this.context.moveTo( coords.x + this.radius, coords.y ); // This was the line you were looking for
      this.context.arc(
        coords.x,
        coords.y,
        this.radius, 0, this.pi2
      );

      if (data[i].route_type == '1') {
        this.context.fillStyle = 'blue';
      } else if (data[i].route_type == '0') {
        this.context.fillStyle = 'red';
      } else if (data[i].route_type == '2') {
        this.context.fillStyle = 'brown';
      } else {
        this.context.fillStyle = 'black';
      }
      this.context.fill();
      this.context.closePath();

      this.popups.push({
        x: coords.x,
        y: coords.y,
        r: 4,
        rXr: 16,
        route_type: data[i].route_type,
        tip: data[i]['route_long_name'],
        tooltipRadius2: 100
      });

    }
    this.initPopups()

  }

  initPopups(): void {
    d3.select('#stop_nodes').on('mousemove', null)

    d3.select('#stop_nodes')
      .on('mousemove', (e: any, d: any) => {

        let mouseX = parseInt(e.x);
        let mouseY = parseInt(e.y);

        let node_found = [];
        for (var i = 0; i < this.popups.length; i++) {
          const pop = this.popups[i];
          let dx = mouseX - pop.x;
          let dy = mouseY - pop.y;
          if (dx * dx + dy * dy < pop.tooltipRadius2)
            node_found.push(pop)
          }
        console.log( this.popups.length, node_found.length)
        if (node_found.length > 0) {
          d3.selectAll(".popup-feat").remove()
          d3.select("#popup")
          .append('p')
            .style("position", "absolute")
            .attr("class", "bg-light text-black popup-feat")
            .attr("visibility", "visible")
            .style("top", e.pageY + "px")
            .style("left", e.pageX + "px")
            .text(node_found[0].tip);
        } else {
          d3.selectAll(".popup-feat").remove()
        }
      })
  }

  svgNodesMapping(data: any): void {

    // remove existing nodes
    d3.selectAll('#nodes-container a').remove()

    const group: any = d3.select('#nodes-container');
    const jobs = group.selectAll('.node')
      .data(data, (d: any) => d.stop_code); // need to defined an unique id to disordered draw, check doc...

    jobs
      .enter()
      .append('a') // add hyper link and the svg circle
      .attr('xlink:href', (d: any) => '#/resume#' + d.id)
      .attr('id', (d: any) => 'node_location_' + d.id)
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

        if (d.route_short_name == 'A') {
          return 'blue'
        } else if (d.route_short_name == 'B') {
          return 'teal'
        }
        else if (d.route_short_name == 'T1') {
          return 'red'
        } else if (d.route_short_name == 'T2') {
          return 'orange'
        }
        else {
          return 'red'
        }
      })
      .style('r', '3')
      .style('stroke-width', this.circleWidth)
      .on('mouseover', (e: any, d: any) => {})
      .on('mousemove', (e: any, d: any) => {})
      .on('mouseout', (e: any, d: any) => {

      });


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
    const y: number = d.y;
    const x: number = d.x;
    return this.mapContainer.latLngToLayerPoint(new L.LatLng(y, x));
  }

}
