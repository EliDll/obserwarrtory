import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {MotorControlViewComponent} from './MotorControlView/MotorControlView.component';
import {MonitoringViewComponent} from './MonitoringView/MonitoringView.component';
import {SteeringViewComponent} from './SteeringView/SteeringView.component';
import {SinteringViewComponent} from "./SinteringView/SinteringView.component";
import {StateControlViewComponent} from "./StateControlView/StateControlView.component";


// All top level components that shall have their own route in the menu must be declared here
const routes: Routes = [
  {path: 'motors', component: MotorControlViewComponent},
  {path: 'monitoring', component: MonitoringViewComponent},
  {path: 'steering', component: SteeringViewComponent},
  {path: 'sintering', component: SinteringViewComponent},
  {path: 'state', component: StateControlViewComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
