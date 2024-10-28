import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild} from "@angular/core";
import {WebGLPreview} from 'gcode-preview';
import * as THREE from 'three';
import * as Presets from "../Specfiles/gcodePresets";
import * as Instructions from "../Specfiles/Instructions";
import {WebsocketService} from "../Services/websocket.service";
import {ToastrService} from "ngx-toastr";
import {EventQueueService} from "../Services/eventQueue.service";
import {AppEventType} from "../Specfiles/Enums";

@Component({
  selector: 'app-sintering-view',
  templateUrl: './SinteringView.component.html',
  styleUrls: ['./SinteringView.component.css']
})
export class SinteringViewComponent implements OnInit, AfterViewInit {
  @ViewChild("previewCanvas", {static: false}) previewCanvas: ElementRef<HTMLCanvasElement>;
  previewRender;
  // identifier of current gcode
  selectedPreset: string;
  // actual current gcode
  currentContent: string;
  gcodeNames: string[];
  gcodeMap: Map<string, string>;
  saveName: string;


  constructor(@Inject(ToastrService) private toastr: ToastrService,
              @Inject(WebsocketService) private socket: WebsocketService,
              @Inject(EventQueueService) private eventQueue: EventQueueService) {
    this.gcodeMap = new Map<string, string>();
    this.currentContent = "";
    this.saveName = "";

    this.gcodeMap.set("warrLogo", Presets.warrLogo);
    this.gcodeMap.set("spiral", Presets.spiral);
    this.gcodeMap.set("wave", Presets.wave);
    this.gcodeNames = Array.from(this.gcodeMap.keys());
  }

  darkMode: boolean;

  ngOnInit(): void {
    this.eventQueue.on(AppEventType.darkMode).subscribe(event => this.toggleDarkMode(event.payload));
    this.darkMode = this.eventQueue.darkModeEnabled();
  }

  toggleDarkMode(darkMode: boolean) {
    this.darkMode = darkMode;
    this.previewRender.scene.background = darkMode ? new THREE.Color(0x424242) : new THREE.Color(0xffffff);
  }

  preview() {
    this.previewRender.clear();
    // prepend height offset
    this.previewRender.processGCode("G0 X0 Y0 Z0.2 E10\n" + this.currentContent);
  }


  ngAfterViewInit() {
    this.previewRender = new WebGLPreview({
      canvas: this.previewCanvas.nativeElement,
      buildVolume: {x: 300, y: 300, z: 0},
      // [0, 750, 0],
      initialCameraPosition: [-200, 450, 500],
      lineWidth: 5,
    });

    this.previewRender.renderExtrusion = true;
    this.previewRender.renderTravel = true;
    this.previewRender.singleLayerMode = true;
    this.previewRender.travelColor = 0x41BF3F;
    // this.previewRender.extrusionColor = 0xD4D42A;
    this.previewRender.lastSegmentColor = 0xD47F2A;
    this.previewRender.topLayerColor = 0x03A9F4;
    // depend on dark mode
    this.previewRender.scene.background = this.darkMode ? new THREE.Color(0x424242) : new THREE.Color(0xffffff);
    this.previewRender.processGCode("");
  }


  reset() {
    this.currentContent = "";
  }

  load() {
    this.currentContent = this.gcodeMap.get(this.selectedPreset);
    this.preview();
  }

  save() {
    this.gcodeNames.push(this.saveName);
    this.gcodeMap.set(this.saveName, this.currentContent);
  }

  transmitCustom() {
    const cmd: Instructions.Sinter = {
      payload: this.currentContent
    };

    try {
      this.socket.emit("sinter", cmd);
      this.toastr.success("GCODE", "Instruction transmitted !");
    } catch (error) {
      console.error(error);
      this.toastr.error(error, "Transmission Error !");
    }
  }


}
