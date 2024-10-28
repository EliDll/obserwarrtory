import {AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {MotorControlBrokerService} from "../Services/motorControlBroker.service";
import {Chart} from "node_modules/chart.js";
import {ToastrService} from "ngx-toastr";
import {WebsocketService} from "../Services/websocket.service";
import {AppEventType, MCMode, MPMode} from "../Specfiles/Enums";
import * as Instructions from "../Specfiles/Instructions";
import {motorMap} from "../Specfiles/Motors";
import {EventQueueService} from "../Services/eventQueue.service";
import {MotorControllerConfig} from "../Specfiles/ComponentConfigs";


@Component({
  selector: "app-controller",
  templateUrl: "./MotorController.component.html",
  styleUrls: ["./MotorController.component.css"]
})

export class MotorControllerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("gaugeCanvas", {static: true}) gaugeCanvas: ElementRef<HTMLCanvasElement>;
  // General parameters
  id: string;
  mode: MCMode;
  delay: number;
  timeout: number;
  // POS specific
  posRelative: boolean;
  posMaxVel: number;
  posSlider: number;
  velSlider: number;

  // DOM Elements
  ctx;
  chart;


  subHandles: any[] = [];


  constructor(@Inject(MotorControlBrokerService) private broker: MotorControlBrokerService,
              @Inject(ToastrService) private toastr: ToastrService,
              @Inject(WebsocketService) private socket: WebsocketService,
              @Inject(EventQueueService) private eventQueue: EventQueueService) {
    // proxy constructor arguments, provided by parent view
    const cfg: MotorControllerConfig = this.broker.fetchNextConfig();
    this.id = cfg.id;
    this.mode = cfg.mode;
    this.delay = cfg.delay;
    this.timeout = cfg.timeout;
    this.posRelative = cfg.posRelative;
    this.posMaxVel = cfg.posMaxVel;
    this.posSlider = cfg.posSlider;
    this.velSlider = cfg.velSlider;
  }

  darkMode: boolean;

  ngOnInit(): void {
    this.subHandles.push(this.eventQueue.on(AppEventType.darkMode).subscribe(event => this.toggleDarkMode(event.payload)));
    this.toggleDarkMode(this.eventQueue.darkModeEnabled());
  }

  toggleDarkMode(darkMode: boolean) {
    this.darkMode = darkMode;
    // custom stylesheet depending on darkmode
  }

  ngAfterViewInit() {
    // fetch view element that chartjs needs to modify
    this.ctx = this.gaugeCanvas.nativeElement.getContext("2d");
    // setup right chart type
    if (this.mode === "POS") {
      this.setupPosChart();
    }
    if (this.mode === "VEL") {
      this.setupVelChart();
    }
  }

  ngOnDestroy() {
    // remove all dangling subscriptions
    this.subHandles.forEach(handle => handle.unsubscribe());
    this.broker.pushConfigToSnapshot({
      id: this.id,
      mode: this.mode,
      delay: this.delay,
      timeout: this.timeout,
      posRelative: this.posRelative,
      posMaxVel: this.posMaxVel,
      posSlider: this.posSlider,
      velSlider: this.velSlider
    });
  }

  setupPosChart() {
    let data;
    if (this.posSlider >= 0) {
      data = [0, this.posSlider, 360 - this.posSlider];
    } else {
      data = [360 + this.posSlider, this.posSlider, 0];
    }

    this.chart = new Chart(this.ctx, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [{
          label: "degrees",
          data,
          backgroundColor: [
            "white",
            "#0D47A1",
            "white",
          ],

          borderWidth: 0
        }]
      },
      options: {
        animation: {
          animateRotate: true,
          duration: 0,
        },
        tooltips: {
          enabled: false
        },
        events: []
      }

    });
  }

  setupVelChart() {
    const data = [this.velSlider, 100 - this.velSlider];
    this.chart = new Chart(this.ctx, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [{
          label: "degrees",
          data,
          backgroundColor: [
            "#0D47A1",
            "white",
          ],

          borderWidth: 0
        }]
      },
      options: {
        animation: {
          animateRotate: true,
          duration: 0,
        },
        rotation: Math.PI,
        circumference: Math.PI,
        tooltips: {
          enabled: false
        },
        events: []
      }
    });
  }


  switchMode(str: string) {
    // gets triggered before mode update, update variable

    if (str === "POS") {
      this.mode = MCMode.VEL;
      this.setupVelChart();
    }
    if (str === "VEL") {
      this.mode = MCMode.POS;
      this.setupPosChart();
    }
  }

  drawChange() {
    if (this.mode === "POS") {
      if (this.posSlider >= 0) {
        this.chart.data.datasets[0].data = [0, this.posSlider, 360 - this.posSlider];
      } else {
        this.chart.data.datasets[0].data = [360 + this.posSlider, this.posSlider, 0];
      }
    }
    if (this.mode === "VEL") {
      this.chart.data.datasets[0].data = [this.velSlider, 100 - this.velSlider];
    }
    this.chart.update();
  }

  reset() {
    if (this.mode === "POS") {
      this.posSlider = 0;
    }
    if (this.mode === "VEL") {
      this.velSlider = 0;
    }
    this.drawChange();
  }

  buildCommand() {
    if (this.mode === "POS") {
      const cmd: Instructions.MotorPosition = {
        // map to enum for transmission
        motor_id: motorMap.get(this.id),
        value: this.posSlider,
        mode: (this.posRelative ? MPMode.RELATIVE : MPMode.ABSOLUTE)
      };
      if (this.posMaxVel !== 100) {
        cmd.max_vel = this.posMaxVel;
      }
      if (this.timeout !== 2) {
        cmd.timeout = this.timeout;
      }
      if (this.delay !== 0) {
        cmd.time = Math.floor(Date.now() / 1000) + this.delay;
      }
      this.transmitCommand(cmd);
    }
    if (this.mode === "VEL") {
      const cmd: Instructions.MotorVelocity = {
        // map to enum for transmission
        motor_id: motorMap.get(this.id),
        value: this.velSlider,
      };
      if (this.timeout !== 2) {
        cmd.timeout = this.timeout;
      }
      if (this.delay !== 0) {
        cmd.time = Math.floor(Date.now() / 1000) + this.delay;
      }
      this.transmitCommand(cmd);
    }
  }

  transmitCommand(cmd) {
    try {
      if (this.mode === "VEL") {
        this.socket.emit("motor_velocity", cmd);
      }
      if (this.mode === "POS") {
        this.socket.emit("motor_position", cmd);
      }
      this.toastr.success(this.id, "Instruction transmitted !");
    } catch (error) {
      console.error(error);
      this.toastr.error(error, "Transmission Error !");
    }


  }

}
