// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    } else {
        navbar.style.backgroundColor = 'white';
        navbar.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    }
});

// Form validation and submission
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = this.querySelector('input[type="text"]').value;
        const email = this.querySelector('input[type="email"]').value;
        const message = this.querySelector('textarea').value;

        // Basic validation
        if (!name || !email || !message) {
            alert('Please fill in all fields');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        // Here you would typically send the data to your server
        console.log('Form submitted:', { name, email, message });
        alert('Thank you for your message! We will get back to you soon.');
        this.reset();
    });
}

// --- Leaflet Map Integration ---
let selectedCoords = null;
let marker = null;
let map = null;

window.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    map = L.map('map').setView([20.5937, 78.9629], 5); // Centered on India
    
    // Satellite layer (base)
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    // OpenStreetMap standard layer (for labels/roads)
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        opacity: 0.7, // Adjust opacity to see satellite below
        zIndex: 2 // Ensure it's above the satellite layer
    });

    // Add layers to the map
    satelliteLayer.addTo(map);
    osmLayer.addTo(map);

    // Handle 'Use My Current Location' button
    const useLocationBtn = document.getElementById('use-location-btn');
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        selectedCoords = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        map.setView([selectedCoords.lat, selectedCoords.lng], 13);
                        if (marker) {
                            marker.setLatLng(selectedCoords);
                        } else {
                            marker = L.marker(selectedCoords).addTo(map);
                        }
                        document.getElementById('location-coords').textContent = `Selected Location: Lat ${selectedCoords.lat.toFixed(5)}, Lng ${selectedCoords.lng.toFixed(5)}`;
                    },
                    function(error) {
                        document.getElementById('location-coords').textContent = 'Could not get your location. Please allow location access.';
                    }
                );
            } else {
                document.getElementById('location-coords').textContent = 'Geolocation is not supported by your browser.';
            }
        });
    }

    // Allow user to click on the map to select a location
    map.on('click', function(e) {
        selectedCoords = e.latlng;
        if (marker) {
            marker.setLatLng(selectedCoords);
        } else {
            marker = L.marker(selectedCoords).addTo(map);
        }
        document.getElementById('location-coords').textContent = `Selected Location: Lat ${selectedCoords.lat.toFixed(5)}, Lng ${selectedCoords.lng.toFixed(5)}`;
    });
});

// Crop and Soil Analysis
const analyzeBtn = document.querySelector('.analyze-btn');
if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async function() {
        const cropSelect = document.getElementById('crop-select');
        const soilSelect = document.getElementById('soil-select');

        if (!cropSelect.value || !soilSelect.value) {
            alert('Please select both crop and soil type');
            return;
        }
        if (!selectedCoords) {
            alert('Please select a location using the map or the button.');
            return;
        }

        // Disable the analyze button while processing
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';

        // Show loading state in the results section
        const resultsContent = document.querySelector('.results-content');
        resultsContent.innerHTML = '<div class="loading">Analyzing your crop, soil, and location combination...</div>';
        const resultsSection = document.querySelector('.results-section');
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        try {
            // Get analysis from Gemini API
            const results = await analyzeCropAndSoil(cropSelect.value, soilSelect.value, selectedCoords);
            
            // Display results
            displayAnalysisResults(results);
        } catch (error) {
            // Show error message in the results section
            const errorMessage = error.message || 'Error analyzing combination.';
            resultsContent.innerHTML = `<div class="error-message">Error: ${errorMessage}</div>`;
            console.error('Analysis error:', error);
        } finally {
            // Re-enable the analyze button
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'Analyze';
        }
    });
} 