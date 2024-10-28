import {Component, Inject, OnInit} from "@angular/core";
import {WebsocketService} from "../Services/websocket.service";
import {ToastrService} from "ngx-toastr";
import {AppEventType, CppTypeEnum, DSType, EPSRail, Power, STMode, SystemPowerAction} from "../Specfiles/Enums";
import * as Instructions from "../Specfiles/Instructions";
import {EventQueueService} from "../Services/eventQueue.service";
import {cppMap, CppTypeStrings, DMSGTypeStrings, ValueTuple} from "../Specfiles/DosisMessages";

@Component({
  selector: 'app-state-control',
  templateUrl: './StateControlView.component.html',
  styleUrls: ['./StateControlView.component.css']
})
export class StateControlViewComponent implements OnInit {

  rail48V: boolean;
  restartPending: boolean;
  shutdownPending: boolean;
  suntrackingState: string;

  DMSGTypes: string[];
  selectedDMSGType: string;
  DMSGCmdID: number;
  DMSGModuleID: number;
  DMSGValues: ValueTuple[];
  CppTypeArray: string[];

  constructor(@Inject(WebsocketService) private socket: WebsocketService,
              @Inject(ToastrService) private toastr: ToastrService,
              @Inject(EventQueueService) private eventQueue: EventQueueService) {
    this.rail48V = false;
    this.restartPending = false;
    this.shutdownPending = false;
    this.suntrackingState = "off";
    this.DMSGTypes = DMSGTypeStrings;
    this.CppTypeArray = CppTypeStrings;
    this.selectedDMSGType = this.DMSGTypes[0];
    this.DMSGCmdID = 0;
    this.DMSGModuleID = 0;
    this.DMSGValues = [];
  }

  darkMode: boolean;

  ngOnInit(): void {
    this.eventQueue.on(AppEventType.darkMode).subscribe(event => this.darkMode = event.payload);
    this.darkMode = this.eventQueue.darkModeEnabled();
  }

  queueRestart() {
    this.restartPending = !this.restartPending;
    this.shutdownPending = false;
  }

  queueShutdown() {
    this.shutdownPending = !this.shutdownPending;
    this.restartPending = false;
  }

  restart() {
    const cmd: Instructions.SystemPower = {
      action: SystemPowerAction.RESTART
    };
    this.transmit(cmd, "system_power");
    this.restartPending = false;
  }

  shutdown() {
    const cmd: Instructions.SystemPower = {
      action: SystemPowerAction.SHUTDOWN
    };
    this.transmit(cmd, "system_power");
    this.shutdownPending = false;
  }

  transmit(cmd: any, eventName: string) {
    try {
      this.socket.emit(eventName, cmd);
      this.toastr.success(cmd.action, "Instruction transmitted !");
    } catch (error) {
      console.error(error);
      this.toastr.error(error, "Transmission Error !");
    }
  }

  changeSuntracking() {
    let mode: STMode = STMode.ON;
    // determine correct enum
    switch (this.suntrackingState) {
      case "on":
        mode = STMode.ON;
        break;
      case "off":
        mode = STMode.OFF;
        break;
      case "park":
        mode = STMode.PARK;
        break;
    }
    const cmd: Instructions.SolarTracking = {
      mode
    };
    this.transmit(cmd, "solar_tracking_mode");
  }

  toggle48VRail() {
    // Instruction set supports other rails, but currently not allowed
    const cmd: Instructions.ToggleRail = {
      id: EPSRail.RAIL48V,
      action: (this.rail48V ? Power.ON : Power.OFF)
    };
    this.transmit(cmd, "toggle_rail");
  }

  sendDosis() {
    let type: DSType = DSType.GETTER;
    // determine correct enum
    switch (this.selectedDMSGType) {
      case "GETTER":
        type = DSType.GETTER;
        break;
      case "SETTER":
        type = DSType.SETTER;
        break;
      case "DOER":
        type = DSType.DOER;
        break;
    }

    // get value types array as enums
    // tslint:disable-next-line:variable-name
    const values_types: CppTypeEnum[] = this.DMSGValues.map((obj: ValueTuple) => {
      return cppMap.get(obj.type);
    });
    const values: (number | string)[] = this.DMSGValues.map((obj: ValueTuple) => {
      return obj.value;
    });
    const cmd: Instructions.CustomDosis = {
      type,
      cmd_id: this.DMSGCmdID,
      module: this.DMSGModuleID,
      values,
      values_types,
      should_answer: false
    };
    this.transmit(cmd, "custom_dosis");
  }

  addDosisValue() {
    this.DMSGValues.push({
      value: 0,
      type: "UINT_8"
    });
  }

  removeDosisValue(i: number) {
    // remove one element from array at this index, add back remaining
    this.DMSGValues.splice(i, 1);
  }

  castValue(index: number, type: string) {
    const obj = this.DMSGValues[index];
    // initialize value correctly on type switch to avoid type mismatch for old value
    if (type === "STRING") {
      // interpret as string
      obj.value = String(obj.value);
    } else if (type === "FLOAT" && typeof obj.value === "string") {
      // try to cast to float (
      obj.value = this.strToFloat(String(obj.value));

    } else if (typeof obj.value === "string") {
      // try to cast to int without specification of certain base
      obj.value = this.strToInt(String(obj.value));
    }
    // else conversion from number to number, no cast as numerical type conversion is done in backend
  }

  strToFloat(str: string) {
    const floatRep = parseFloat(str);
    // check if NaN by self equality
    if (floatRep !== floatRep) {
      // default to zero
      return 0;
    } else {
      // set to number
      return floatRep;
    }
  }

  strToInt(str: string) {
    // tslint:disable-next-line:radix
    const intRep = parseInt(str);
    // check if NaN by self equality
    if (intRep !== intRep) {
      // default to zero
      return 0;
    } else {
      // set to number
      return intRep;
    }
  }

}
