// Browser Fingerprinting Module
// Collects unique browser characteristics for identification

const BrowserFingerprint = {
    // Generate Canvas fingerprint
    getCanvasFingerprint: function() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 200;
            canvas.height = 50;
            
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Browser Fingerprint', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Canvas Print', 4, 17);
            
            return canvas.toDataURL();
        } catch (e) {
            return 'unavailable';
        }
    },

    // Generate WebGL fingerprint
    getWebGLFingerprint: function() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) return 'unavailable';
            
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            return {
                vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
            };
        } catch (e) {
            return 'unavailable';
        }
    },

    // Generate Audio fingerprint
    getAudioFingerprint: function() {
        return new Promise((resolve) => {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) {
                    resolve('unavailable');
                    return;
                }

                const context = new AudioContext();
                const oscillator = context.createOscillator();
                const analyser = context.createAnalyser();
                const gainNode = context.createGain();
                const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

                gainNode.gain.value = 0;
                oscillator.type = 'triangle';
                oscillator.connect(analyser);
                analyser.connect(scriptProcessor);
                scriptProcessor.connect(gainNode);
                gainNode.connect(context.destination);

                scriptProcessor.onaudioprocess = function(event) {
                    const output = event.outputBuffer.getChannelData(0);
                    const fingerprint = Array.from(output.slice(0, 30)).join(',');
                    oscillator.disconnect();
                    scriptProcessor.disconnect();
                    context.close();
                    resolve(fingerprint);
                };

                oscillator.start(0);
            } catch (e) {
                resolve('unavailable');
            }
        });
    },

    // Get installed fonts (approximation)
    getFonts: function() {
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testFonts = [
            'Arial', 'Verdana', 'Times New Roman', 'Courier New',
            'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
            'Trebuchet MS', 'Impact', 'Lucida Console'
        ];
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const detected = [];

        const testString = 'mmmmmmmmmmlli';
        const testSize = '72px';

        const baseMeasurements = {};
        baseFonts.forEach(baseFont => {
            ctx.font = testSize + ' ' + baseFont;
            baseMeasurements[baseFont] = ctx.measureText(testString).width;
        });

        testFonts.forEach(font => {
            let detected_font = false;
            baseFonts.forEach(baseFont => {
                ctx.font = testSize + ' ' + font + ',' + baseFont;
                const matched = ctx.measureText(testString).width !== baseMeasurements[baseFont];
                if (matched) detected_font = true;
            });
            if (detected_font) detected.push(font);
        });

        return detected;
    },

    // Get all fingerprint data
    getAllFingerprints: async function() {
        const audioFingerprint = await this.getAudioFingerprint();
        
        return {
            canvas: this.getCanvasFingerprint(),
            webgl: this.getWebGLFingerprint(),
            audio: audioFingerprint,
            fonts: this.getFonts()
        };
    }
};
