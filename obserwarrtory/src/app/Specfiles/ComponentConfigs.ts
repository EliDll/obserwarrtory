import {CType, MCMode} from "./Enums";
import {Node} from "./Node";

export interface MotorControllerConfig {
  // has to be string for golden layout
  id: string;
  mode: MCMode;
  delay: number;
  timeout: number;
  posRelative: boolean;
  posMaxVel: number;
  posSlider: number;
  velSlider: number;
}

export interface ChartConfig {
  // has to be string for golden layout
  id: string;
  type: CType;
  maxThresh: boolean;
  minThresh: boolean;
  fixedScaling: boolean;
  nTimestamps: number;
  axisMax: number;
  axisMin: number;
  maxThreshVal: number;
  minThreshVal: number;
  datasets?: any;
  cachedTree?: Node[];
}
