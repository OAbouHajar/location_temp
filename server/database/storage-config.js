// Storage Configuration
// Choose between JSON, SQLite, or MongoDB storage

const fs = require('fs').promises;
const path = require('path');

class StorageConfig {
    constructor() {
        this.storageType = process.env.STORAGE_TYPE || 'json'; // 'json', 'sqlite', or 'mongodb'
        this.storage = null;
    }

    async initialize() {
        console.log(`\n📦 Initializing ${this.storageType.toUpperCase()} storage...`);

        switch (this.storageType.toLowerCase()) {
            case 'sqlite':
                const SQLiteStorage = require('./sqlite-storage');
                this.storage = new SQLiteStorage();
                console.log('✅ SQLite storage initialized');
                break;

            case 'mongodb':
                const MongoDBStorage = require('./mongodb-storage');
                this.storage = new MongoDBStorage();
                await this.storage.connect();
                console.log('✅ MongoDB storage initialized');
                break;

            case 'json':
            default:
                this.storage = new JSONStorage();
                await this.storage.initialize();
                console.log('✅ JSON file storage initialized');
                break;
        }

        return this.storage;
    }

    getStorage() {
        return this.storage;
    }
}

// JSON File Storage (default, simple implementation)
class JSONStorage {
    constructor() {
        this.DATA_DIR = path.join(__dirname, '../storage');
        this.SESSIONS_FILE = path.join(this.DATA_DIR, 'sessions.json');
        this.INTERACTIONS_FILE = path.join(this.DATA_DIR, 'interactions.json');
    }

    async initialize() {
        await fs.mkdir(this.DATA_DIR, { recursive: true });
        
        // Create sessions file if it doesn't exist
        try {
            await fs.access(this.SESSIONS_FILE);
        } catch {
            await fs.writeFile(this.SESSIONS_FILE, JSON.stringify([], null, 2));
        }

        // Create interactions file if it doesn't exist
        try {
            await fs.access(this.INTERACTIONS_FILE);
        } catch {
            await fs.writeFile(this.INTERACTIONS_FILE, JSON.stringify([], null, 2));
        }
    }

    async insertSession(data) {
        const sessionsData = await fs.readFile(this.SESSIONS_FILE, 'utf8');
        const sessions = JSON.parse(sessionsData);
        
        // Check if session exists
        const existingIndex = sessions.findIndex(s => s.sessionId === data.sessionId);
        if (existingIndex >= 0) {
            sessions[existingIndex] = { ...sessions[existingIndex], ...data };
        } else {
            sessions.push(data);
        }
        
        await fs.writeFile(this.SESSIONS_FILE, JSON.stringify(sessions, null, 2));
        return { success: true };
    }

    async insertGPSLocation(sessionId, gps) {
        if (!gps || gps.error) return null;
        
        // For JSON storage, GPS data is part of session
        const sessionsData = await fs.readFile(this.SESSIONS_FILE, 'utf8');
        const sessions = JSON.parse(sessionsData);
        
        const session = sessions.find(s => s.sessionId === sessionId);
        if (session) {
            session.gps = gps;
            await fs.writeFile(this.SESSIONS_FILE, JSON.stringify(sessions, null, 2));
        }
        
        return { success: true };
    }

    async insertInteraction(data) {
        const interactionsData = await fs.readFile(this.INTERACTIONS_FILE, 'utf8');
        const interactions = JSON.parse(interactionsData);
        
        interactions.push(data);
        
        // Keep only last 1000 interactions
        if (interactions.length > 1000) {
            interactions.splice(0, interactions.length - 1000);
        }
        
        await fs.writeFile(this.INTERACTIONS_FILE, JSON.stringify(interactions, null, 2));
        return { success: true };
    }

    async getAllSessions() {
        const sessionsData = await fs.readFile(this.SESSIONS_FILE, 'utf8');
        return JSON.parse(sessionsData);
    }

    async getAllGPSLocations() {
        const sessions = await this.getAllSessions();
        return sessions.filter(s => s.gps && !s.gps.error).map(s => ({
            sessionId: s.sessionId,
            ...s.gps,
            timestamp: s.timestamp
        }));
    }

    async getInteractionsBySession(sessionId) {
        const interactionsData = await fs.readFile(this.INTERACTIONS_FILE, 'utf8');
        const interactions = JSON.parse(interactionsData);
        return interactions.filter(i => i.sessionId === sessionId);
    }

    async getAllInteractions() {
        const interactionsData = await fs.readFile(this.INTERACTIONS_FILE, 'utf8');
        return JSON.parse(interactionsData);
    }

    async exportAllData() {
        const sessions = await this.getAllSessions();
        const interactions = await this.getAllInteractions();
        
        return {
            sessions,
            interactions,
            exportedAt: new Date().toISOString()
        };
    }

    async getStatistics() {
        const sessions = await this.getAllSessions();
        const interactions = await this.getAllInteractions();
        const sessionsWithGPS = sessions.filter(s => s.gps && !s.gps.error);

        return {
            total_sessions: sessions.length,
            total_gps_locations: sessionsWithGPS.length,
            total_interactions: interactions.length,
            sessions_with_gps: sessionsWithGPS.length,
            gps_permission_rate: sessions.length > 0 
                ? ((sessionsWithGPS.length / sessions.length) * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    async close() {
        // No connection to close for JSON storage
        return;
    }
}

module.exports = StorageConfig;
