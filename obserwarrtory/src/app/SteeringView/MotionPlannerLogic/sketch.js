let gui;
let left_joystick;
let right_joystick;
let simpleGamepadModeToggle;

let gamepadIndex = 0;
let spacemouse = false;
let simpleGamepadMode = false;

let side_offset = 30;
let front_offset = 30;
let back_offset = -30;

let spot_turn_diameter = 30;

let rover = new Rover(0, 0);

function setup() {
  createCanvas(windowWidth, windowHeight);
  gui = createGui();

  left_joystick = createJoystick("Left Joystick", 0, 0, 100, 100, -1, 1, 1, -1);
  right_joystick = createJoystick("Right Joystick", 0, 0, 100, 100, -1, 1, 1, -1);
  simpleGamepadModeToggle = createToggle("Simple mode", 0, 0, 200, 30);
  simpleGamepadModeToggle.labelOn = "Simple mode [X]";
  simpleGamepadModeToggle.labelOff = "Simple mode [  ]";
  repositionGui();

  rover.pos = [windowWidth / 2, windowHeight / 2];

  colorMode(HSB, 100);

  // setup wheels
  rover.wheels = [
    { offset: [side_offset, front_offset], color: color(0, 100, 100, 100) }, // right front
    { offset: [side_offset, 0], color: color(15, 100, 100, 100) }, // right middle
    { offset: [side_offset, back_offset], color: color(30, 100, 100, 100) }, // right back

    { offset: [-side_offset, front_offset], color: color(45, 100, 100, 100) }, // left front
    { offset: [-side_offset, 0], color: color(60, 100, 100, 100) }, // left middle
    { offset: [-side_offset, back_offset], color: color(75, 100, 100, 100) }, // left back
  ]

  colorMode(RGB);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  rover.pos = [windowWidth / 2, windowHeight / 2];

  repositionGui();
}

function repositionGui() {
  left_joystick.x = windowWidth / 2 - 20 - left_joystick.w;
  right_joystick.x = windowWidth / 2 + 20;
  simpleGamepadModeToggle.x = windowWidth / 2 - simpleGamepadModeToggle.w / 2

  left_joystick.y = windowHeight - left_joystick.h - 70;
  right_joystick.y = windowHeight - right_joystick.h - 70;
  simpleGamepadModeToggle.y = windowHeight - simpleGamepadModeToggle.h - 20
}

function draw() {
  background(255);

  handleGamepads();
  let command = fetchCommand();

  RoverViewer.draw(rover, command);

  drawGui();
}

function handleGamepads() {
  let gamepads = navigator.getGamepads();

  findGamepad(gamepads);

  if (gamepadIndex != -1) {

    gp = gamepads[gamepadIndex];

    if (spacemouse) {
      left_joystick.valX = gp.axes[0];
      left_joystick.valY = -gp.axes[2];
      right_joystick.valX = -gp.axes[4];
      right_joystick.valY = 0;

    } else {
      left_joystick.valX = gp.axes[0];
      left_joystick.valY = gp.axes[1];
      right_joystick.valX = gp.axes[2];
      right_joystick.valY = gp.axes[3];

      simpleGamepadModeToggle.val = !gp.buttons[7].pressed;
    }

  }
}

function fetchCommand() {
  let command = new RoverCommand();

  if (spacemouse) {
    command = RoverCommand.fromSpacemouse([left_joystick.valX, -left_joystick.valY], right_joystick.valX);
  } else {
    let vecLeftJoystick = [left_joystick.valX, -left_joystick.valY];
    let vecRightJoystick = [right_joystick.valX, -right_joystick.valY];

    if (simpleGamepadModeToggle.val) {
      command = RoverCommand.fromGamepadSimple(vecLeftJoystick, vecRightJoystick);
    } else {
      command = RoverCommand.fromGamepad(vecLeftJoystick, vecRightJoystick);
    }
  }

  return command;
}

function findGamepad(gamepads) {
  gamepadIndex = -1;
  spacemouse = false;

  for (let i = 0; i < 4; i++) {
    if (gamepads[i]) {
      if (gamepads[i].id == "3Dconnexion SpaceNavigator (Vendor: 046d Product: c626)") continue;

      gamepadIndex = i;

      if (gamepads[i].id == "Spacenav Joystick (Vendor: dead Product: beef)") spacemouse = true;
    }
  }
}