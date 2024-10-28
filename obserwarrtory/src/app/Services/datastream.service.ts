import {Inject, Injectable} from '@angular/core';
import {Beacon, BeaconEntry} from "../Specfiles/Instructions";
import {sensorMap} from "../Specfiles/Sensors";
import {AppEvent, EventQueueService} from "./eventQueue.service";
import {AppEventType} from "../Specfiles/Enums";

@Injectable({
  providedIn: 'root'
})


export class DatastreamService {

  constructor(@Inject(EventQueueService) private eventQueue: EventQueueService) {
  }

  generating = false;
  fnHandle: any;

  toggle() {
    if (!this.generating) {
      // start loop, assign repeating event to handle
      this.fnHandle = setInterval(() => this.generateBeacon(), 100);
    } else {
      // disable loop
      clearInterval(this.fnHandle);
    }
    this.generating = !this.generating;
  }

  generateBeacon() {
    const unixTime =  Math.floor(Date.now() / 1000);
    const payload: BeaconEntry[] = [];

    for (const name of sensorMap.keys()) {
      const entry: BeaconEntry = {
        id: sensorMap.get(name),
        value: Math.random() * 10
      };
      payload.push(entry);
    }

    const beaconObj: Beacon = {
      timestamp: unixTime,
      data: payload,
    };

    this.eventQueue.dispatch(new AppEvent(AppEventType.beacon, beaconObj));
  }


}
