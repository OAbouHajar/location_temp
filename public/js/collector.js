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
                resolve({ error: 'Geolocation not supported' });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.timestamp
                    });
                },
                (error) => {
                    resolve({ 
                        error: error.message,
                        code: error.code,
                        granted: false
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
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
            const response = await fetch('/api/collect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                console.log('Data sent successfully');
            }
        } catch (error) {
            console.error('Error sending data:', error);
        }
    },

    // Start automatic collection
    startCollection: async function() {
        // Collect passive data immediately
        const passiveData = await this.collectPassiveData();
        this.collectedData = passiveData;
        
        // Send to server
        await this.sendToServer(this.collectedData);

        console.log('Data collection initialized:', this.sessionId);
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
