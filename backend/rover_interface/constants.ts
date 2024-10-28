const LOG_REQUEST_MODE = new Map<string, number>();
LOG_REQUEST_MODE.set("range", 1);
LOG_REQUEST_MODE.set("last_n", 2);

const CONSTANTS  = {
    START_SYMBOL: '<',
    END_SYMBOL: '>',

    PL_COMMAND_ID_START_IDX: 0, // Start Index of command id (which is part of the payload)
    PL_COMMAND_ID_SIZE: 1,
    PL_MESSAGE_START_IDX: 1, // Start Index of payload message

    ROVER_CONFIG_ID: 0,
    MOTOR_POSITION_ID: 2,
    MOTOR_VELOCITY_ID: 4,
    ROVER_MOVEMENT_ID: 6,
    BEACON_ID: 9,
    LOG_REQUEST_ID: 10,
    LOG_RESPONSE_ID: 11,
    EPS_CONFIG_ID: 12,
    PL_CONFIG_ID: 14,
    SINTER_ID: 16,
    GET_DOSIS_MSG: 250,
    POST_DOSIS_MSG: 252,
    DOSIS_MSG_FROM_ROVER: 253,
    LED_MESSAGE: 254,
    ERROR_ID: 255,

    LOG_REQUEST_MODE,

    DOSIS_TYPE: {
        GETTER: 0,
        SETTER: 128,
        DOER: 128
    }
}

export default CONSTANTS;

