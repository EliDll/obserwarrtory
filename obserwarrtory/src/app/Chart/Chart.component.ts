import {AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Chart} from 'node_modules/chart.js';
import {DatastreamService} from '../Services/datastream.service';
import 'node_modules/chartjs-plugin-annotation';
import {ToastrService} from 'ngx-toastr';
import {MonitoringBrokerService} from "../Services/monitoringBroker.service";
import {Node} from "../Specfiles/Node";
import {WebsocketService} from "../Services/websocket.service";
import {sensorMap, sensorMapRev, sensors} from "../Specfiles/Sensors";
import {EventQueueService} from "../Services/eventQueue.service";
import {AppEventType, CType, TreeSubject} from "../Specfiles/Enums";
import {Beacon, BeaconEntry} from "../Specfiles/Instructions";
import {ChartConfig} from "../Specfiles/ComponentConfigs";


@Component({
  selector: 'app-plot',
  templateUrl: './Chart.component.html',
  styleUrls: ['./Chart.component.css']
})
export class ChartComponent implements OnInit, AfterViewInit, OnDestroy {

  id: string;
  type: CType;

  maxThresh: boolean;
  minThresh: boolean;
  fixedScaling: boolean;

  nTimestamps: number;
  axisMax: number;
  axisMin: number;
  maxThreshVal: number;
  minThreshVal: number;
  // variable to store value from config until view is initialized
  initialDatasets: any = [];
  cachedTree: Node[];

  ctx;
  chart;
  treeSpec;
  subHandles: any[] = [];

  treeVisible: boolean;
  settingsVisible: boolean;
  darkMode: boolean;

  @ViewChild('plotChart', {static: true}) plotChart: ElementRef<HTMLCanvasElement>;

  constructor(@Inject(MonitoringBrokerService) private broker: MonitoringBrokerService,
              @Inject(DatastreamService) private datastream: DatastreamService,
              @Inject(ToastrService) private toastr: ToastrService,
              @Inject(WebsocketService) private socket: WebsocketService,
              @Inject(EventQueueService) private eventQueue: EventQueueService) {
    // proxy constructor arguments, provided by parent view
    const cfg: ChartConfig = this.broker.fetchNextConfig();
    this.id = cfg.id;
    this.type = cfg.type;
    this.maxThresh = cfg.maxThresh;
    this.minThresh = cfg.minThresh;
    this.fixedScaling = cfg.fixedScaling;
    this.nTimestamps = cfg.nTimestamps;
    this.axisMax = cfg.axisMax;
    this.axisMin = cfg.axisMin;
    this.maxThreshVal = cfg.maxThreshVal;
    this.minThreshVal = cfg.minThreshVal;
    if (cfg.datasets) {
      this.initialDatasets = cfg.datasets;
    }
    if (cfg.cachedTree) {
      this.cachedTree = cfg.cachedTree;
    }else{
      // needed to signal navtree to generate from scratch
      this.cachedTree = null;
    }

    this.treeSpec = sensors;
    this.treeVisible = false;
    this.settingsVisible = false;

  }

  ngOnInit(): void {
    // listen to real socket events
    this.subHandles.push(this.socket.listen("rover_beacon").subscribe((beacon: Beacon) => this.addNextTimestamp(beacon)));
    // listen to local generator events
    this.subHandles.push(this.eventQueue.on(AppEventType.beacon).subscribe(event => this.addNextTimestamp(event.payload)));
    this.subHandles.push(this.eventQueue.on(AppEventType.darkMode).subscribe(event => this.toggleDarkMode(event.payload)));
  }

  toggleDarkMode(darkMode: boolean) {
    this.darkMode = darkMode;
    this.chart.options.scales.yAxes[0].gridLines.color = darkMode ? "#757575" : "#BDBDBD";
    this.chart.options.scales.yAxes[0].ticks.fontColor = darkMode ? "#ffffff" : "#BDBDBD";
    this.chart.options.scales.xAxes[0].gridLines.color = darkMode ? "#757575" : "#BDBDBD";
    this.chart.update();
  }

