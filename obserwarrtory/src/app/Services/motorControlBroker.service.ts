import {Injectable} from '@angular/core';
import {MotorControllerConfig} from "../Specfiles/ComponentConfigs";

@Injectable({
  providedIn: 'root'
})

// Acts as a mediator between the container that generates the GL and the individual elements in the GL
// We cannot pass data directly because they are nested in the GL component
// Broker is agnostic of what a passed config actually contains
export class MotorControlBrokerService {

  // acts as pipe that stores configs for components that will be generated next
  private configQueue: MotorControllerConfig[] = [];
  // store the order in which GL instance traverses current layout
  private glOrderSnapshot: string[] = [];
  // stores configs of destroyed components in uncertain order
  private unorderedConfigSnapshot: MotorControllerConfig[] = [];
  private navTreeQueue: any[] =  [];

  constructor() {
  }

  // Adds config to queue, called by container
  pushConfigToQueue(config: MotorControllerConfig) {
    this.configQueue.push(config);
  }

  // Adds config to snapshot, called by element
  pushConfigToSnapshot(config: MotorControllerConfig) {
    this.unorderedConfigSnapshot.push(config);
  }

  // Returns next config in queue
  fetchNextConfig() {
    if (this.configQueue.length !== 0) {
      return this.configQueue.shift();
    } else {
      // shift would return undefined
      return null;
    }
  }

  saveGlOrder(glOrder: string[]) {
    this.glOrderSnapshot = glOrder;
  }

  // replaces queue with last snapshot to reinitialize layout
  loadSnapshot() {
    // flush current Queue
    this.configQueue = [];
    // add configs to queue in GL order
    this.glOrderSnapshot.forEach(
      (id) => {
        // find element in unordered that matches current id
        this.configQueue.push(this.unorderedConfigSnapshot.find((element) => element.id === id));
      }
    );
    // reset snapshot to be filled by components on next destroy
    this.unorderedConfigSnapshot = [];
  }

  fetchNextNavTree(){
    if (this.navTreeQueue.length !== 0) {
      return this.navTreeQueue.shift();
    } else {
      // shift would return undefined
      return null;
    }
  }

  pushNavTree(data){
    this.navTreeQueue.push(data);
  }


}
