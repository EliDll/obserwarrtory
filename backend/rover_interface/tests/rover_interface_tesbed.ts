// This file contains functions that call rover interfaces function with dummy values. 
// Run npm install, export ROVER_ROUTER_IP={Router IP, for example "localhost"}, 
// and npx node-dev rover_interface_testbed.ts to start this file.
import RoverInterface from "../rover_interface"

// Instantiate rover interface and give it undefined frontend socket so you can run it without frontend.
const frontendSocket = undefined;
const roverInterface = new RoverInterface();
roverInterface.init(frontendSocket);

function sendDummySinterMessages(period: number = 2000) {
    let message = {payload: "G code\n"}
    setInterval(() => {
        roverInterface.sendSinter(message);
    }, period)
}

function blinkyTest(period: number = 2000) {
    let on = true;
    setInterval(() => {
        on = !on;
        roverInterface.sendLEDMessage(on)
    }, period);
}

function receiveBeaconTest(payload: string = "PL/THOR/968.5/PL/MATHILDA/54.6") {
    roverInterface.receiveBeaconMessage(Buffer.from(payload, "ascii"));
}


