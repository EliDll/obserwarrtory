import {Component, HostBinding, ViewChild, OnInit, Inject} from '@angular/core';
import {FormControl} from "@angular/forms";
import {OverlayContainer} from "@angular/cdk/overlay";
import {AppEvent, EventQueueService} from "./Services/eventQueue.service";
import {AppEventType} from "./Specfiles/Enums";

@Component({
  templateUrl: './app.component.html',
  selector: 'app-root',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = "obserwarrtory";
  jsonOverlay = false;
  connectionOverlay = false;
  routerEnabled: boolean;
  darkMode: boolean;
  backendConnectionActive: boolean;
  roverConnectionActive: boolean;

  toggleControl = new FormControl(false);
  @HostBinding('class') className = '';

  constructor(@Inject(EventQueueService) private eventQueue: EventQueueService,
              private overlay: OverlayContainer) {
    this.backendConnectionActive = false;
    this.roverConnectionActive = false;
  }

  ngOnInit(): void {
    this.toggleControl.valueChanges.subscribe((darkMode) => {
      this.darkMode = darkMode;
      const darkClassName = 'darkMode';
      if (darkMode) {
        this.className = darkClassName;
        this.overlay.getContainerElement().classList.add(darkClassName);
      } else {
        this.className = '';
        this.overlay.getContainerElement().classList.remove(darkClassName);
      }
      // notify components
      this.eventQueue.dispatch(new AppEvent(AppEventType.darkMode, darkMode));
      // save on service for initialization queries
      this.eventQueue.setDarkMode(darkMode);
    });
    // listen for backend connection changes (handled by connection component), update state
    this.eventQueue.on(AppEventType.backendConnection).subscribe((event) => {
      this.backendConnectionActive = event.payload;
    });
    this.eventQueue.on(AppEventType.roverConnection).subscribe((event) => {
      this.roverConnectionActive = event.payload;
    });

    this.toggleControl.setValue(true);

  }

  toggleRouterState(enabled: boolean) {
    this.routerEnabled = enabled;
  }

  toggleJsonOverlay() {
    this.jsonOverlay = !this.jsonOverlay;
    this.connectionOverlay = false;
  }

  toggleConnectionOverlay() {
    this.connectionOverlay = !this.connectionOverlay;
    this.jsonOverlay = false;
  }

}
