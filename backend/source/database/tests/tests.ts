// npx node-dev tests.ts to start this file.
import {databaseHandler} from '../database-handler';

test();

async function test(): Promise<void> {
    await databaseHandler.addBeaconEntries([{subsystem: "PL", sensor: "THOR", value: 4, time: new Date()}]).then(result => console.log(result));
    await databaseHandler.loadLastBeaconEntries({sensor: "THOR"}).then((result) => console.log(result));
    await databaseHandler.deleteBeaconEntries({sensor: "THOR"}).then(result => console.log(result));
    await databaseHandler.closeConnection();
}


