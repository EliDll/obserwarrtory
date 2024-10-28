import {AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {DatastreamService} from "../Services/datastream.service";
import {GoldenLayoutComponent} from "ngx-golden-layout";
import {MonitoringBrokerService} from "../Services/monitoringBroker.service";
import {of} from "rxjs";
import {EventQueueService} from "../Services/eventQueue.service";
import {AppEventType, CType} from "../Specfiles/Enums";

// initialize GL root as stack (tabs) in which components will be generated
let CURRENT_LAYOUT = {
  content: [{
    type: "stack",
    isClosable: false,
    content: []
  }],
  settings: {
    showCloseIcon: false,
    showMaximiseIcon: false,
    showPopoutIcon: false
  }
};


@Component({
  selector: "app-monitoring-view",
  templateUrl: "./MonitoringView.component.html",
  styleUrls: ["./MonitoringView.component.css"]
})
export class MonitoringViewComponent implements OnInit, AfterViewInit, OnDestroy{
  @ViewChild(GoldenLayoutComponent, {static: true}) cmp: GoldenLayoutComponent;
  // IDs for individual plots
  plotCounter: number;
  barCounter: number;
  plotNameInput: string;
  barNameInput: string;
  // Observable for GL to react to config changes
  layoutConfig$;

  streamEnabled: boolean;
  darkMode: boolean;
  subHandles: any[] = [];

  constructor(@Inject(MonitoringBrokerService) private broker: MonitoringBrokerService,
              @Inject(DatastreamService) private datastream: DatastreamService,
              @Inject(EventQueueService) private eventQueue: EventQueueService) {
    // preload child component states at last destruction
    this.broker.loadSnapshot();
    this.layoutConfig$ = of(CURRENT_LAYOUT);
    this.streamEnabled = false;
    this.plotCounter = 1;
    this.barCounter = 1;
    this.plotNameInput = "Plot " + this.plotCounter;
    this.barNameInput = "Bargraph " + this.barCounter;
  }


  ngOnInit(): void {
    this.subHandles.push(this.eventQueue.on(AppEventType.darkMode).subscribe(event => this.darkMode = event.payload));
    this.darkMode = this.eventQueue.darkModeEnabled();
  }

  ngAfterViewInit() {
    this.subHandles.push(this.cmp.stateChanged.subscribe(() => {
      this.saveCurrentLayout();
    }));
  }

  ngOnDestroy(){
    // remove all dangling subscriptions
    this.subHandles.forEach(handle => handle.unsubscribe());
  }

  saveCurrentLayout() {
    CURRENT_LAYOUT = this.cmp.getSerializableState();
    const itemOrder = this.cmp.goldenLayout.root
      .getItemsByFilter((a) => {
        return !a.isColumn && !a.isRow && !a.isStack;
      })
      .map((a) => {
        return a.config.id;
      });
    this.broker.saveGlOrder(itemOrder);
  }


  toggleGenerator() {
    this.datastream.toggle();
    this.streamEnabled = !this.streamEnabled;
  }

  generateComponent(type: string) {
    // determine title from input boxes
    let title;
    switch (type) {
      case CType.PLOT:
        title = this.plotNameInput;
        // autofill next Chart name
        this.plotNameInput = "Plot " + (++this.plotCounter);
        break;
      case CType.BAR:
        title = this.barNameInput;
        // autofill next bar name
        this.barNameInput = "Bargraph " + (++this.barCounter);
        break;
    }
    // generate component
    this.cmp.createNewComponent({
      type: "component",
      componentName: "chart",
      title,
      id: title
    });
    // transmit initial config to broker
    const config = {
      id: title,
      type: type === CType.BAR ? CType.BAR : CType.PLOT,
      nTimestamps: 10,
      axisMax: 10,
      axisMin: 0,
      maxThreshVal: 9,
      minThreshVal: 1,
      maxThresh: false,
      minThresh: false,
      fixedScaling: false,
    };
    this.broker.pushConfigToQueue(config);
  }


}
