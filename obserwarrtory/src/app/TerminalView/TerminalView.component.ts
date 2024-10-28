import {Component, Inject, OnInit} from "@angular/core";
import {ToastrService} from "ngx-toastr";
import {WebsocketService} from "../Services/websocket.service";


interface Attribute {
  key: string;
  value: any;
  type: string;
}

@Component({
  selector: "app-terminal-view",
  templateUrl: "./TerminalView.component.html",
  styleUrls: ["./TerminalView.css"]
})

export class TerminalViewComponent implements OnInit {

  attributes: Attribute[];

  TYPE_STRING;
  TYPE_BOOLEAN;
  TYPE_NUMBER;

  constructor(@Inject(ToastrService) private toastr: ToastrService, @Inject(WebsocketService) private socket: WebsocketService) {
    this.attributes = [];

    this.TYPE_STRING = "string";
    this.TYPE_BOOLEAN = "bool";
    this.TYPE_NUMBER = "number";
  }


  ngOnInit(): void {
  }

  addAttribute(type: string) {
    switch (type) {
      case  this.TYPE_BOOLEAN:
        this.attributes.push(
          {
            key: "",
            value: "true",
            type
          }
        );
        break;
      case  this.TYPE_STRING:
        this.attributes.push(
          {
            key: "",
            value: "",
            type
          }
        );
        break;
      case  this.TYPE_NUMBER:
        this.attributes.push(
          {
            key: "",
            value: 0,
            type
          }
        );
        break;
    }
  }

  removeAttribute(key: string) {
    this.attributes = this.attributes.filter((attribute, index, arr) => {
      return attribute.key !== key;
    });
  }

  transmitCommand() {
    const keys = this.attributes.map(element => element.key);
    if (this.hasDuplicates(keys)) {
      this.toastr.error("Duplicate attriubute keys", "Invalid JSON");
    } else if (this.attributes.length === 0) {
      this.toastr.error("Empty Instruction", "Invalid JSON");
    } else if (keys.includes("")) {
      this.toastr.error("Empty attribute key", "Invalid JSON");
    } else {
      const cmd = this.buildObject();
      try {
        this.socket.emit("rover_instruction", JSON.stringify(cmd));
        this.toastr.success("Custom JSON", "Instruction transmitted !");
      } catch (error) {
        console.error(error);
        this.toastr.error(error, "Transmission Error !");
      }
    }
  }

  hasDuplicates(array) {
    return (new Set(array)).size !== array.length;
  }

  buildObject() {
    const object = new Object();
    this.attributes.forEach(attribute => {
      // for two way binding with view the bool has to be saved as a string up until this point
      if (attribute.type ===  this.TYPE_BOOLEAN) {
        if (attribute.value === "true") {
          object[attribute.key] = true;
        } else {
          object[attribute.key] = false;
        }
      } else {
        object[attribute.key] = attribute.value;
      }
    });
    return object;
  }

}
