import {Injectable} from '@angular/core';
import {Observable, Subject} from "rxjs";
import {AppEventType} from "../Specfiles/Enums";
import {filter} from 'rxjs/operators';

export class AppEvent<T> {
  constructor(
    public type: AppEventType,
    public payload: T,
  ) {
  }
}

@Injectable({
  providedIn: 'root'
})

export class EventQueueService {

  private eventBrocker = new Subject<AppEvent<any>>();
  private darkMode: boolean;

  on(eventType: AppEventType): Observable<AppEvent<any>> {
    return this.eventBrocker.pipe(filter(event => event.type === eventType));
  }

  dispatch<T>(event: AppEvent<T>): void {
    this.eventBrocker.next(event);
  }

  // static version for component initialization
  darkModeEnabled() {
    return this.darkMode;
  }

  setDarkMode(darkMode: boolean) {
    this.darkMode = darkMode;
  }

}
