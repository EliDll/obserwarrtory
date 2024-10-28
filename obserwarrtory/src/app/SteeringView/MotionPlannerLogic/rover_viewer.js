import {Rover} from "./rover";
import * as vec from "vec-la";

const spot_turn_diameter = 30;

export class RoverViewer {
  static draw(p, rover, command, darkMode) {

    p.push();
    p.translate(rover.pos[0], rover.pos[1])
    p.scale(1, -1); // invert y

    // TODO: sort
    // // temporary Wheels array
    // tempWheels = wheels.slice();
    // // reverse wheels array (necessary to draw lines over others)
    // if (rover.distance < 0) tempWheels.reverse();

    this.drawWheelGuides(p, rover.wheels, command);

    this.drawWheels(p, rover.wheels, command);

    this.drawWheelTrajectories(p, rover.wheels, command);

    this.drawRoverTrajectory(p, command);

    this.drawWheelDistanceText(p, rover.wheels, command, darkMode);

    this.drawRoverCenter(p);

    this.drawRoverDistance(p, command, darkMode);

    p.pop();
  }

  static drawWheelGuides(p, wheels, command) {
    for (let wheel of wheels) {
      p.noFill();
      p.stroke(210);
      p.strokeWeight(1);

      // driving strait
      if (command.rotAngleRad == 0) {

        // no movement
        if (command.distance == 0) return;

        p.push();
        p.translate(wheel.offset[0], wheel.offset[1]);
        p.rotate(Rover.getWheelAngleRad(wheel.offset, command));
        p.line(0, 1000, 0, -1000);
        p.pop();

      } else {
        // circular guide
        let vecRotCenter = Rover.getRotationCenter(command);
        p.circle(vecRotCenter[0], vecRotCenter[1], 2 * Rover.getWheelRadius(wheel.offset, command));
      }
    }
  }

  static drawWheelTrajectories(p, wheels, command) {

    for (let wheel of wheels) {
      p.strokeWeight(3);
      p.stroke(wheel.color);

      if (command.rotAngleRad == 0) {
        // straight movement
        p.push();
        p.translate(wheel.offset[0], wheel.offset[1])
        p.line(0, 0, command.vecDirection[0], command.vecDirection[1]);
        p.pop();
      } else {
        // curved movement
        this.drawArc(p, wheel.offset, Rover.getRotationCenter(command), command.rotAngleRad);
      }
    }
  }

  static drawWheelDistanceText(p, wheels, command, darkMode) {
    for (let wheel of wheels) {
      let stext = Math.abs(Rover.getWheelDistance(wheel.offset, command)).toFixed(2);
      let x = wheel.offset[0] + Math.sign(wheel.offset[0]) * 50;
      let y = wheel.offset[1];
      this.drawCenteredText(p, stext, x, y, darkMode);
    }
  }

  static drawWheels(p, wheels, command) {
    for (let wheel of wheels) {
      p.push();

      p.translate(wheel.offset[0], wheel.offset[1]);

      // rotate wheel
      p.rotate(Rover.getWheelAngleRad(wheel.offset, command));

      // draw wheel rect
      p.fill(wheel.color);
      p.noStroke();
      p.rectMode(p.CENTER);
      p.rect(0, 0, 10, 25);

      p.pop();
    }
  }

  static drawRoverTrajectory(p, command) {

    p.strokeWeight(1);
    p.stroke(255, 150, 150);
    p.line(0, 0, command.vecDirection[0], command.vecDirection[1]);

    p.strokeWeight(3);
    p.stroke(0);

    if (command.rotAngleRad == 0) {
      if (command.distance == 0) return;

      // straight movement
      p.line(0, 0, command.vecDirection[0], command.vecDirection[1]);

    } else {
      if (command.distance == 0) {
        // rotation on spot
        this.drawSpotCircle(p, command.rotAngleRad);
      } else {
        // curved movement
        this.drawArc(p, [0, 0], Rover.getRotationCenter(command), command.rotAngleRad);
      }
    }
  }

  static drawRoverCenter(p) {
    p.fill(255, 0, 0, 100);
    p.noStroke();
    p.circle(0, 0, 15);
  }

  static drawRoverDistance(p, command, darkMode) {
    this.drawCenteredText(p, command.distance.toFixed(2), 0, -20, darkMode);
  }

  static drawSpotCircle(p, rotAngleRad) {
    p.push();
    p.rotate(Math.PI / 2);
    if (rotAngleRad > 0) p.rotate(-rotAngleRad); // always draw counter clockwise
    p.arc(0, 0, spot_turn_diameter, spot_turn_diameter, 0, Math.abs(rotAngleRad));
    p.pop();
  }

  static drawArc(p, start, center, angle) {
    let vecCenterStart = vec.sub(start, center);
    let offsetAngle = Math.atan2(vecCenterStart[1], vecCenterStart[0]);
    let radius = vec.mag(vecCenterStart);

    p.push();

    p.translate(center[0], center[1]);

    p.noFill();
    p.rotate(offsetAngle)
    if (angle > 0) p.rotate(-angle) // always draw counter clockwise
    p.arc(0, 0, radius * 2, radius * 2, 0, Math.abs(angle));

    // draw center point
    p.stroke(0);
    p.point(0, 0);
    p.pop();
  }

  static drawCenteredText(p, stext, x, y, darkMode, fontsize = 12) {
    p.push();
    p.translate(x, y);
    p.scale(1, -1);

    p.textSize(fontsize);

    p.noStroke();
    p.rectMode(p.CENTER);
    darkMode == true ? p.fill(66, 200) : p.fill(255, 200);
    p.rect(0, -1, p.textWidth(stext) + 5, fontsize+1);
    darkMode == true? p.fill(255) : p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(stext, 0, 0);
    p.pop();
  }
}
