// Run npx node-dev tests.ts to start the tests.
import {CppType, MessageToMC} from '../message_to_mc'

testMessageToMC();

function testMessageToMC() {
    let success = true;
    // 26.11 is Ruslan's birthday! Values are in hex and little endian!
    const messageToMC1 = new MessageToMC(26); // 1a 
    messageToMC1.add(CppType.FLOAT, 26); // 41 d0 00 00 -> 00 00 d0 41 in little endian
    messageToMC1.add(CppType.STRING, "ab"); // 61 62
    messageToMC1.add(CppType.INT_8, -26); // e6
    messageToMC1.add(CppType.INT_16, -11 * 256 - 26); // e6 f4 (-2842)
    messageToMC1.add(CppType.INT_32, -11 * 256**3 - 26); // e6 ff ff f4 (-184549402)
    messageToMC1.add(CppType.UINT_8, 26); // 1a
    messageToMC1.add(CppType.UINT_16, 11 * 256 + 26); // 1a 0b
    messageToMC1.add(CppType.UINT_32, 11 * 256**3 + 26); // 1a 00 00 0b

    const expectedHex = Buffer.from("1a 00 00 d0 41 61 62 e6 e6 f4 e6 ff ff f4 1a 1a 0b 1a 00 00 0b".replace(/\s/g, ''), "hex")
    if (expectedHex.compare(messageToMC1.convertToBuffer()) !== 0) {
        console.log("Test failed!");
        success = false;
    }

    const messageToMC2 = new MessageToMC(26, 
        [CppType.FLOAT, CppType.STRING, CppType.INT_8, CppType.INT_16, CppType.INT_32, CppType.UINT_8, CppType.UINT_16, CppType.UINT_32],
        [26, "ab", -26, -11 * 256 -26, -11 * 256**3 -26, 26, 11 * 256 + 26, 11 * 256**3 + 26]);

    if (expectedHex.compare(messageToMC2.convertToBuffer()) !== 0) {
        console.log("Test failed!");
        success = false;
    }

    if (success) {
        console.log("Test was successful!");
    }
}