  ngAfterViewInit() {
    this.ctx = this.plotChart.nativeElement.getContext('2d');
    this.setupChart();
    this.toggleDarkMode(this.eventQueue.darkModeEnabled());
    // setup on reactivation
    // configure datasets on reactivation
    // const activeNodes = this.broker.fetchNextActiveNodes();
    // for (const node of activeNodes) {
    //   this.configureDatasets(node);
    // }
    this.chart.data.datasets = this.initialDatasets;
    this.setAxis();
    this.updateOverlays();
  }

  ngOnDestroy() {
    // remove all dangling subscriptions
    this.subHandles.forEach(handle => handle.unsubscribe());
    this.broker.pushConfigToSnapshot({
      id: this.id,
      type: this.type,
      maxThresh: this.maxThresh,
      minThresh: this.minThresh,
      fixedScaling: this.fixedScaling,
      nTimestamps: this.nTimestamps,
      axisMax: this.axisMax,
      axisMin: this.axisMin,
      maxThreshVal: this.maxThreshVal,
      minThreshVal: this.minThreshVal,
      datasets: this.chart.data.datasets,
      cachedTree: this.cachedTree
    });
  }

  cacheTree(tree: Node[]) {
    // save as attribute, will be used in this components config
    this.cachedTree = tree;
  }

  clearChartData() {
    if (this.chart.data.datasets) {
      // reset all data arrays to empty
      this.chart.data.datasets.forEach(set => {
        set.data = [];
      });
      // reset y axis legend
      this.chart.data.labels = [];
      this.chart.update();
    }
  }

  /**
   * adds datasets according to the subtree that was changed by user input
   * @param node entry node for the affected subtree
   */
  configureDatasets(node: Node) {
    // clear chart to align all datasets
    this.clearChartData();
    if (node.checked) {
      // generate the dataset with random color
      switch (this.type) {
        case CType.PLOT:
          this.chart.data.datasets.push({
            label: node.id,
            // determine enum for easier pattern matching
            id: sensorMap.get(node.id),
            borderColor: this.hslToRgb(Math.random(), 0.75, 0.5),
            data: [],
            fill: false
          });
          break;
        case CType.BAR:
          this.chart.data.datasets.push({
            label: node.id,
            id: sensorMap.get(node.id),
            backgroundColor: this.hslToRgb(Math.random(), 0.75, 0.5),
            data: [],
          });
          break;
      }
    } else {
      // remove unchecked dataset
      this.chart.data.datasets = this.chart.data.datasets.filter((value, index, arr) => {
        return value.label !== node.id;
      });
    }
    this.chart.update();
  }


  addNextTimestamp(beacon: Beacon) {
    if (this.chart.data.datasets.length > 0) {
      switch (this.type) {
        case CType.PLOT:
          const maxReached = this.chart.data.datasets[0].data.length >= this.nTimestamps;
          this.chart.data.labels.push(beacon.timestamp);
          if (maxReached) {
            this.chart.data.labels.shift();
          }
          // iterate over datasets
          for (const dataset of this.chart.data.datasets) {
            // scan for datapoint with matching enum
            const datapoint = beacon.data.find((entry: BeaconEntry) => entry.id === dataset.id);
            if (datapoint) {
              const value = datapoint.value;
              dataset.data.push(value);
              if (this.maxThresh && value > this.maxThreshVal) {
                this.toastr.warning(sensorMapRev.get(datapoint.id) + ' exceeds threshold!!', 'Warning!');
              }
              if (this.minThresh && value < this.minThreshVal) {
                this.toastr.warning(sensorMapRev.get(datapoint.id) + ' below threshold!!', 'Warning!');
              }
              // move out oldest value if max reached
              if (maxReached) {
                dataset.data.shift();
              }
            }
          }

          break;
        case CType.BAR:
          this.chart.data.labels = [Math.floor(Date.now() / 1000) % 1000];
          // iterate over datasets
          for (const dataset of this.chart.data.datasets) {
            // scan for datapoint with matching enum
            const datapoint = beacon.data.find(entry => entry.id === dataset.id);
            if (datapoint) {
              const value = datapoint.value;
              dataset.data = [value];
              if (this.maxThresh && value > this.maxThreshVal) {
                this.toastr.warning(sensorMapRev.get(datapoint.id) + ' exceeds threshold!!', 'Warning!');
              }
              if (this.minThresh && value < this.minThreshVal) {
                this.toastr.warning(sensorMapRev.get(datapoint.id) + ' below threshold!!', 'Warning!');
              }
            }
          }
          break;
      }
      this.chart.update();
    }
  }

