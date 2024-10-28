import {Component, Inject, Input, OnInit} from "@angular/core";
import {WebsocketService} from "../Services/websocket.service";
import {ToastrService} from "ngx-toastr";
import {AppEventType} from "../Specfiles/Enums";
import {AppEvent, EventQueueService} from "../Services/eventQueue.service";

// split on colon
const comp = window.location.href.split(':');
const DEFAULT_PORT = 3000;
// proto:address:port
const DEFAULT_ADDRESS = [comp[0], comp[1], DEFAULT_PORT].join(':');
const DEFAULT_ALIAS = 'OP_' + Math.floor(Math.random() * 9) + Math.floor(Math.random() * 9)
  + Math.floor(Math.random() * 9);

@Component({
  selector: 'app-connection-view',
  templateUrl: './ConnectionView.component.html',
  styleUrls: ['./ConnectionView.css']
})

export class ConnectionViewComponent implements OnInit {

  @Input() visible: boolean;
  currentAlias: string;
  currentAddress: string;
  newAlias: string;
  newAddress: string;
  backendConnected: boolean;
  roverConnected: boolean;
  clients: string[];

  constructor(@Inject(ToastrService) private toastr: ToastrService,
              @Inject(WebsocketService) private socketService: WebsocketService,
              @Inject(EventQueueService) private eventQueue: EventQueueService) {
    this.currentAlias = "None";
    this.currentAddress = "None";
    this.newAlias = DEFAULT_ALIAS;
    this.newAddress = DEFAULT_ADDRESS;
    this.backendConnected = false;
    this.roverConnected = false;
    this.clients = [];
  }

  darkMode: boolean;

  ngOnInit(): void {
    this.eventQueue.on(AppEventType.darkMode).subscribe(event => this.toggleDarkMode(event.payload));
    this.toggleDarkMode(this.eventQueue.darkModeEnabled());
  }

  toggleDarkMode(darkMode: boolean) {
    this.darkMode = darkMode;
  }

  disconnect() {
    this.socketService.disconnect();
    this.currentAlias = "None";
    this.currentAddress = "None";
    // update internal status, notify observers
    this.backendConnected = false;
    this.roverConnected = false;
    this.eventQueue.dispatch(new AppEvent(AppEventType.backendConnection, this.backendConnected));
    this.eventQueue.dispatch(new AppEvent(AppEventType.roverConnection, this.roverConnected));
    this.clients = [];
  }

  connectToAddress() {
    this.disconnect();
    this.socketService.connect_to(this.newAddress);
    // error will be thrown async
    this.socketService.listen("connect_error").subscribe(() => {
      this.toastr.error('Couldn\'t establish connection to backend on ' + this.newAddress, "Connection Error");
      // only trigger once
      this.socketService.socket.off("connect_error");
    });

    this.socketService.listen("access_denied").subscribe((message) => {
      this.toastr.error(message.toString(), "access_denied");
      this.socketService.disconnect();
    });
    this.socketService.listen("access_granted").subscribe(() => {
      this.toastr.success("", "access_granted");
      this.currentAddress = this.newAddress;
      this.currentAlias = this.newAlias;
      this.backendConnected = true;
      // update listeners
      this.eventQueue.dispatch(new AppEvent(AppEventType.backendConnection, this.backendConnected));
    });
    this.socketService.listen("client_list").subscribe((list: string[]) => {
      this.clients = list;
    });
    // listen for rover connection changes directly from socket, update state
    this.socketService.listen("rover_beacon").subscribe(() => {
      if (!this.roverConnected) {
        // update internal status, notify observers
        this.roverConnected = true;
        this.eventQueue.dispatch(new AppEvent(AppEventType.roverConnection, this.roverConnected));
        this.toastr.success("First Rover Beacon was registered", "Rover says hi");
      }
    });
    this.socketService.listen("rover_is_disconnected").subscribe(() => {
      // update internal status, notify observers
      this.roverConnected = false;
      this.eventQueue.dispatch(new AppEvent(AppEventType.roverConnection, this.roverConnected));
      this.toastr.error("No Rover Beacon was received recently", "Rover has gone missing");
    });

    this.socketService.emit("request_access", {
      alias: this.newAlias
    });


  }

}
