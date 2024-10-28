import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {GoldenLayoutModule, ComponentType} from 'ngx-golden-layout';
import * as $ from 'jquery';
import {ChartComponent} from './Chart/Chart.component';
import {MotorControlViewComponent} from './MotorControlView/MotorControlView.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {MatCardModule} from '@angular/material/card';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatTreeModule} from '@angular/material/tree';
import {MatIconModule} from '@angular/material/icon';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MotorControllerComponent} from './MotorController/MotorController.component';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatSliderModule} from '@angular/material/slider';
import {MatInputModule} from '@angular/material/input';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MonitoringViewComponent} from './MonitoringView/MonitoringView.component';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTab, MatTabsModule} from '@angular/material/tabs';
import {SteeringViewComponent} from './SteeringView/SteeringView.component';
import {CommonModule} from '@angular/common';
import {ToastrModule} from 'ngx-toastr';
import {TreeNavigationComponent} from './treeNavigation/treeNavigation.component';
import { TerminalViewComponent } from './TerminalView/TerminalView.component';
import {MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import { ConnectionViewComponent } from './ConnectionView/ConnectionView.component';
import {MatListModule} from "@angular/material/list";
import { HttpClientModule } from '@angular/common/http';
import { SinteringViewComponent } from './SinteringView/SinteringView.component';
import { StateControlViewComponent } from './StateControlView/StateControlView.component';
import {MatRadioModule} from "@angular/material/radio";

// It is required to have JQuery as global in the window object.
window['$'] = $;

//Declare which comps can be rendered with GL
const componentTypes: ComponentType[] = [{
  name: 'chart',
  type: ChartComponent,
},
  {
    name: 'controller',
    type: MotorControllerComponent,
  }];

@NgModule({
  declarations: [
    AppComponent,
    ChartComponent,
    MotorControlViewComponent,
    MotorControllerComponent,
    MonitoringViewComponent,
    SteeringViewComponent,
    TreeNavigationComponent,
    TerminalViewComponent,
    ConnectionViewComponent,
    SinteringViewComponent,
    StateControlViewComponent,
  ],
  imports: [
    CommonModule,
    BrowserAnimationsModule, // required animations module
    ToastrModule.forRoot(
      {
        positionClass: 'toast-bottom-left',
        closeButton: false
      }
    ),
    BrowserModule,
    GoldenLayoutModule.forRoot(componentTypes),
    AppRoutingModule,
    DragDropModule,
    MatCardModule,
    BrowserAnimationsModule,
    MatTreeModule,
    MatIconModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    FormsModule,
    MatSliderModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatDividerModule,
    MatToolbarModule,
    MatTabsModule,
    MatOptionModule,
    MatSelectModule,
    MatListModule,
    HttpClientModule,
    MatRadioModule,
    ReactiveFormsModule
  ],
  entryComponents: [ChartComponent, MotorControllerComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}




