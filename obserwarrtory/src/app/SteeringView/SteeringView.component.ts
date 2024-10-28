import {Component, OnInit, OnDestroy, Inject} from "@angular/core";
import * as p5 from "p5";
import * as vec from "vec-la";
import {ToastrService} from "ngx-toastr";
import {WebsocketService} from "../Services/websocket.service";
import {RoverCommand} from "./MotionPlannerLogic/rover_command";
import {Rover} from "./MotionPlannerLogic/rover";
import {RoverViewer} from "./MotionPlannerLogic/rover_viewer";
import * as Instructions from "../Specfiles/Instructions";
import {EventQueueService} from "../Services/eventQueue.service";
import {AppEventType} from "../Specfiles/Enums";

// only top level variables can be accessed in p5 context
let distanceVec: [number, number] = [0, 0];
let angle = 0;

const windowHeight = 750;
const windowWidth = 750;
let backgroundRgb = 255;
let darkMode = false;

// offset for wheels
const side_offset = 30;
const front_offset = 30;
const back_offset = -30;

// initialize rover with placement on canvas
const rover = new Rover(0, 0);


window.addEventListener("gamepadconnected", (event: GamepadEvent) => {
  console.log("A gamepad connected:");
  console.log(event.gamepad);
});

window.addEventListener("gamepaddisconnected", (event: GamepadEvent) => {
  console.log("A gamepad disconnected:");
  console.log(event.gamepad);
});

@Component({
  selector: "app-steering-view",
  templateUrl: "./SteeringView.component.html",
  styleUrls: ["./SteeringView.component.css"]
})


export class SteeringViewComponent implements OnInit, OnDestroy {

  // Canvas object
  private p5;

  distanceX: number;
  distanceY: number;
  angle: number;
  radius: number;
  gamepadInputEnabled: boolean;


  // optional command parameters in sec
  delay = 0;
  timeout = 20;

  constructor(@Inject(ToastrService) private toastr: ToastrService,
              @Inject(WebsocketService) private socket: WebsocketService,
              @Inject(EventQueueService) private eventQueue: EventQueueService) {
    this.distanceX = 0;
    this.distanceY = 0;
    this.angle = 0;
    this.radius = 0;
    this.gamepadInputEnabled = true;
  }

  darkMode: boolean;

  ngOnInit(): void {
    this.eventQueue.on(AppEventType.darkMode).subscribe(event => this.toggleDarkMode(event.payload));
    this.toggleDarkMode(this.eventQueue.darkModeEnabled());
    this.createCanvas();
    this.drawChange();
  }

  toggleDarkMode(darkModeEnabled: boolean) {
    this.darkMode = darkModeEnabled;
    darkMode = darkModeEnabled;
    backgroundRgb = darkModeEnabled ? 66 : 255;
  }

  ngOnDestroy(): void {
    this.destroyCanvas();
  }

  private createCanvas = () => {
    // initialize p5 context and behaviour
    this.p5 = new p5(this.drawing);
  }

  private destroyCanvas = () => {
    this.p5.noCanvas();
  }

  // Specifies the behaviour of the p5 Object
  private drawing = (p: any, componentRef = this) => {
    p.setup = () => {
      p.createCanvas(windowWidth, windowHeight).parent("p5container");

      rover.pos = [windowWidth / 2, windowHeight / 2];

      p.colorMode(p.HSB, 100);

      // setup wheels
      rover.wheels = [
        {offset: [side_offset, front_offset], color: p.color(0, 100, 100, 100)}, // right front
        {offset: [side_offset, 0], color: p.color(15, 100, 100, 100)}, // right middle
        {offset: [side_offset, back_offset], color: p.color(30, 100, 100, 100)}, // right back

        {offset: [-side_offset, front_offset], color: p.color(45, 100, 100, 100)}, // left front
        {offset: [-side_offset, 0], color: p.color(60, 100, 100, 100)}, // left middle
        {offset: [-side_offset, back_offset], color: p.color(75, 100, 100, 100)}, // left back
      ];

      p.colorMode(p.RGB);
    };

    p.draw = (ctx = componentRef) => {
      p.background(backgroundRgb);

      if (this.gamepadInputEnabled){
        handleGamepads(componentRef);
      }
      const command = fetchCommand();

      RoverViewer.draw(p, rover, command, darkMode);
    };


    function handleGamepads(ctx) {
      const gamepads = navigator.getGamepads();

      // fetch gamepad
      const gp = gamepads[0];
      if (gp) {
        const x = gp.axes[0] * 300;
        const y = gp.axes[1] * -300;
        const deg = gp.axes[2] * 360;
        ctx.distanceX = x;
        ctx.distanceY = y;
        ctx.angle = deg;
        ctx.drawChange();
        // if (gp.buttons[0].pressed) ctx.transmitCommand();
      }

      // findGamepad(gamepads);

      // if (gamepadIndex !== -1) {
      //
      //   const gp = gamepads[gamepadIndex];
      //
      // }
    }

    function fetchCommand() {
      const command = RoverCommand.fromSpacemouse(distanceVec, angle / 360);

      // TODO support other types of input

      // let vecLeftJoystick = [distanceX, distanceY];
      // let vecRightJoystick = [angleX, angleY];
      // if (simpleGamepadMode) {
      //   command = RoverCommand.fromGamepadSimple(vecLeftJoystick, vecRightJoystick);
      // } else {
      //   command = RoverCommand.fromGamepad(vecLeftJoystick, vecRightJoystick);
      // }

      return command;
    }


    function findGamepad(gamepads) {

      // TODO MotorController support

      // gamepadIndex = -1;
      // spacemouse = false;
      //
      // for (let i = 0; i < 4; i++) {
      //   if (gamepads[i]) {
      //     if (gamepads[i].id === "3Dconnexion SpaceNavigator (Vendor: 046d Product: c626)") {
      //       continue;
      //     }
      //
      //     gamepadIndex = i;
      //
      //     if (gamepads[i].id === "Spacenav Joystick (Vendor: dead Product: beef)") {
      //       spacemouse = true;
      //     }
      //   }
      // }
    }


  }

  drawChange() {
    // hand over parameters to p5
    distanceVec = [this.distanceX / 200, this.distanceY / 200];
    angle = this.angle;
    // get radius with rover logic
    this.radius = Rover.getRotationRadius(vec.mag(distanceVec), (angle * Math.PI) / 180) * 200;
  }

  transmitCommand() {
    const cmd: Instructions.RoverMovement = {
      linear_value: [this.distanceX, this.distanceY],
      angular_value: this.angle
    };
    if (this.timeout !== 20) {
      cmd.timeout = this.timeout;
    }
    if (this.delay !== 0) {
      cmd.time = Math.floor(Date.now() / 1000) + this.delay;
    }

    try {
      this.socket.emit("rover_movement", cmd);
      this.toastr.success("Steering", "Instruction transmitted !");
    } catch (error) {
      console.error(error);
      this.toastr.error(error, "Transmission Error !");
    }
  }

  toggleGamepadInput() {
    this.gamepadInputEnabled = !this.gamepadInputEnabled;
    if (!this.gamepadInputEnabled){
      // reset inputs to zero
      this.distanceX = 0;
      this.distanceY = 0;
      this.angle = 0;
      distanceVec = [this.distanceX / 200, this.distanceY / 200];
      angle = this.angle;
    }
  }


}
