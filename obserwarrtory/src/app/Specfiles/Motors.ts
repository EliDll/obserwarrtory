import {MotorEnum} from "./Enums";

export const motors =
  [{
    id: "PL",
    children: [
      {id: "solar_tracking_tilt"},
      {id: "solar_tracking_rot"}
    ]
  },
    {
      id: "ESC",
      children: [{
        id: "Driving Motors",
        children: [
          {id: "front_l_drive"},
          {id: "front_r_drive"},
          {id: "mid_l_drive"},
          {id: "mid_r_drive"},
          {id: "rear_l_drive"},
          {id: "rear_r_drive"},
        ]
      }, {
        id: "Steering Motors",
        children: [
          {id: "front_l_steer"},
          {id: "front_r_steer"},
          {id: "mid_l_steer"},
          {id: "mid_r_steer"},
          {id: "rear_l_steer"},
          {id: "rear_r_steer"},
        ]
      }
      ]
    }];

export const motorMap: Map<string, MotorEnum>  = new Map([
  ["solar_tracking_tilt", MotorEnum.solar_tracking_tilt],
  ["solar_tracking_rot", MotorEnum.solar_tracking_tilt],
  ["front_l_drive", MotorEnum.front_l_drive],
  ["front_r_drive", MotorEnum.front_r_drive],
  ["mid_l_drive", MotorEnum.mid_l_drive],
  ["mid_r_drive", MotorEnum.mid_r_drive],
  ["rear_l_drive", MotorEnum.rear_l_drive],
  ["rear_r_drive", MotorEnum.rear_r_drive],
  ["front_l_steer", MotorEnum.front_l_steer],
  ["front_r_steer", MotorEnum.front_r_steer],
  ["mid_l_steer", MotorEnum.mid_l_steer],
  ["mid_r_steer", MotorEnum.mid_r_steer],
  ["rear_l_steer", MotorEnum.rear_l_steer],
  ["rear_r_steer", MotorEnum.rear_r_steer],
]);

export const motorMapRev: Map<MotorEnum, string> = new Map([
  [MotorEnum.solar_tracking_tilt, "solar_tracking_tilt"],
  [MotorEnum.solar_tracking_tilt, "solar_tracking_rot"],
  [MotorEnum.front_l_drive, "front_l_drive"],
  [MotorEnum.front_r_drive, "front_r_drive"],
  [MotorEnum.mid_l_drive, "mid_l_drive"],
  [MotorEnum.mid_r_drive, "mid_r_drive"],
  [MotorEnum.rear_l_drive, "rear_l_drive"],
  [MotorEnum.rear_r_drive, "rear_r_drive"],
  [MotorEnum.front_l_steer, "front_l_steer"],
  [MotorEnum.front_r_steer, "front_r_steer"],
  [MotorEnum.mid_l_steer, "mid_l_steer"],
  [MotorEnum.mid_r_steer, "mid_r_steer"],
  [MotorEnum.rear_l_steer, "rear_l_steer"],
  [MotorEnum.rear_r_steer, "rear_r_steer"],
]);
