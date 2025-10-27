const { MongoClient } = require('mongodb');

class MongoDBStorage {
    constructor(connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/location_tracker') {
        this.connectionString = connectionString;
        this.client = null;
        this.db = null;
    }

    async connect() {
        try {
            this.client = await MongoClient.connect(this.connectionString, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            this.db = this.client.db();
            console.log('✅ MongoDB connected');
            await this.initCollections();
        } catch (error) {
            console.error('❌ MongoDB connection error:', error.message);
            throw error;
        }
    }

    async initCollections() {
        // Create collections if they don't exist
        const collections = await this.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        if (!collectionNames.includes('sessions')) {
            await this.db.createCollection('sessions');
            await this.db.collection('sessions').createIndex({ session_id: 1 }, { unique: true });
            await this.db.collection('sessions').createIndex({ created_at: -1 });
        }

        if (!collectionNames.includes('gps_locations')) {
            await this.db.createCollection('gps_locations');
            await this.db.collection('gps_locations').createIndex({ session_id: 1 });
            await this.db.collection('gps_locations').createIndex({ created_at: -1 });
            // Geospatial index for location queries
            await this.db.collection('gps_locations').createIndex({ location: '2dsphere' });
        }

        if (!collectionNames.includes('interactions')) {
            await this.db.createCollection('interactions');
            await this.db.collection('interactions').createIndex({ session_id: 1 });
            await this.db.collection('interactions').createIndex({ timestamp: -1 });
        }

        console.log('✅ MongoDB collections initialized');
    }

    // Insert session data
    async insertSession(data) {
        const sessionDoc = {
            session_id: data.sessionId,
            client_ip: data.clientIP,
            device: data.device,
            screen: data.screen,
            timezone: data.timezone,
            network: data.network,
            battery: data.battery,
            webrtc: data.webrtc,
            plugins: data.plugins,
            ad_blocker: data.adBlocker,
            referrer: data.referrer,
            fingerprints: data.fingerprints,
            performance: data.performance,
            headers: data.headers,
            ip_geolocation: data.ipGeolocation,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await this.db.collection('sessions').updateOne(
            { session_id: data.sessionId },
            { $set: sessionDoc },
            { upsert: true }
        );

        return result;
    }

    // Insert GPS location
    async insertGPSLocation(sessionId, gps) {
        if (!gps || gps.error) {
            return null;
        }

        const locationDoc = {
            session_id: sessionId,
            latitude: gps.latitude,
            longitude: gps.longitude,
            // GeoJSON format for geospatial queries
            location: {
                type: 'Point',
                coordinates: [gps.longitude, gps.latitude]
            },
            accuracy: gps.accuracy,
            altitude: gps.altitude,
            altitude_accuracy: gps.altitudeAccuracy,
            heading: gps.heading,
            speed: gps.speed,
            timestamp: new Date(gps.timestamp),
            created_at: new Date()
        };

        const result = await this.db.collection('gps_locations').insertOne(locationDoc);
        return result;
    }

    // Insert interaction
    async insertInteraction(data) {
        const interactionDoc = {
            session_id: data.sessionId,
            type: data.type,
            data: data.data,
            timestamp: new Date()
        };

        const result = await this.db.collection('interactions').insertOne(interactionDoc);
        return result;
    }

    // Get all sessions
    async getAllSessions(limit = 100) {
        return await this.db.collection('sessions')
            .find({})
            .sort({ created_at: -1 })
            .limit(limit)
            .toArray();
    }

    // Get session by ID
    async getSessionById(sessionId) {
        return await this.db.collection('sessions').findOne({ session_id: sessionId });
    }

    // Get all GPS locations
    async getAllGPSLocations(limit = 100) {
        return await this.db.collection('gps_locations')
            .find({})
            .sort({ created_at: -1 })
            .limit(limit)
            .toArray();
    }

    // Get GPS locations by session
    async getGPSLocationsBySession(sessionId) {
        return await this.db.collection('gps_locations')
            .find({ session_id: sessionId })
            .sort({ created_at: -1 })
            .toArray();
    }

    // Find locations near a point (requires 2dsphere index)
    async findLocationsNear(longitude, latitude, maxDistance = 5000) {
        return await this.db.collection('gps_locations').find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: maxDistance // in meters
                }
            }
        }).toArray();
    }

    // Get interactions by session
    async getInteractionsBySession(sessionId) {
        return await this.db.collection('interactions')
            .find({ session_id: sessionId })
            .sort({ timestamp: -1 })
            .toArray();
    }

    // Get all interactions
    async getAllInteractions(limit = 500) {
        return await this.db.collection('interactions')
            .find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
    }

    // Export all data
    async exportAllData() {
        const sessions = await this.getAllSessions(1000);
        const locations = await this.getAllGPSLocations(1000);
        const interactions = await this.getAllInteractions(1000);

        return {
            sessions,
            locations,
            interactions,
            exportedAt: new Date().toISOString()
        };
    }

    // Statistics
    async getStatistics() {
        const totalSessions = await this.db.collection('sessions').countDocuments();
        const totalLocations = await this.db.collection('gps_locations').countDocuments();
        const totalInteractions = await this.db.collection('interactions').countDocuments();

        // Get sessions with GPS data
        const sessionsWithGPS = await this.db.collection('gps_locations').distinct('session_id');

        return {
            total_sessions: totalSessions,
            total_gps_locations: totalLocations,
            total_interactions: totalInteractions,
            sessions_with_gps: sessionsWithGPS.length,
            gps_permission_rate: totalSessions > 0 
                ? ((sessionsWithGPS.length / totalSessions) * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    // Close connection
    async close() {
        if (this.client) {
            await this.client.close();
            console.log('MongoDB connection closed');
        }
    }
}

module.exports = MongoDBStorage;
