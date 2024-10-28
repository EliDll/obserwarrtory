import constants from './constants'
import {CppType, MessageToMC} from './message_to_mc'
import * as Instructions from '../../obserwarrtory/src/app/Specfiles/Instructions'
import * as Enums from '../../obserwarrtory/src/app/Specfiles/Enums'
import * as Sensors from '../../obserwarrtory/src/app/Specfiles/Sensors'
import { databaseHandler, BeaconEntryDB } from '../source/database/database-handler';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

// Our location.
const OUR_UDP_IP = "0.0.0.0"
const OUR_UDP_PORT = 5006

// Router location (messages to the maincontroller should be sent to the router).
const ROUTER_UDP_IP = process.env.ROVER_ROUTER_IP || "192.168.8.1" 
const ROUTER_UDP_PORT = 5005

/**
 * This class is used to send messages to the rover.
 */
class RoverInterface {

  frontendSocket: any;

  // ID of async timeout function
  beaconTimeoutID: NodeJS.Timeout | undefined;

  init(socket: any) {
    this.frontendSocket = socket;

   server.on('message', (message: Buffer) => {
    this.processIncomingMessage(message);
   })

    server.on('listening', () => {
      const address = server.address();
      console.log(`Server listening @ ${address.address}:${address.port}`);
    });

    server.on('error', (err: any) => {
      console.error('Error: ', err)
    });

    server.bind(OUR_UDP_PORT, OUR_UDP_IP);
  }

  /**
   * Sends processed message to frontend.
   * 
   * Options for outgoing event have to be coordinated with OPS.
   * Currently frontend only expects 'rover_beacon' (stand 04.06.21).
   * 
   * @param outgoingEventName event name that corresponds to the type of the message (e.g. beacon, log, etc.)
   * @param message message that has to be sent to the frontend
   */
   sendToFrontend(outgoingEventName: string, message: Object){
    this.frontendSocket.emit(outgoingEventName, message);
  }

  /**
   * This functions sends messages to the maincontroller (MC) of the rover.
   * 
   * @param message message to the maincontroller
   */
  sendToMC(message: MessageToMC) {
    server.send(message.convertToBuffer(), ROUTER_UDP_PORT, ROUTER_UDP_IP, (err: any) => { 
      if (err) {
        console.error('Error: ', err);
      }
    });
  }

  processIncomingMessage(payload: Buffer) {
    if (payload.length < constants.PL_MESSAGE_START_IDX) {
      console.error("The incoming message has no payload id.");
      return;
    }

    const commandID = payload.readUInt8(constants.PL_COMMAND_ID_START_IDX);
    const payloadMessage = payload.length >= constants.PL_MESSAGE_START_IDX ? payload.subarray(constants.PL_MESSAGE_START_IDX) : Buffer.alloc(0);

    switch (commandID) {
      case constants.BEACON_ID:
        this.receiveBeaconMessage(payloadMessage);
        break;
      case constants.LOG_RESPONSE_ID:
        this.receiveRequestLog(payloadMessage);
        break;
      case constants.ERROR_ID:
        this.processErrorMessage(payloadMessage);  
        break;
      case constants.DOSIS_MSG_FROM_ROVER:
        this.processDosisMessage(payloadMessage);
        break;
      case constants.SINTER_ID:
        this.processSinteringMessage(payloadMessage);
        break;
      default:
        console.error("There is no command with ID " + commandID);
        this.printErroneousMessage(payload);
    }
  }
  
  sendMotorPosition(message: Instructions.MotorPosition) {
    const motorID: Enums.MotorEnum = message.motor_id;
    const modeID: Enums.MPMode = message.mode;

    const max_vel = (message.max_vel !== undefined) ? message.max_vel : NaN;
    const timeout = (message.timeout !== undefined) ? message.timeout : 0;
    const time = (message.time !== undefined) ? message.time : 0;

    const messageToMC = new MessageToMC(constants.MOTOR_POSITION_ID);
    messageToMC.add(CppType.UINT_8, motorID!);
    messageToMC.add(CppType.UINT_8, modeID!);
    messageToMC.add(CppType.FLOAT, message.value);
    messageToMC.add(CppType.FLOAT, max_vel);
    messageToMC.add(CppType.FLOAT, timeout);
    messageToMC.add(CppType.FLOAT, time);

    this.sendToMC(messageToMC);
  }

