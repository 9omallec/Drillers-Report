/**
 * Geolocation Utilities
 * Handles GPS location and reverse geocoding
 */

const GeolocationUtils = {
    /**
     * Get current GPS location with optional reverse geocoding
     * @param {boolean} reverseGeocode - Whether to get address from coordinates (default: true)
     * @returns {Promise<Object>} Object with location data
     */
    async getCurrentLocation(reverseGeocode = true) {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('GPS is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude, accuracy } = position.coords;

                    const result = {
                        latitude,
                        longitude,
                        accuracy,
                        coordinates: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                        address: null
                    };

                    // Try reverse geocoding if requested
                    if (reverseGeocode) {
                        try {
                            const address = await GeolocationUtils.reverseGeocode(latitude, longitude);
                            result.address = address;
                        } catch (error) {
                            console.warn('Reverse geocoding failed:', error);
                            // Continue without address
                        }
                    }

                    resolve(result);
                },
                (error) => {
                    let message = 'Unable to get location. ';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message += 'Please enable location permissions.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message += 'Location information unavailable.';
                            break;
                        case error.TIMEOUT:
                            message += 'Location request timed out.';
                            break;
                        default:
                            message += 'An unknown error occurred.';
                    }
                    reject(new Error(message));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    },

    /**
     * Reverse geocode coordinates to get address
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @returns {Promise<string>} Address string
     */
    async reverseGeocode(latitude, longitude) {
        try {
            // Using OpenStreetMap's Nominatim API (free, no key required)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                {
                    headers: {
                        'User-Agent': 'Drillers-Report-App' // Required by Nominatim
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Geocoding service error');
            }

            const data = await response.json();

            if (data && data.display_name) {
                return data.display_name;
            } else {
                throw new Error('Address not found');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            throw error;
        }
    },

    /**
     * Calculate distance between two coordinates (in kilometers)
     * @param {number} lat1 - First latitude
     * @param {number} lon1 - First longitude
     * @param {number} lat2 - Second latitude
     * @param {number} lon2 - Second longitude
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    /**
     * Format coordinates to various formats
     * @param {number} latitude - Latitude
     * @param {number} longitude - Longitude
     * @param {string} format - Format type: 'decimal', 'dms', 'google'
     * @returns {string} Formatted coordinates
     */
    formatCoordinates(latitude, longitude, format = 'decimal') {
        switch (format) {
            case 'decimal':
                return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

            case 'dms':
                // Convert to degrees, minutes, seconds
                const latDMS = this.decimalToDMS(latitude, true);
                const lonDMS = this.decimalToDMS(longitude, false);
                return `${latDMS}, ${lonDMS}`;

            case 'google':
                return `https://www.google.com/maps?q=${latitude},${longitude}`;

            default:
                return `${latitude}, ${longitude}`;
        }
    },

    /**
     * Convert decimal degrees to DMS (degrees, minutes, seconds)
     * @param {number} decimal - Decimal degrees
     * @param {boolean} isLatitude - True for latitude, false for longitude
     * @returns {string} DMS format string
     */
    decimalToDMS(decimal, isLatitude) {
        const absolute = Math.abs(decimal);
        const degrees = Math.floor(absolute);
        const minutesDecimal = (absolute - degrees) * 60;
        const minutes = Math.floor(minutesDecimal);
        const seconds = ((minutesDecimal - minutes) * 60).toFixed(2);

        const direction = isLatitude
            ? (decimal >= 0 ? 'N' : 'S')
            : (decimal >= 0 ? 'E' : 'W');

        return `${degrees}°${minutes}'${seconds}"${direction}`;
    }
};

// Export utilities
window.GeolocationUtils = GeolocationUtils;
