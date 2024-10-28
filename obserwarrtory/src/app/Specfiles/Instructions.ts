import {DSType, EPSRail, MPMode, Power, SensorEnum, STMode, SystemPowerAction} from "./Enums";
import {MotorEnum, CppTypeEnum} from "./Enums";

// Interfaces for the construction of instructions forwarded to the backend
export interface SolarTracking{
  mode: STMode;
}

export interface SystemPower{
  action: SystemPowerAction;
}

export interface ToggleRail{
  id: EPSRail;
  action: Power;
}

export interface MotorPosition{
  motor_id: MotorEnum;
  mode: MPMode;
  value: number;
  max_vel?: number;
  timeout?: number;
  time?: number;
}

export interface MotorVelocity{
  motor_id: MotorEnum;
  value: number;
  timeout?: number;
  time?: number;
}

export interface RoverMovement{
  linear_value: [number, number];
  angular_value: number;
  timeout?: number;
  time?: number;
}

export interface Sinter{
  payload: string;
}

export interface CustomDosis{
  type: DSType;
  cmd_id: number;
  module: number;
  values: (number | string)[];
  values_types: CppTypeEnum[];
  should_answer?: boolean;
}

// Interfaces for incoming data objects from the backend
export interface BeaconEntry{
  id: SensorEnum;
  value: number;
}

export interface Beacon{
  timestamp: number;
  data: BeaconEntry[];
}


