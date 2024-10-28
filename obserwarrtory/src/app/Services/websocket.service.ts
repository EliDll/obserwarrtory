import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  socket: any;
  uri: string;

  constructor() {
  }


// components can request to listen for specific socket events
  listen(eventName: string){
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data) => {
        subscriber.next(data);
      });
    });
  }

// components can send socket events via this service
  emit(eventName: string, data: any){
    this.socket.emit(eventName, data);
  }

  // establish connection to backend uri
  connect_to(uri){
    this.uri = uri;
    // this.socket = io(uri);

    this.socket = io(uri, {
      withCredentials: true
    });
  }

  disconnect(){
    if (this.socket != null){
      this.socket.disconnect();
    }
  }

}
