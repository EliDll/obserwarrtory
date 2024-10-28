import {Rover} from "./rover";
import * as vec from "vec-la";

export class RoverCommand {

  constructor(vecDirection = [0, 0], rotAngleRad = 0) {
    this.vecDirection = vecDirection;
    this.rotAngleRad = rotAngleRad;
  }

  static fromGamepadSimple(vecLeftJoystick, vecRightJoystick, distanceLimit = 300, angleLimit = 2 * Math.PI) {
    // no linear translation
    let vecDirection = vec.scale([0, vecLeftJoystick[1]], distanceLimit);
    let rotAngleRad = vecLeftJoystick[0] * angleLimit;
    if (vecLeftJoystick[1] < 0) rotAngleRad = -rotAngleRad;
    return new RoverCommand(vecDirection, rotAngleRad)
  }

  static fromGamepad(vecLeftJoystick, vecRightJoystick, distanceLimit = 300, angleLimit = 2 * Math.PI) {
    let vecDirection = vec.scale(vecLeftJoystick, distanceLimit);
    let vecRight = Rover.getRightVector(vecDirection);

    // prevent overturning
    if (vec.mag(vecRightJoystick) > 1) vecRightJoystick = vec.norm(vecRightJoystick);

    let rotAngleRad = 2 * Math.PI * vec.dot(vecRightJoystick, vecRight);

    return new RoverCommand(vecDirection, rotAngleRad);
  }

  static fromSpacemouse(vecLinearJoystick, angularAxis, distanceLimit = 300, angleLimit = 2 * Math.PI) {
    let vecDirection = vec.scale(vecLinearJoystick, distanceLimit);

    let rotAngleRad = 2 * Math.PI * angularAxis;
    return new RoverCommand(vecDirection, rotAngleRad);
  }

  get distance() {
    return vec.mag(this.vecDirection)
  }
}
