/*
 *   Database handler. It provides function to save, update, load and delete from database.
 */
import db, { MongoError, Collection, MongoClient } from 'mongodb';

const DB_NAME = `Ground-Station`;
const BEACON_COLLECTION = `Beacon`;
const DB_URL = process.env.GS_DATABASE_URL || `mongodb://localhost:27017`;
const MAX_INITIALIZATION_TIME = 1000; // in ms

export type BeaconEntryDB = { _id?: db.ObjectID, subsystem?: string, sensor?: string, value?: any, time?: Date};
export type CommandResult = { ok?: number | undefined, n?: number | undefined};


class DatabaseHandler {
    beaconCollection: Collection | undefined;
    client: MongoClient = new MongoClient(DB_URL, { useUnifiedTopology: true });
    // We start with the assumption that database is available.
    isDatabaseAvailable: boolean = true; 

    /**
     * Establishes connection with database and collections (tables). If the collections do not exist, creates collections.
     * 
     * @returns the reference to the object itself
     */
    init(): DatabaseHandler {
        this.client.connect((error: MongoError) => {
            if (error) {
                console.error(`Panic! Error while connecting to the database at ${DB_URL}. I blame OPS!`);
                console.error(error);
                this.isDatabaseAvailable = false;
                return;
            }
            const db = this.client.db(DB_NAME);
            db.collection(BEACON_COLLECTION, {strict: true}, (error: MongoError, beaconCollection: Collection) => {
                if (error) {
                    console.error(`There is no beacon collection! It will be created now!`);
                    this.createBeaconCollection(db);
                } 
                else {
                    this.beaconCollection = beaconCollection;
                }
            });
            console.log(`Database is connected.`);
        });
        return this;
    }

    /**
     * Creates beacon collection. Do only if beacon collection does not exits.
     * 
     * @param db reference to the database
     */
    createBeaconCollection(db: db.Db) {
        db.createCollection(BEACON_COLLECTION).then((beaconCollection: Collection) => {
            console.log(`Beacon collection was created!`);
            this.beaconCollection = beaconCollection;
        }, (error: any) => {
            console.error(`Beacon collection could not be created because ${error}`);
            throw error;
        });
    }

    /**
     * Add beacon entries to beacon collection.
     * 
     * Attention: you have to catch the error, like addBeaconEntries.then(some function).catch((error) => {console.error(error)})!
     * If you want to ignore the error, since it is already logged, use empty catch: .catch(() => {}).
     * If there an error, but you do not catch it, you will get unhandled rejection error! See rover_interface, receiveBeaconMessage() for an example.
     * 
     * @param entries beacon entries
     * @returns results
     */
    async addBeaconEntries(entries: BeaconEntryDB[]): Promise<object> {
        await this.waitTillBeaconCollectionIsInitialized();
        let commandResult;
        try {
            commandResult = await this.beaconCollection!.insertMany(entries);
        } catch(error) {
            console.error(`Could not add user ${entries} because of ${error}`);
            throw error;
        }
        return commandResult.result;
    }

    /**
     * Load last beacon entries according to the query that specify fields values that are used for filtering.
     * For example, if you want to get all entries for subsystem PL, query hast to be { subsystem: "PL"}.
     * If you want to load every entry, query has to be {}.
     * 
     * Attention: you have to catch the error, like addLoadLastBeaconEntries.then(some function).catch(error) => {console.error(error)}!
     * If you want to ignore the error, since it is already logged, use empty catch: .catch(() => {}).
     * If there an error, but you do not catch it, you will get unhandled rejection error! See rover_interface, receiveBeaconMessage() for an example.
     * 
     * @param query object with values for filtering
     * @param limit maximum number of returned beacon entries
     * @param callback
     * @returns beacon entries
     */
    async loadLastBeaconEntries(query: BeaconEntryDB = {}, limit: number = 1000): Promise<BeaconEntryDB[]> {
        await this.waitTillBeaconCollectionIsInitialized();
        let entries;
        try {
            entries = await this.beaconCollection!.find(query).sort({$natural:-1}).limit(limit).toArray();
        } catch(error) {
            console.error(`Could not load values because ${error}`);
            throw error;
        }
        return entries;
    }


    /**
     * Delete beacon entries according to the query that specify fields values that are used for filtering.
     * For example, if you want to get all entries for subsystem PL, query hast to be { subsystem: "PL"}.
     * 
     * Attention: you have to catch the error, like deleteBeaconEntries.then(some function).catch((error) => {console.error(error)})!
     *      * If you want to ignore the error, since it is already logged, use empty catch: .catch(() => {}).
     * If there an error, but you do not catch it, you will get unhandled rejection error! See rover_interface, receiveBeaconMessage() for an example.
     * 
     * @param query object with values for filtering
     * @param limit maximum number of returned beacon entries
     * @returns beacon entries
     */
    async deleteBeaconEntries(query: BeaconEntryDB): Promise<CommandResult>  {
        await this.waitTillBeaconCollectionIsInitialized();
        let commandResult;
        try {
            commandResult = await this.beaconCollection!.deleteMany(query);
        } catch(error) {
            console.error(`Could not add user ${query} because of ${error}`);
            throw error;
        }
        return commandResult.result;
    }

    /**
     * Closes connection with the database.
     */
    async closeConnection(): Promise<void> {
        await this.client.close(true);
    }

    /**
     * Checks whether the beacon collection (table) is initialized, 
     * if not, it waits for MAX_INITIALIZATION_TIME time, if it is still not initialized, it throws the error.
     */
    async waitTillBeaconCollectionIsInitialized(): Promise<void> {
        if (!this.isDatabaseAvailable) {
            throw Error("Database is not available. See previous errors!");
        }
        if (!this.beaconCollection) {
            await new Promise(resolve => setTimeout(resolve, MAX_INITIALIZATION_TIME))
            if (!this.beaconCollection) {
                this.isDatabaseAvailable = false;
                throw Error(`It seems that the database is not available, since the beacon collection could not be initialized in ${MAX_INITIALIZATION_TIME} ms!`);
            }
        }
    }
}

export const databaseHandler = new DatabaseHandler().init();