  setupChart() {
    this.chart = new Chart(this.ctx, {
      type: this.type === CType.BAR ? "bar" : "line",
      options: {
        responsive: true,
        maintainAspectRatio: true,
        tooltips: false,
        scales: {
          yAxes: [{
            display: true,
            ticks: {
              suggestedMin: 0,
              suggestedMax: 10
            }
          }]
        },
        annotation: {
          annotations: []
        }
      },
    });
  }

  toggleSettingsVisibility() {
    this.settingsVisible = !this.settingsVisible;
    this.chart.update();
  }

  toggleTreeVisibility() {
    this.treeVisible = !this.treeVisible;
    this.chart.update();
  }

  setMaxThresh() {
    this.chart.options.annotation.annotations = this.chart.options.annotation.annotations.filter((value) => {
      return value.id !== "max";
    });
    // notify canvas of removal, necessary!
    this.chart.update();
    if (this.maxThresh) {
      this.chart.options.annotation.annotations.push(
        {
          id: "max",
          drawTime: "afterDatasetsDraw",
          type: "line",
          mode: "horizontal",
          scaleID: "y-axis-0",
          value: this.maxThreshVal,
          borderColor: "red",
          borderWidth: 1,
          label: {
            backgroundColor: "red",
            content: "MAX",
            enabled: true
          }
        }
      );
    }
    // notify canvas of addition
    this.chart.update();
  }


  setMinThresh() {
    this.chart.options.annotation.annotations = this.chart.options.annotation.annotations.filter((value) => {
      return value.id !== "min";
    });
    // notify canvas of removal, necessary!
    this.chart.update();
    if (this.minThresh) {
      this.chart.options.annotation.annotations.push(
        {
          id: "min",
          drawTime: "afterDatasetsDraw",
          type: "line",
          mode: "horizontal",
          scaleID: "y-axis-0",
          value: this.minThreshVal,
          borderColor: "red",
          borderWidth: 1,
          label: {
            backgroundColor: "red",
            content: "MIN",
            enabled: true
          }
        }
      );
    }
    // notify canvas of addition
    this.chart.update();
  }

  updateOverlays() {
    this.setMaxThresh();
    this.setMinThresh();
  }

  setAxis() {
    if (this.fixedScaling) {
      // only keep min max if no value exceeds it, otherwise scale accordingly
      this.chart.options.scales.yAxes[0].ticks = {
        suggestedMin: this.axisMin,
        suggestedMax: this.axisMax
      };
    } else {
      // empty for responsive autoscale
      this.chart.options.scales.yAxes[0].ticks = {};
    }
    this.chart.update();

  }

  // https://gist.github.com/mjackson/5311256
  /**
   * Converts an HSL color value to RGB. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes h, s, and l are contained in the set [0, 1] and
   * returns r, g, and b in the set [0, 255].
   *
   * @param   h       The hue
   * @param   s       The saturation
   * @param   l       The lightness
   * @return  Array   The RGB representation
   */
  hslToRgb(h: number, s: number, l: number) {
    // tslint:disable-next-line:one-variable-per-declaration
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      let p = 2 * l - q;

      r = this.hue2rgb(p, q, h + 1 / 3) * 255;
      g = this.hue2rgb(p, q, h) * 255;
      b = this.hue2rgb(p, q, h - 1 / 3) * 255;
    }

    return `rgba(${r},${g},${b},1)`;
  }

  // https://gist.github.com/mjackson/5311256
  hue2rgb(p, q, t) {
    if (t < 0) { t += 1; }
    if (t > 1) { t -= 1; }
    if (t < 1 / 6) { return p + (q - p) * 6 * t; }
    if (t < 1 / 2) { return q; }
    if (t < 2 / 3) { return p + (q - p) * (2 / 3 - t) * 6; }
    return p;
  }


}
