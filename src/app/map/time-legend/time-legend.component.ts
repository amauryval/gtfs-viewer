import { Component, OnInit, ViewEncapsulation, OnDestroy, Input } from '@angular/core';

import { Subscription } from 'rxjs';

import { MapService } from '../../services/map.service';

import * as d3 from 'd3';


@Component({
  selector: 'app-time-legend',
  templateUrl: './time-legend.component.html',
  styleUrls: ['./time-legend.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TimeLegendComponent implements OnInit, OnDestroy {
  @Input() currentActivityIdSelected: any;
  @Input() isGeodataCanBeDisplayed: any;

  mapContainer: any;
  sliderDate!: Date;

  geoActivitiesData!: any;
  geoTripsData!: any;

  sliderBarId = '#' + 'sliderBarId';

  margin: any = { top: 10, right: 15, bottom: 0, left: 15 };
  width = 600;
  height = 90;
  fontSize = '14px';
  sliderNodesSize = 5;

  endDate: Date = currentDate;
  currentYear = currentYear;
  startDate!: Date;
  selectedDatePosition = 0;  // TODO check type
  maxDatePosition: number = this.width - this.margin.left - this.margin.right;
  dateRange!: any;
  movingCursor = false;
  timer!: any;
  currentCountNodes = 0;

  svgTripIdPrefix = svgTripIdPrefix;

  pullGeoDataSubscription!: Subscription;
  mapContainerSubscription!: Subscription;

  constructor(
    private mapService: MapService,
  ) {

    this.mapContainerSubscription = this.mapService.mapContainer.subscribe(
      (element: any) => {
        this.mapContainer = element;
      }
    );

    this.pullGeoDataSubscription = this.mapService.GeoData.subscribe(
      (element) => {


        this.geoActivitiesData = element.activities_geojson;
        const startDate: Date = new Date(element.start_date);
        startDate.setMonth(startDate.getMonth() - 1); // start date must be smaller than the first activity start_date
        this.startDate = startDate;
        // all the data is loaded but we are going to filter it to map its features regarding datetime
        // defined on the timeline
        this.buildTimeline(String(this.currentYear));

        // if a circle is preselected
        if ( this.currentActivityIdSelected !== undefined ) {
          const currentElement: any = d3.select('#slider-bar #location_' + this.currentActivityIdSelected);
          this.sliderEventCircleBounceRepeat(currentElement)
        }

      }
    );
  }

  ngOnInit(): void {

    if ( this.isGeodataCanBeDisplayed ) {
      this.mapService.getMapContainer();
      this.mapService.pullGeoData();
    }

  }


  ngOnDestroy(): void {
    this.pullGeoDataSubscription.unsubscribe();
    this.mapContainerSubscription.unsubscribe();
  }

  parseTime(time: string): Date | null {
    return d3.timeParse('%Y-%m-%d')(time);
  }

  formatDate(time: Date): string {
    return d3.timeFormat('%b %Y')(time);
  }

  formatDateToYearString(time: Date): string {
    return d3.timeFormat('%Y')(time);
  }

  formatDateToString(time: Date): string {
    return d3.timeFormat('%Y-%m-%d')(time);
  }


  startTimeLine(): void {
    const button = d3.select('#play-button');
    if (button.html() === 'Pause') {
      this.movingCursor = false;
      clearInterval(this.timer);
      // var timer = 0;
      button.text('Continue');

    } else if (button.html() === 'Continue') {
      this.movingCursor = true;
      this.timer = setInterval(this.step.bind(this), 100);
      button.html('Pause');

    } else {
      // start run
      this.movingCursor = true;
      this.timer = setInterval(this.step.bind(this), 100);
      button.html('Pause');
    }
  }

  resetTimeLine(): void {
    // reset action
    d3.select('#play-button').html('Start');
    // update to start date
    this.sliderDate = this.startDate
    // d3.select('#slider-value').html(this.formatDate(this.startDate));
    this.update(this.startDate);
    this.selectedDatePosition = 0;
    this.movingCursor = false;
    clearInterval(this.timer);
  }

  forwardTimeLine(): void {
    d3.select('#play-button').html('Play');
    // update to start date
    this.sliderDate = this.startDate
    // d3.select('#slider-value').html(this.formatDate(this.endDate));
    this.update(this.endDate);
    this.selectedDatePosition = 0;
    this.movingCursor = false;
    clearInterval(this.timer);
  }


  updateTrips(h: Date): void {
    this.geoTripsData.forEach((item: any) => {
      const startDate: string = item.start_date;
      const endDate: string = item.end_date;
      const tripStartDate: Date | null = this.parseTime(startDate);
      const tripEndDate: Date | null = this.parseTime(endDate);

      const svgTrip = d3.selectAll('[id^=' + this.svgTripIdPrefix + item.name + ']');
      if (tripStartDate !== null && tripEndDate !== null) {

        if (h >= tripStartDate && h < tripEndDate) {
          svgTrip.style('visibility', 'visible');
        } else {
          svgTrip.style('visibility', 'hidden');
        }
      }
    });
  }

  update(h: any): void {
    // always update the status of the trips regarding slider changes
    this.updateTrips(h);

    // filter data set and redraw plot
    const newData = this.geoActivitiesData.features.filter((d: any) => {
      const selectedDate = this.parseTime(d.properties.start_date);
      // return parseDate(d.properties.end_date) >= h && parseDate(d.properties.start_date) < h;
      // filter by current slider date and slider start date
      if (selectedDate !== null) {
        return selectedDate >= this.startDate && selectedDate < h;
      }
      return false;
    });

    // call api only if last count is different from the current count feature
    if (newData.length !== this.currentCountNodes) {
      this.mapService.pullGeoDataToMap(newData);
      this.displaySliderNodes(newData);
    }

    // update count feature, to optimize api calls
    this.currentCountNodes = newData.length;

    // update position and text of label according to slider scale

    d3.select('#trace').attr('x2', this.dateRange(h)); // trace
    d3.select('#handle').attr('cx', this.dateRange(h)); // handle
    this.sliderDate = h
    // d3.select('#slider-value').text(this.formatDate(h));
  }

  step(): void {
    this.update(this.dateRange.invert(this.selectedDatePosition));
    this.selectedDatePosition = this.selectedDatePosition + (this.maxDatePosition / 151);
    if (this.selectedDatePosition > this.maxDatePosition) {
      this.movingCursor = false;
      this.selectedDatePosition = 0;
      clearInterval(this.timer);
      // timer = 0;
      d3.select('#play-button').text('Play');
    }
  }

  _initDateRange(): void {
    this.dateRange = d3.scaleTime()
      .domain([this.startDate, this.endDate])
      .range([0, this.maxDatePosition])
      .clamp(true);
  }

  buildTimeline(date: string): void {

    const svg = d3.select(this.sliderBarId);

    const playButton: any = d3.select('#play-button');

    this._initDateRange();

    const slider = svg.append('g')
      .attr('class', 'slider-bar')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.height / 2 + ')');

    // slider bar creation
    slider.append('line')
      .attr('class', 'track')
      .attr('x1', this.dateRange.range()[0])
      .attr('x2', this.dateRange.range()[1])
      .select((d: any, i: any, n: any) => n[i].parentNode.appendChild(n[i].cloneNode(true))) // copying itself
      .attr('class', 'track-inset')
      .select((d: any, i: any, n: any) => n[i].parentNode.appendChild(n[i].cloneNode(true)))  // copying itself
      .attr('class', 'track-overlay')
      .call(d3.drag()
        .on('drag start', (e: any) => {

          // to avoid cursor running if a click is done on the slider bar...
          playButton.text('Pause');
          playButton.dispatch('click')

          this.selectedDatePosition = e.x;
          this.update(this.dateRange.invert(this.selectedDatePosition));

          // disable timeline node selection
          d3.select('#slider-bar .events')
            .selectAll('circle')
            .style('pointer-events', 'none');
        })
        .on('end', () => {
          // at the drag end we enable the drap map
          this.mapContainer.dragging.enable();

          // enable timeline node selection
          d3.select('#slider-bar .events')
            .selectAll('circle')
            .style('pointer-events', 'all');

          // reset button play if animation is done and play button == continue
          if (this.dateRange.invert(this.selectedDatePosition).toTimeString() === this.endDate.toTimeString()
            || this.dateRange.invert(this.selectedDatePosition).toTimeString() === this.startDate.toTimeString()
          ) {
            playButton.text('Play');
          } else {
            playButton.text('Continue');
          }

        })
      )
      ;

    slider.insert('g', '.track-overlay')
      .attr('class', 'ticks')
      .attr('transform', 'translate(0,' + 21 + ')')
      .selectAll('text')
      .data(this.dateRange.ticks(10)) // number of label on the slider
      .enter()
      .append('text')
      .attr('x', this.dateRange)
      .attr('y', 0)
      .style('font-size', this.fontSize)
      .attr('text-anchor', 'middle')
      .text((d: any) => this.formatDateToYearString(d));

    slider.insert('g', '.track-overlay')
      .attr('class', 'ticks-line')
      .attr('transform', 'translate(0,' + -6 + ')')
      .selectAll('line')
      .data(this.dateRange.ticks(10)) // number of label on the slider
      .enter()
      .append('line')
      .attr('x1', this.dateRange)
      .attr('x2', this.dateRange)
      .attr('y1', 0)
      .attr('y2', 12)
      .style('stroke', 'grey')
      .style('stroke-width', '2px');

    // node trace events from geojson source
    const traceEvents = slider.insert('g', '.track-overlay')
      .attr('class', 'trace-events');
    traceEvents.selectAll('circle').data(this.geoActivitiesData.features).enter()
      .append('circle')
      .attr('class', (d: any) => {
        const selectedDate = this.parseTime(d.properties.start_date);
        if (selectedDate !== null) {
          if (selectedDate >= this.startDate) {
            return 'trace';
          }
        }
        return ''; // ?????
      })
      .attr('r', (d: any) => {
        const selectedDate = this.parseTime(d.properties.start_date);
        if (selectedDate !== null) {
          if (selectedDate >= this.startDate) {
            return 4;
          }
        }
        return 2;
      })
      .attr('cx', (d: any) => {
        const startDate = this.parseTime(d.properties.start_date);
        if (startDate !== null) {
          if (startDate >= this.startDate) {
            return this.dateRange(startDate);
          }
        } else {
          return ''; // ?????
        }
      });

    const trace = slider.insert('line', '.track-overlay')
      .attr('id', 'trace')
      .attr('x1', this.dateRange(this.startDate));

    const handle = slider.insert('circle', '.track-overlay')
      .attr('id', 'handle')
      .attr('r', 10);

    // events
    const events = slider.append('g')
      .attr('class', 'events');

    // update to end date
    this.sliderDate = this.endDate
    this.update(this.endDate);

  }

  displaySliderNodes(geoData: any): void {
    const sliderNodes = d3.select('#slider-bar .events')
      .selectAll('circle')
      .data(geoData, (d: any) => d.properties.id);

    sliderNodes
      .enter()
      .append('circle')
      .attr('id', (d: any) => 'location_' + d.properties.id)
      .attr('class', (d: any) => {
        // in order to match with legend status
        const relatedLegendElement = d3.selectAll('#' + this.legendActivities + ' circle.' + d.properties.type);
        if (relatedLegendElement.size() > 0) {
          if (relatedLegendElement.classed('disabled')) {
            return 'invisible activityPoint ' + d.properties.type;
          }
        }
        return 'activityPoint ' + d.properties.type;
      })
      .attr('r', this.sliderNodesSize)
      .attr('cursor', 'pointer')
      .attr('cx', (d: any) => this.dateRange(this.parseTime(d.properties.start_date)))
      .on('mouseover', (e: any, d: any) => {
        if (d.properties.id !== this.currentActivityIdSelected) {
          this.BounceMapActivityCircle(d, 4);
        }

        this.interactionWithEventNode(e.currentTarget, d);
        // to link with popup
        d3.select('#popup-feature-' + d.properties.id)
          .style('visibility', 'visible')
          .style('right', '1%');
      })
      .on('mouseout', (e: any, d: any) => {

        if (d.properties.id !== this.currentActivityIdSelected) {
          this.BounceMapActivityCircle(d, 2);
        }

        this.interactionWithEventNode(e.currentTarget, d);
        // link with popup
        d3.select('#popup-feature-' + d.properties.id)
        .style('visibility', 'hidden')
        .style('top', 'unset')
          .style('left', 'unset');

      });
    sliderNodes.exit().remove();
  }

  interactionWithEventNode(svgObject: any, data: any): void {

    const currentElement: any = d3.select(svgObject);
    currentElement.classed('selected', !currentElement.classed('selected')); // toggle class

    const legendElement: any = d3.select('#theme-legend .' + data.properties.type);
    legendElement.classed('selected', !legendElement.classed('selected'));

    const currentActivityCircle = d3.select('#svgActivitiesLayer #node_location_' + data.properties.id + ' circle');
    currentActivityCircle.classed('selected', !currentActivityCircle.classed('selected')); // toggle class

  }

  BounceMapActivityCircle(data: any, scaleR: number): void {
    const currentActivityCircle = d3.select('#svgActivitiesLayer #node_location_' + data.properties.id + ' circle');
    this.circleBouncer(currentActivityCircle, scaleR);
  }

  circleBouncer(object: any, rScale: number): void {
    object
      .transition()
      .duration(1000)
      .ease(d3.easeElastic)
      .attr('r', (d: any) => d.properties.months * rScale);
  }

  sliderEventCircleBounceRepeat(d3Object: any): void {
    d3Object
      .transition()
      .duration(1000)
      .ease(d3.easeElastic)
      .attr('r', this.sliderNodesSize * 2)
      // .style("opacity", 1)
      .transition()
      .duration(500)
      .ease(d3.easeLinear)
      .attr('r', this.sliderNodesSize)
      // .style("opacity", 0)
      .on('end', this.sliderEventCircleBounceRepeat.bind(this, d3Object));
  }

}
