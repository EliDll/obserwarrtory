# Run it using python3 router.py --gs-ip localhost --serial-name {serial name of your uart connection}
import serial # pip3 install pyserial
import crcmod # pip3 install crcmod
import socket
import threading
import json
import logging
import logging.handlers
import traceback
import os
import time
import argparse

GS_IP_DEFAULT = "192.168.8.232" # GS - Ground Station
SERIAL_NAME_DEFAULT = '/dev/ttyUSB0' # Serial name of uart connection

parser = argparse.ArgumentParser()
parser.add_argument("-g", "--gs-ip", type=str, help="Ground Station's IP", default=GS_IP_DEFAULT)
parser.add_argument("-s", "--serial-name", type=str, help="Serial name of UART connection", default=SERIAL_NAME_DEFAULT)
args = parser.parse_args()
GS_IP = args.gs_ip
SERIAL_NAME = args.serial_name

ROUTER_IP = "0.0.0.0"
ROUTER_UDP_PORT = 5005
GS_UDP_PORT = 5006

# Do not expect messages bigger than that at this point.
BUFFER_SIZE_FOR_UDP_MESSAGES = 1024 
BUFFER_SIZE_FOR_UART_MESSAGES = 1024

START_BYTE = '<'.encode("ascii")
END_BYTE = '>'.encode("ascii")
UART_PL_SIZE_IDX = 1  # PL - payload
UART_PL_START_IDX = 2
CHECKSUM_START_IDX = -3
CHECKSUM_SIZE = 2
CMD_ID_SIZE = 1  # CMD - command
MSG_LENGTH_WO_PAYLOAD = 5  # MSG - message, wo - without. 1 end byte + 2 Bytes check sum + 1 byte length + 1 start byte = 5 bytes
get_crc16_checksum = crcmod.predefined.mkCrcFun('xmodem')  # Poly - 0x11021 (or 0x1021), not reversed, no xor (xor=0), Init value = 0
ROUTER_MESSAGE_ID = 255;

LOG_FILE = os.path.dirname(os.path.realpath(__file__)) + '/logfile.log'
MAX_LOG_FILE_SIZE = 2.5e6  ## There will be maximal two log files, so 5 mb

logger_handler = logging.handlers.RotatingFileHandler(LOG_FILE, maxBytes=MAX_LOG_FILE_SIZE, backupCount=1)
logger_handler.setFormatter(logging.Formatter('%(asctime)s %(message)s', datefmt='%Y-%m-%d %H:%M:%S'))
logger = logging.getLogger("Python Server Logger")
logger.addHandler(logger_handler)
logger.setLevel(logging.DEBUG)
logger.propagate = False

upd_receiver_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM) # AF_INET = Internet, OCK_DGRAM = UDP
upd_sender_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

udp_sender_semaphore = threading.Semaphore()
udp_sender_semaphore.release()


class InvalidMessageException(Exception, object):
    def __init__(self, error_message: str, invalid_message: bytes or bytearray):
        super().__init__(error_message)
        self.invalid_message = invalid_message


def main():
    try:
        logger.info("Router Python Server has started!")
        upd_receiver_socket.bind((ROUTER_IP, ROUTER_UDP_PORT))

        assert BUFFER_SIZE_FOR_UDP_MESSAGES < upd_receiver_socket.getsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF)

        udp2uart_thread = threading.Thread(target=udp2uart, args=(), name="Thread - UDP To UART")
        udp2uart_thread.start()
        
        uart2udp_thread = threading.Thread(target=uart2udp, args=(), name="Thread - UART To UDP")
        uart2udp_thread.start()

    except Exception as err:
        handle_error(err)
        logger.critical("This error was critical and should never happen: Exit the program.")
        raise err


def udp2uart():
    while True:
        try:
            payload, __ = upd_receiver_socket.recvfrom(BUFFER_SIZE_FOR_UDP_MESSAGES)
            message = create_serial_message(payload);

            if os.path.exists(SERIAL_NAME):
                with serial.Serial(SERIAL_NAME, 115200, timeout=None) as ser:
                    ser.write(message)
            else:
                handle_error(f"There is no serial connection with the path {SERIAL_NAME}.")
                wait_till_uart_connection_establishes()

        except Exception as err:
            handle_error(err)


def uart2udp():
    is_last_message_uncompleted = False
    uncompleted_message = None

    while True:
        if not os.path.exists(SERIAL_NAME):
            handle_error(f"There is no serial connection with the path {SERIAL_NAME}.")
            wait_till_uart_connection_establishes()
        
        try:
            with serial.Serial(SERIAL_NAME, 115200, timeout=None) as ser:
                message = ser.read_until(expected=END_BYTE, size=BUFFER_SIZE_FOR_UART_MESSAGES)
                payload, is_last_message_uncompleted, uncompleted_message = \
                    process_serial_message(message, is_last_message_uncompleted, uncompleted_message)
            if not is_last_message_uncompleted:
                send_message_to_gs(payload)
        except Exception as err:
            is_last_message_uncompleted, uncompleted_message = False, None
            handle_error(err)


