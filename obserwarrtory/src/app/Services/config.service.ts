import {Injectable} from "@angular/core";

@Injectable({
  providedIn: 'root'
})

// intermediate to fetch config files from backend REST and cache them
export class ConfigService {



  constructor() {}


  datapoints = null;
  motors = null;

  getDatapoints(){
    if (!this.datapoints){

      this.datapoints = [
        {
          id: "PL",
          children: [
            {id: "PL/TEMP"},
            {id: "PL/DIST"},
            {id: "PL/POS"},
          ]
        },
        {
          id: "EPS",
          children: [
            {id: "EPS/AMP"},
            {id: "EPS/VOLT"},
          ]
        }
      ];

    }
    return this.datapoints;
  }

  getMotors(){
    if (!this.motors){

      this.motors = [
        {
          id: "Drivetrain",
          children: [
            {
              id: "Steering Motors",
              children: [
                {id: "front_l_steering"},
                {id: "front_r_steering"},
                {id: "mid_l_steering"},
                {id: "mid_r_steering"},
                {id: "rear_l_steering"},
                {id: "rear_r_steering"},
              ]
            },
            {
              id: "Driving Motors",
              children: [
                {id: "front_l_driving"},
                {id: "front_r_driving"},
                {id: "mid_l_driving"},
                {id: "mid_r_driving"},
                {id: "rear_l_driving"},
                {id: "rear_r_driving"},
              ]
            }
          ]
        },
        {
          id: "Payload",
          children: [
            {id: "pl_tilt"},
            {id: "pl_horizontal"},
            {id: "pl_vertical"}
          ]
        }
      ];

    }
    return this.motors;
  }

  // const TREE_DATA = [
//   {
//     id: "PL",
//     children: [
//       {id: "pl_surface_temp"},
//       {id: "pl_solar_flux_density"},
//       {id: "pl_sun_tracking_x"},
//       {id: "pl_sun_tracking_y"}
//     ]
//   },
//   {
//     id: "EPS",
//     children: [
//       {id: "eps_rail1_voltage"},
//       {id: "eps_rail1_current"},
//       {id: "eps_rail2_voltage"},
//       {id: "eps_rail2_current"},
//       {id: "eps_rover_charge"}
//     ]
//   },
//   {
//     id: "ESC",
//     children: [
//       {id: "esc_current"},
//       {id: "esc_sp"},
//       {id: "esc_pv"}
//     ]
//   }
// ];


  //
  //
  //
  // this.http.get(`http://localhost:1337/api/sample/ping`).subscribe(
  //   data => {
  //     this.definedTree = data;
  //     console.log('cool:', this.definedTree.message);
  //     this.definedTree  = this.definedTree.message
  //     this.redraw()
  //     //this.ngOnInit()
  //   },
  //   // The 2nd callback handles errors.
  //   (err) => console.error(err),
  //   // The 3rd callback handles the "complete" event.
  //   () => this.redraw()
  // );
  //
  // if (this.definedTree != []){
  //   //this.appRef.tick();
  // }
  // console.log('init!', this.definedTree)

}
