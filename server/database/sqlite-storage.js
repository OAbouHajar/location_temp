const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SQLiteStorage {
    constructor(dbPath = path.join(__dirname, '../storage/location_data.db')) {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening SQLite database:', err);
            } else {
                console.log('✅ SQLite database connected');
                this.initTables();
            }
        });
    }

    initTables() {
        // Sessions table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE NOT NULL,
                client_ip TEXT,
                user_agent TEXT,
                platform TEXT,
                language TEXT,
                screen_width INTEGER,
                screen_height INTEGER,
                timezone TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // GPS locations table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS gps_locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                accuracy REAL,
                altitude REAL,
                altitude_accuracy REAL,
                heading REAL,
                speed REAL,
                timestamp TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);

        // IP Geolocation table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS ip_geolocations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                ip_address TEXT,
                country TEXT,
                country_code TEXT,
                region TEXT,
                region_name TEXT,
                city TEXT,
                zip TEXT,
                lat REAL,
                lon REAL,
                timezone TEXT,
                isp TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);

        // Interactions table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                interaction_type TEXT NOT NULL,
                data TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);

        // Device fingerprints table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS device_fingerprints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                canvas_fingerprint TEXT,
                webgl_fingerprint TEXT,
                audio_fingerprint TEXT,
                fonts_fingerprint TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id)
            )
        `);

        console.log('✅ SQLite tables initialized');
    }

    // Insert session data
    insertSession(data) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT OR REPLACE INTO sessions 
                (session_id, client_ip, user_agent, platform, language, screen_width, screen_height, timezone, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;
            
            this.db.run(sql, [
                data.sessionId,
                data.clientIP,
                data.device?.userAgent,
                data.device?.platform,
                data.device?.language,
                data.screen?.screenWidth,
                data.screen?.screenHeight,
                data.timezone?.timezone
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Insert GPS location
    insertGPSLocation(sessionId, gps) {
        return new Promise((resolve, reject) => {
            if (!gps || gps.error) {
                resolve(null);
                return;
            }

            const sql = `
                INSERT INTO gps_locations 
                (session_id, latitude, longitude, accuracy, altitude, altitude_accuracy, heading, speed, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [
                sessionId,
                gps.latitude,
                gps.longitude,
                gps.accuracy,
                gps.altitude,
                gps.altitudeAccuracy,
                gps.heading,
                gps.speed,
                new Date(gps.timestamp).toISOString()
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Insert IP geolocation
    insertIPGeolocation(sessionId, ipGeo) {
        return new Promise((resolve, reject) => {
            if (!ipGeo || ipGeo.status === 'fail') {
                resolve(null);
                return;
            }

            const sql = `
                INSERT INTO ip_geolocations 
                (session_id, ip_address, country, country_code, region, region_name, city, zip, lat, lon, timezone, isp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [
                sessionId,
                ipGeo.query,
                ipGeo.country,
                ipGeo.countryCode,
                ipGeo.region,
                ipGeo.regionName,
                ipGeo.city,
                ipGeo.zip,
                ipGeo.lat,
                ipGeo.lon,
                ipGeo.timezone,
                ipGeo.isp
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Insert interaction
    insertInteraction(data) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO interactions (session_id, interaction_type, data)
                VALUES (?, ?, ?)
            `;
            
            this.db.run(sql, [
                data.sessionId,
                data.type,
                JSON.stringify(data.data)
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Get all sessions
    getAllSessions() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM sessions ORDER BY created_at DESC', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Get session with GPS data
    getSessionWithGPS(sessionId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT s.*, g.latitude, g.longitude, g.accuracy, g.timestamp as gps_timestamp
                FROM sessions s
                LEFT JOIN gps_locations g ON s.session_id = g.session_id
                WHERE s.session_id = ?
            `;
            
            this.db.get(sql, [sessionId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Get all GPS locations
    getAllGPSLocations() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM gps_locations ORDER BY created_at DESC', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Get interactions by session
    getInteractionsBySession(sessionId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM interactions WHERE session_id = ? ORDER BY timestamp DESC',
                [sessionId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    // Export data as JSON
    async exportAllData() {
        const sessions = await this.getAllSessions();
        const locations = await this.getAllGPSLocations();
        
        return {
            sessions,
            locations,
            exportedAt: new Date().toISOString()
        };
    }

    // Close database connection
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = SQLiteStorage;
