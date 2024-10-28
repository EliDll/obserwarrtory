/**
 * Cpp types, e.g. FLOAT, INT_8 (1 byte integer), UINT_8 (one byte unsigned integer), Strings and so on.
 */
export class CppType {
    size: (val: string | number | undefined) => number;
    writeToBuffer: (buf: Buffer, val: any, pos: number) => void;

    constructor(size: (val: string | number | undefined) => number, 
                    writeToBuffer: (buf: Buffer, val: any, pos: number) => void) {
        this.size = size;
        this.writeToBuffer = writeToBuffer;
    }

    static FLOAT = new CppType(() => 4, (buf: Buffer, val: number, pos: number) => buf.writeFloatLE(val, pos));

    static INT_8 = new CppType(() => 1, (buf: Buffer, val: number, pos: number) => buf.writeInt8(val, pos));
    static INT_16 = new CppType(() => 2, (buf: Buffer, val: number, pos: number) => buf.writeInt16LE(val, pos));
    static INT_32 = new CppType(() => 4, (buf: Buffer, val: number, pos: number) => buf.writeInt32LE(val, pos));
 
    static UINT_8 = new CppType(() => 1, (buf: Buffer, val: number, pos: number) => buf.writeUInt8(val, pos));
    static UINT_16 = new CppType(() => 2, (buf: Buffer, val: number, pos: number) => buf.writeUInt16LE(val, pos));
    static UINT_32 = new CppType(() => 4, (buf: Buffer, val: number, pos: number) => buf.writeUInt32LE(val, pos));

    static STRING  = new CppType((val: any) => val.length, (buf: Buffer, val: string, pos: number) => buf.write(val, pos, 'ascii'));

    // static BUFFER = new CppType((val: any) => val.length, (buf: Buffer, val: Buffer, pos: number) => buf.fill(val, pos, pos + buf.length));
}

/**
 * Cpp value, which consist of cpp type and the value itself.
 */
class CppValue {
    type: CppType;
    value: number | string;

    constructor(type: CppType, value: number | string) {
        this.type = type;
        this.value = value;
    }

    size() { 
        return this.type.size(this.value);
    }

    writeToBuffer(buf: Buffer, pos: number) {
        this.type.writeToBuffer(buf, this.value, pos);
    }
}


/**
 * This class handles the messages that are supposed to be sent to the maincontroller (MC).
 */
export class MessageToMC {
    values: (CppValue)[] = [];

    constructor(commandID: number, types: CppType[] = [], values: (number | string)[] = []) {
        console.assert(types.length === values.length, 'Types and values lengths are different');

        this.add(CppType.UINT_8, commandID);
        types.forEach((type, i) => this.add(type, values[i]));    
    }

    /**
     * This function adds a new value.
     * 
     * @param cppType type of the value
     * @param value value itself
     */
    add(cppType: CppType, value: number | string) {
        this.values.push(new CppValue(cppType, value)); 
    }

    /**
     * This function converts the MessageToMC object to the buffer that can be sent directly to the maincontroller. 
     * The created buffer corresponds to the communication protocol, where the first byte is the command id, and the following bytes are payload message.
     * 
     * @returns the message to the rover as buffer
     */
    convertToBuffer(): Buffer {
        let payloadSize = this.values.map((cppValue) => cppValue.size()).reduce((a, b) => a + b);
        const buffer = Buffer.allocUnsafe(payloadSize);

        // Start at the beginning, with byte number 0
        let currentPosition = 0; 
        this.values.forEach((cppValue) => {
            cppValue.writeToBuffer(buffer, currentPosition);
            currentPosition += cppValue.size();
        });

        return buffer;
    }
}