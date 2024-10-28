// File that contains all custom enums

export enum MPMode {
  ABSOLUTE,
  RELATIVE
}

export enum STMode {
  OFF,
  ON,
  PARK
}

export enum EPSRail {
  RAIL5V,
  RAIL48V,
}

export enum SystemPowerAction {
  RESTART,
  SHUTDOWN
}

export enum Power {
  OFF,
  ON
}

export enum DSType {
  GETTER,
  SETTER,
  DOER
}

export enum CppTypeEnum {
  FLOAT,
  INT_8,
  INT_16,
  INT_32,
  UINT_8,
  UINT_16,
  UINT_32,
  STRING
}

export enum MotorEnum {
  solar_tracking_tilt,
  solar_tracking_rot,
  front_l_drive,
  front_r_drive,
  mid_l_drive,
  mid_r_drive,
  rear_l_drive,
  rear_r_drive,
  front_l_steer,
  front_r_steer,
  mid_l_steer,
  mid_r_steer,
  rear_l_steer,
  rear_r_steer,
}

export enum SensorEnum {
  surface_temp,
  surface_dist,
  solar_tracking_angle_err,
  pl_chip_temp,
  input_voltage,
  output_voltage,
  total_current,
  battery_temp,
  env_temp,
  front_l_angle,
  front_r_angle,
  mid_l_angle,
  mid_r_angle,
  rear_l_angle,
  rear_r_angle,
  front_l_vel,
  front_r_vel,
  mid_l_vel,
  mid_r_vel,
  rear_l_vel,
  rear_r_vel,
  front_l_drive_amp,
  front_r_drive_amp,
  mid_l_drive_amp,
  mid_r_drive_amp,
  rear_l_drive_amp,
  rear_r_drive_amp,
  front_l_steer_amp,
  front_r_steer_amp,
  mid_l_steer_amp,
  mid_r_steer_amp,
  rear_l_steer_amp,
  rear_r_steer_amp,
  front_l_drive_torque,
  front_r_drive_torque,
  mid_l_drive_torque,
  mid_r_drive_torque,
  rear_l_drive_torque,
  rear_r_drive_torque,
  front_l_steer_torque,
  front_r_steer_torque,
  mid_l_steer_torque,
  mid_r_steer_torque,
  rear_l_steer_torque,
  rear_r_steer_torque,
  front_l_drive_temp,
  front_r_drive_temp,
  mid_l_drive_temp,
  mid_r_drive_temp,
  rear_l_drive_temp,
  rear_r_drive_temp,
  front_l_steer_temp,
  front_r_steer_temp,
  mid_l_steer_temp,
  mid_r_steer_temp,
  rear_l_steer_temp,
  rear_r_steer_temp,
}

export enum AppEventType {
  darkMode,
  beacon,
  backendConnection,
  roverConnection,
}

export enum MCMode {
  POS = "POS",
  VEL = "VEL"
}

export enum CType {
  PLOT = "PLOT",
  BAR = "BAR"
}

export enum TreeSubject {
  MOTORS,
  SENSORS
}

