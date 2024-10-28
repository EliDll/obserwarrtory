import http from 'http';
import bodyParser from 'body-parser';
import express from 'express';
import logging from './config/logging';
import config from './config/config';
import sampleRoutes from './routes/sample';
import * as Instructions from '../../obserwarrtory/src/app/Specfiles/Instructions';
import * as Enums from '../../obserwarrtory/src/app/Specfiles/Enums';
import * as path from 'path';
import RoverInterface from '../rover_interface/rover_interface';
import {CppType} from "../rover_interface/message_to_mc";

const NAMESPACE = 'Server';
const router = express();

/** Log the request */
router.use((req, res, next) => {
    logging.info(`METHOD: [${req.method}] - URL: [${req.url}] - STATUS: [${res.statusCode}] - IP: [${req.socket.remoteAddress}]`, NAMESPACE);

    next();
});

/** Parse the body of the request */
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

/** Rules of our API */
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method == 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }

    next();
});

/** Routes go here */
router.use('/api/sample', sampleRoutes);

/** Error handling */
router.use((req, res, next) => {
    const error = new Error('Not found');

    res.status(404).json({
        message: error.message
    });
});

const httpServer = http.createServer(router);

httpServer.listen(config.server.port, () => logging.info(NAMESPACE, `Server is running ${config.server.hostname}:${config.server.port}`));


// below here is Websocket stuff

const SERVER_PORT = 3000;

const app = express();
app.set('port', process.env.PORT || SERVER_PORT);

let http2 = require('http').Server(app);

// set up socket.io and bind it to our http server.
let serverSocket = require('socket.io')(http2, {
    cors: {
        origin: ['http://localhost:4200', 'http://obserwarrtory:4200', 'http://obserwarrtory.exploration.warr.de:4200'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const roverInterface = new RoverInterface();
//pass reference of socket to RoverInterface so it can broadcast messages to Frontend(s)
roverInterface.init(serverSocket);

app.get('/', (req: any, res: any) => {
    res.sendFile(path.resolve('./hello_world.html'));
});

let USER_DICT: { [k: string]: string } = {};
let USER_LIST = dictToValueArray(USER_DICT);

interface msg_auth {
    alias: string
}

/** CONNECTION TO FRONTEND */
// whenever a user connects on port 3000 via
// a websocket, log that a user has connected
serverSocket.on('connection', (socket: any) => {

    console.log('Incoming Socket Connection');

    socket.on('request_access', function (message: msg_auth) {
        if (USER_LIST.includes(message.alias)) {
            socket.emit('access_denied', 'Alias is already registered');
            socket.disconnect();
        } else {
            socket.emit('access_granted');
            USER_DICT[socket.id] = message.alias;
            console.log(USER_DICT);
            USER_LIST = dictToValueArray(USER_DICT);
            serverSocket.emit('client_list', USER_LIST);
            
            // Initialize Beacon Watchdog, now that a Frontend client is connected
            roverInterface.resetBeaconTimeout(5000);
        }
    });

    socket.on(('disconnect'), function () {
        console.log('User disconnected');
        delete USER_DICT[socket.id];
        console.log(USER_DICT);
        USER_LIST = dictToValueArray(USER_DICT);
        serverSocket.emit('client_list', USER_LIST);
    });

    /** FRONTEND INSTRUCTION HANDLERS*/
    socket.on(('solar_tracking_mode'), (cmd: Instructions.SolarTracking) => {
        roverInterface.sendPLConfig(cmd);
        console.log(cmd);
    });

    socket.on(('toggle_rail'), (cmd: Instructions.ToggleRail) => {
        roverInterface.sendEPSConfig(cmd);
        console.log(cmd);
    });

    socket.on(('system_power'), (cmd: Instructions.SystemPower) => {
        roverInterface.sendRoverConfig(cmd);
        console.log(cmd);
    });

    socket.on(("motor_position"), (cmd: Instructions.MotorPosition) => {
        roverInterface.sendMotorPosition(cmd);
        console.log(cmd);
    });

    socket.on(("motor_velocity"), (cmd: Instructions.MotorVelocity) => {
        roverInterface.sendMotorVelocity(cmd);
        console.log(cmd);
    });

    socket.on(("rover_movement"), (cmd: Instructions.RoverMovement) => {
        roverInterface.sendRoverMovement(cmd);
        console.log(cmd);
    });

    socket.on(("sinter"), (cmd: Instructions.Sinter) => {
        roverInterface.sendSinter(cmd);
        console.log(cmd);
    });

    socket.on(("custom_dosis"), (cmd: Instructions.CustomDosis) => {

        let valuesTypeObjects: CppType[] = [];
        //map enums that are known in frontend to the actual CppType Objects
        for (const val of cmd.values_types) {
            switch (val) {
                case Enums.CppTypeEnum.FLOAT:
                    valuesTypeObjects.push(CppType.FLOAT)
                    break;
                case Enums.CppTypeEnum.INT_8:
                    valuesTypeObjects.push(CppType.INT_8)
                    break;
                case Enums.CppTypeEnum.INT_16:
                    valuesTypeObjects.push(CppType.INT_16)
                    break;
                case Enums.CppTypeEnum.INT_32:
                    valuesTypeObjects.push(CppType.INT_32)
                    break;
                case Enums.CppTypeEnum.UINT_8:
                    valuesTypeObjects.push(CppType.UINT_8)
                    break;
                case Enums.CppTypeEnum.UINT_16:
                    valuesTypeObjects.push(CppType.UINT_16)
                    break;
                case Enums.CppTypeEnum.UINT_32:
                    valuesTypeObjects.push(CppType.UINT_32)
                    break;
                case Enums.CppTypeEnum.STRING:
                    valuesTypeObjects.push(CppType.STRING)
                    break;
            }
        }

        roverInterface.sendDosisPostMsg(cmd.cmd_id, cmd.type, cmd.module, cmd.values, valuesTypeObjects,
            cmd.should_answer ? cmd.cmd_id + 1 : undefined);
        console.log(cmd);
    });

});

const server = http2.listen(SERVER_PORT, "0.0.0.0", function () {
    console.log('listening for clients on *:' + SERVER_PORT);
});

function dictToValueArray(dict: any) {
    let arr: any[] = [];
    Object.keys(dict).map(function (key) {
        arr.push(dict[key]);
    });
    return arr;
}
