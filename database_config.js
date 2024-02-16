import 'dotenv/config'
import mysql from 'mysql2/promise';
let dbConnections = {};

export async function getDatabaseConnection(databaseName) {
    if (!dbConnections[databaseName]) {
        try {
            dbConnections[databaseName] = await createDatabaseConnection(databaseName);
        } catch (error) {
            console.error(`Error connecting to MySQL database '${databaseName}':`, error);
            throw error;
        }
    }
    return dbConnections[databaseName];
}

async function createDatabaseConnection(databaseName) {
    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: databaseName
        });
        // console.log(`Connected to MySQL database '${databaseName}'.`);
        return connection;
    } catch (error) {
        // console.error(`Error connecting to MySQL database '${databaseName}':`, error);
        // Retry connection after a delay
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds delay
        return createDatabaseConnection(databaseName);
    }
}

export const DB_NAMES ={
    REGISTER_SYSTEM : "registersystem",
    AMX : "amx",
    ZM_SWARM : "zm_swarm",
}