  sendMotorVelocity(message: Instructions.MotorVelocity) {
    const messageToMC = new MessageToMC(constants.MOTOR_VELOCITY_ID);

    const value = (message.value !== undefined) ? message.value : NaN;
    const timeout = (message.timeout !== undefined) ? message.timeout : 0;
    const time = (message.time !== undefined) ? message.time : 0;

    messageToMC.add(CppType.UINT_8, message.motor_id!);
    messageToMC.add(CppType.FLOAT, value); 
    messageToMC.add(CppType.FLOAT, timeout);
    messageToMC.add(CppType.FLOAT, time);

    this.sendToMC(messageToMC);
  }

  sendRoverMovement(message: Instructions.RoverMovement) {
    const messageToMC = new MessageToMC(constants.ROVER_MOVEMENT_ID);

    const timeout = (message.timeout !== undefined) ? message.timeout : 0;
    const time = (message.time !== undefined) ? message.time : 0;

    messageToMC.add(CppType.FLOAT, message.linear_value[0]);
    messageToMC.add(CppType.FLOAT, message.linear_value[1]);
    messageToMC.add(CppType.FLOAT, message.angular_value);
    messageToMC.add(CppType.FLOAT, timeout);
    messageToMC.add(CppType.FLOAT, time);

    this.sendToMC(messageToMC);
  }

  //Currently not supported in frontend
  sendLogRequest(message: any) {
    const mode = constants.LOG_REQUEST_MODE.get(message.mode);
    if (mode === undefined) {
      console.error("And here fuck you again, OPS! I am not going to do any error handling here!");
      return;
    }

    const messageToMC = new MessageToMC(constants.LOG_REQUEST_ID, 
        [CppType.UINT_8, CppType.UINT_32], [mode!, message.n_timestamps]);

    this.sendToMC(messageToMC);
  }

  sendSinter(message: Instructions.Sinter) {
    const payload: string = message.payload;

    const messageToMC = new MessageToMC(constants.SINTER_ID, [CppType.STRING], [message.payload]);

    this.sendToMC(messageToMC);
  }

  sendRoverConfig(message: Instructions.SystemPower) {
    const messageToMC = new MessageToMC(constants.ROVER_CONFIG_ID, [CppType.UINT_8], [message.action!]);

    this.sendToMC(messageToMC);
  }

  sendEPSConfig(message: Instructions.ToggleRail) {

    const values = [message.id, message.action];

    const messageToMC = new MessageToMC(constants.EPS_CONFIG_ID, 
            [CppType.UINT_8, CppType.UINT_8], values);

    this.sendToMC(messageToMC);
  }

  sendPLConfig(message: Instructions.SolarTracking) {
    
    const messageToMC = new MessageToMC(constants.PL_CONFIG_ID, [CppType.UINT_8], [message.mode]);

    this.sendToMC(messageToMC);
  }

  // Only for tests.
  sendLEDMessage(on: boolean) {
    const messageToMC = new MessageToMC(constants.LED_MESSAGE, [CppType.UINT_32], [on ? 1 : 0]);

    this.sendToMC(messageToMC);
  }

    // Only for tests.
  sendRouterMessage(message: string) {
    const messageToMC = new MessageToMC(constants.ERROR_ID, [CppType.STRING], [message]);
      
    this.sendToMC(messageToMC);
  }

  sendDosisGetMsg(ids: Array<number>) {
    const types = new Array<CppType>(ids.length).fill(CppType.UINT_32);

    const messageToMC = new MessageToMC(constants.ERROR_ID, types, ids);

    this.sendToMC(messageToMC);
  }

  calculateDosisHeader(dosisType: number, moduleNumber: number) {
    return dosisType + moduleNumber;
  }

