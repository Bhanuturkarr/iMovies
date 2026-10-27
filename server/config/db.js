const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const config = require('./config');

let mongod = null;

const connectDB = async () => {
  try {
    let uri = config.mongoUri;

    if (!uri) {
      console.log('⚡ No MONGODB_URI provided in environment. Initializing local embedded MongoDB engine...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      
      const dbPath = path.resolve(__dirname, '../data/db');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      // Check if mongod is already running or start one with persistent dbPath
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'imovies_db',
          dbPath: process.env.NODE_ENV === 'test' ? undefined : dbPath,
          storageEngine: 'wiredTiger'
        }
      });
      uri = mongod.getUri();
      console.log(`✅ Embedded MongoDB engine started at: ${uri}`);
    }

    const conn = await mongoose.connect(uri, {
      dbName: 'imovies_db',
      autoIndex: true
    });

    console.log(`🚀 MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    if (!mongod && config.mongoUri) {
      console.log('🔄 Attempting fallback to embedded MongoDB engine...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongod = await MongoMemoryServer.create({
          instance: {
            dbName: 'imovies_db'
          }
        });
        const fallbackUri = mongod.getUri();
        const conn = await mongoose.connect(fallbackUri, {
          dbName: 'imovies_db'
        });
        console.log(`✅ Embedded MongoDB fallback connected: ${conn.connection.host}`);
        return conn;
      } catch (fallbackError) {
        console.error(`❌ Fallback MongoDB connection also failed: ${fallbackError.message}`);
        throw fallbackError;
      }
    }
    throw error;
  }
};

const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
      console.log('🛑 Embedded MongoDB stopped cleanly.');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};

module.exports = { connectDB, closeDB };
