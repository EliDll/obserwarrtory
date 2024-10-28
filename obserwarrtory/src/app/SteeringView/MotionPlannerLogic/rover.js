import * as vec from "vec-la";

export class Rover {

  constructor(x, y) {
    this.pos = [x, y];
  }

  static getRightVector(vecDirection) {
    if (vec.mag(vecDirection) == 0) return [1, 0];

    return vec.norm([vecDirection[1], -vecDirection[0]]); // turn right
  }

  static getRotationRadius(distance, rotAngleRad) {
    if (rotAngleRad == 0) return 0;

    return Math.abs(distance / rotAngleRad); // distance = angle[rad] * radius
  }

  static getRotationCenter(roverCommand) {
    let vecRight = this.getRightVector(roverCommand.vecDirection);
    let radius = this.getRotationRadius(roverCommand.distance, roverCommand.rotAngleRad);
    let turnDirection = Math.sign(roverCommand.rotAngleRad);

    return vec.scale(vecRight, radius * turnDirection);
  }

  static getWheelRadius(vecWheelOffset, roverCommand) {
    let vecRotCenter = this.getRotationCenter(roverCommand);
    let vecCenterWheel = vec.sub(vecWheelOffset, vecRotCenter);
    return vec.mag(vecCenterWheel);
  }

  static getWheelAngleRad(vecWheelOffset, roverCommand) {
    let wheelAngleRad = 0;
    if (roverCommand.rotAngleRad == 0) { // pure linear movement
      let vecRight = this.getRightVector(roverCommand.vecDirection);
      wheelAngleRad = Math.atan2(vecRight[1], vecRight[0]);
    } else { // rotational component
      let vecRotCenter = this.getRotationCenter(roverCommand);
      let vecCenterWheel = vec.sub(vecWheelOffset, vecRotCenter);
      wheelAngleRad = Math.atan2(vecCenterWheel[1], vecCenterWheel[0]);
    }

    return wheelAngleRad;
  }

  static getWheelDistance(vecWheelOffset, roverCommand) {

    if (roverCommand.rotAngleRad == 0) return roverCommand.distance;

    let wheelRadius = this.getWheelRadius(vecWheelOffset, roverCommand);
    return wheelRadius * roverCommand.rotAngleRad;

  }

}