  sendDosisPostMsg(topicID: number, dosisType: Enums.DSType, moduleNumber: number, 
                      values: (number | string)[], valuesTypes: CppType[], 
                      answerTopicID: number | undefined = undefined) {
    let dosisTypeAsNumber = 0;
    switch (dosisType) {
      case Enums.DSType.GETTER:
        dosisTypeAsNumber = constants.DOSIS_TYPE.GETTER;
        break;
      case Enums.DSType.SETTER:
        dosisTypeAsNumber = constants.DOSIS_TYPE.SETTER;
        break;
      case Enums.DSType.DOER:
        dosisTypeAsNumber = constants.DOSIS_TYPE.DOER;
        break;
      default:
        console.error("There is no such dosis type as " + dosisType + "!");
        return;
    }

    const header = this.calculateDosisHeader(dosisTypeAsNumber, moduleNumber);

    const messageToMC = new MessageToMC(constants.POST_DOSIS_MSG);

    answerTopicID = (answerTopicID === undefined) ? 0 : answerTopicID;

    messageToMC.add(CppType.UINT_32, topicID);
    messageToMC.add(CppType.UINT_32, answerTopicID);
    messageToMC.add(CppType.UINT_8, header);
    valuesTypes.forEach((type, i) => messageToMC.add(type, values[i]));

    this.sendToMC(messageToMC);
  }
  
  receiveBeaconMessage(payloadMessage: Buffer) {
      // give rover 5000ms for next timeout
      this.resetBeaconTimeout(5000);

    const message = payloadMessage.toString('ascii');
    const messageArray = message.split("/");
  
    if (messageArray.length % 3 !== 0) {
      console.error("Expected number of tokens dividable by 3. Get " + messageArray.length + " tokens");
      console.error("The payload message is " + message);
      return
    }

    let messageObject: Instructions.Beacon = {
      //unix timestamp
      timestamp: Math.floor(Date.now() / 1000),
      data: []
    }
    const databaseEntries: BeaconEntryDB[] = []

    for (let i = 0; i < messageArray.length; i = i + 3) {
      const valueAsNumber = Number(messageArray[i + 2]);
      const value = Number.isNaN(valueAsNumber) ? -1 : valueAsNumber;
      
      messageObject.data.push({
        id: Sensors.sensorMap.get(messageArray[i + 1]) ?? -1,
        value:  value
      });
      databaseEntries.push({
        subsystem: messageArray[i],
        sensor: messageArray[i + 1],
        value: messageArray[i + 2],
        time: new Date()
      })
    }

    // If there is an error, it is already logged, so just ignore it!
    databaseHandler.addBeaconEntries(databaseEntries).catch(() => {}); 
    this.sendToFrontend('rover_beacon', messageObject);
  }

  receiveRequestLog(payloadMessage: Buffer) {
    const message = payloadMessage.toString('ascii');
    console.error("Request Log is not implemented! Your message: ", message);
  }

  processErrorMessage(payloadMessage: Buffer) {
    let message = payloadMessage.toString('utf-8');
    console.error(message);
  }

  processDosisMessage(payloadMessage: Buffer) {
    const topicID = payloadMessage.readUInt32LE(0);
    const dosisHeader = payloadMessage.readUInt8(4);

    const message = new Uint8Array(payloadMessage.subarray(5, payloadMessage.length - 1));
    console.log("Dosis Message with topic ID " + topicID + " and dosis header " + dosisHeader + " from Rover.");
    console.log("Status accroding to header : " + ((dosisHeader >= 128) ? "Error" : "OK"));
  }

  processSinteringMessage(payloadMessage: Buffer) {
    const message = payloadMessage.toString('ascii');
    console.log("Message from sinter: " + message);
  }

  printErroneousMessage(message: Buffer) {
    console.error("The message as hex:", message);
    console.error("As string: ", message.toString("ascii"));
  }

  /**
   * Resets internal timeout that declares the Rover as absent, notifies the Frontend about this
   *
   * @param timeout Number of ms after which Rover is assumed disconnected
   */
  resetBeaconTimeout(timeout: number) {
    if(this.beaconTimeoutID) {
      clearTimeout(this.beaconTimeoutID);
    }
    // Frontend does not query payload of socket event "rover_timeout", send generic object
    this.beaconTimeoutID = setTimeout(() => this.sendToFrontend("rover_is_disconnected", Object()), timeout);
  }
}

export default RoverInterface;