def wait_till_uart_connection_establishes():
    while not os.path.exists(SERIAL_NAME):
        time.sleep(1)


def create_serial_message(payload: bytes):
    payload_checksum = get_crc16_checksum(payload).to_bytes(CHECKSUM_SIZE, byteorder="little")
    payload_length = len(payload).to_bytes(1, byteorder="little")
    return START_BYTE + payload_length + payload + payload_checksum + END_BYTE


def process_serial_message(message: bytes, is_last_message_uncompleted: bool, uncompleted_message: bytes = None):
    """
        Returns: (payload (!), is_last_message_uncompleted, uncompleted_message)
                    message - processed message.
                    is_last_message_uncompleted - Boolean, whether the message is uncompleted.
                    uncompleted_message - if is_last_message_uncompleted is True, message itself. Otherwise None.
    """
    if is_last_message_uncompleted:
        message = uncompleted_message + message

    if message[0] != START_BYTE[0]:
        message = remove_everything_before_start_byte(message)

    if is_message_uncompleted(message):
        return (None, True, message)

    if check_if_message_valid(message):
        return (get_uart_payload(message), False, None)


def remove_everything_before_start_byte(message: bytes):
    start_byte_index = message.find(START_BYTE)
    if (start_byte_index == -1):
        raise InvalidMessageException(f"There is no start byte {START_BYTE.decode('ascii')} in this message from rover.", message)
    else:
        error = InvalidMessageException(f"There is no start byte {START_BYTE.decode('ascii')} in this message from rover.",
                                        message[0:start_byte_index])
        handle_error(error)
        return message[start_byte_index:]


def is_message_uncompleted(message: bytes):
    return len(message) < (MSG_LENGTH_WO_PAYLOAD + CMD_ID_SIZE) or message[UART_PL_SIZE_IDX] > calculate_payload_size(message)


def check_if_message_valid(message: bytes): 
    # The first byte was already checked previously
    if message[UART_PL_SIZE_IDX] != 0 and message[UART_PL_SIZE_IDX] != calculate_payload_size(message):
        raise InvalidMessageException(
            f"Payload in the message from rover is bigger than the value in the \"payload size\" byte: "
            f"({calculate_payload_size(message)} > {message[UART_PL_SIZE_IDX]}).", message)

    checksum = get_crc16_checksum(get_uart_payload(message)).to_bytes(CHECKSUM_SIZE, "little")

    if message[CHECKSUM_START_IDX : (CHECKSUM_START_IDX + CHECKSUM_SIZE)] != checksum:
        raise InvalidMessageException(f"The checksum {int.from_bytes(checksum, 'little')} is wrong! The right is {int.from_bytes(message[CHECKSUM_START_IDX : (CHECKSUM_START_IDX + CHECKSUM_SIZE)], 'little')}.", message)
    if message[-1] != END_BYTE[0]:
        raise InvalidMessageException(f"The message from rover is bigger than {BUFFER_SIZE_FOR_UART_MESSAGES} or the end byte {END_BYTE.decode('ascii')} is missing.", message)
    return True


def get_uart_payload(message: bytes):
    return message[UART_PL_START_IDX : CHECKSUM_START_IDX]


def calculate_payload_size(message: bytes):
    return len(message) - MSG_LENGTH_WO_PAYLOAD  


def send_message_to_gs(message: bytes):
    udp_sender_semaphore.acquire(blocking=True)
    upd_sender_socket.sendto(message, (GS_IP, GS_UDP_PORT))
    udp_sender_semaphore.release()


def handle_error(err: Exception or str):
    try:
        logger.error(err)
        traceback.format_exc()

        if isinstance(err, InvalidMessageException):
            error_message = {"error": f"{err.__class__}: {str(err)}",
                             "invalidMessage": err.invalid_message.hex(" ")}
        elif isinstance(err, Exception):
            error_message = {"error": f"{err.__class__}: {str(err)}"}
        else:
            error_message = {"error": str(err)}

        error_message = json.dumps(error_message, ensure_ascii=False).encode("ascii", "backslashreplace")

        send_error_to_gs(error_message)
    except Exception as err:
        logger.critical("Error while handling another error.")
        logger.error(err)
        logger.error(traceback.format_exc())


def send_error_to_gs(error_message: bytes):
    error_message = ROUTER_MESSAGE_ID.to_bytes(CMD_ID_SIZE, byteorder="little") + error_message
    send_message_to_gs(error_message)


if __name__ == "__main__":
    main()
