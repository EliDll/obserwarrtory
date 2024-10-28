import {AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {of} from "rxjs";
import {Node} from "../Specfiles/Node";
import {GoldenLayoutComponent} from "ngx-golden-layout";
import {MotorControlBrokerService} from "../Services/motorControlBroker.service";
import {motors} from "../Specfiles/Motors";
import {EventQueueService} from "../Services/eventQueue.service";
import {AppEventType, MCMode, TreeSubject} from "../Specfiles/Enums";


// initialize GL root as stack (tabs) in which components will be generated
let CURRENT_LAYOUT = {
  content: [{
    type: "stack",
    isClosable: false,
    content: []
  }],
  settings: {
    showCloseIcon: false,
    showMaximiseIcon: false,
    showPopoutIcon: false
  }
};

@Component({
  selector: "app-motor-control-view",
  templateUrl: "./MotorControlView.component.html",
  styleUrls: ["./MotorControlView.component.css"]
})

export class MotorControlViewComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(GoldenLayoutComponent, {static: true}) cmp: GoldenLayoutComponent;
  treeSpec: any;
  cachedTree: Node[];

  myLayout;
  layoutConfig$;
  subHandles: any[] = [];


  constructor(@Inject(MotorControlBrokerService) private broker: MotorControlBrokerService,
              @Inject(EventQueueService) private eventQueue: EventQueueService) {
    // preload child component states at last destruction
    this.broker.loadSnapshot();
    this.layoutConfig$ = of(CURRENT_LAYOUT);
    this.treeSpec = motors;
    this.cachedTree = this.broker.fetchNextNavTree();
  }

  darkMode: boolean;

  ngOnInit(): void {
    this.subHandles.push(this.eventQueue.on(AppEventType.darkMode).subscribe(event => this.toggleDarkMode(event.payload)));
    this.toggleDarkMode(this.eventQueue.darkModeEnabled());
  }

  ngAfterViewInit() {
    this.subHandles.push(this.cmp.stateChanged.subscribe(() => {
      this.saveCurrentLayout();
    }));
  }

  ngOnDestroy() {
    this.subHandles.forEach(handle => handle.unsubscribe());
  }

  toggleDarkMode(darkMode: boolean) {
    this.darkMode = darkMode;
  }

  cacheTree(tree: Node[]){
    this.broker.pushNavTree(tree);
  }


  saveCurrentLayout() {
    CURRENT_LAYOUT = this.cmp.getSerializableState();
    const itemOrder = this.cmp.goldenLayout.root
      .getItemsByFilter((a) => {
        return !a.isColumn && !a.isRow && !a.isStack;
      })
      .map((a) => {
        return a.config.id;
      });
    this.broker.saveGlOrder(itemOrder);
  }

  updateGL(node: Node) {
    // node has string id, lookup enum for config
    if (node.checked) {
      // hand broker config for this component
      this.broker.pushConfigToQueue({
        id: node.id,
        // default config
        mode: MCMode.POS,
        delay: 0,
        timeout: 2,
        posRelative: false,
        posMaxVel: 100,
        posSlider: 0,
        velSlider: 0
      });
      // generate this component in GL
      this.cmp.createNewComponent({
        type: "component",
        componentName: "controller",
        // GL id
        id: node.id,
        // displayed name on top
        title: node.id
      });
    } else {
      // search in GL for corresponding components
      const candidateArray = this.cmp.goldenLayout.root.getItemsById(node.id);
      candidateArray.forEach(element => element.parent.removeChild(element));
      // initialize new empty stack as layout if all elements get deleted
    }
  }

}
