// Rate Sheets Service - Manages hourly rates for equipment and labor
// Supports date-based rate changes for historical accuracy

(function() {
    'use strict';

    class RateSheetService {
        constructor() {
            this.storageKey = 'rateSheets_global';
            this.loadRateSheets();
        }

        // Load rate sheets from localStorage
        loadRateSheets() {
            try {
                const stored = localStorage.getItem(this.storageKey);
                this.rateSheets = stored ? JSON.parse(stored) : this.getDefaultRateSheets();
            } catch (error) {
                console.error('Error loading rate sheets:', error);
                this.rateSheets = this.getDefaultRateSheets();
            }
        }

        // Save rate sheets to localStorage
        saveRateSheets() {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.rateSheets));
            } catch (error) {
                console.error('Error saving rate sheets:', error);
            }
        }

        // Default rate sheets structure
        getDefaultRateSheets() {
            return {
                equipment: {
                    'CME-75': [
                        { effectiveDate: '2024-01-01', hourlyRate: 125, description: 'CME-75 Drill Rig' }
                    ],
                    'CME-55': [
                        { effectiveDate: '2024-01-01', hourlyRate: 110, description: 'CME-55 Drill Rig' }
                    ],
                    'Service Truck': [
                        { effectiveDate: '2024-01-01', hourlyRate: 75, description: 'Service Truck' }
                    ],
                    'Dump Truck': [
                        { effectiveDate: '2024-01-01', hourlyRate: 85, description: 'Dump Truck' }
                    ],
                    'Track Rig': [
                        { effectiveDate: '2024-01-01', hourlyRate: 140, description: 'Track Drill Rig' }
                    ]
                },
                labor: {
                    'Driller': [
                        { effectiveDate: '2024-01-01', hourlyRate: 45, description: 'Lead Driller' }
                    ],
                    'Helper': [
                        { effectiveDate: '2024-01-01', hourlyRate: 30, description: 'Helper/Assistant' }
                    ],
                    'Foreman': [
                        { effectiveDate: '2024-01-01', hourlyRate: 55, description: 'Foreman' }
                    ]
                },
                standby: {
                    rate: 50, // Hourly standby rate
                    description: 'Standby time hourly rate'
                }
            };
        }

        // Get current rate for equipment/labor on a specific date
        getRateOnDate(category, name, date) {
            if (!this.rateSheets[category] || !this.rateSheets[category][name]) {
                return 0;
            }

            const dateObj = new Date(date);
            const rates = this.rateSheets[category][name];

            // Sort rates by date (newest first)
            const sortedRates = [...rates].sort((a, b) =>
                new Date(b.effectiveDate) - new Date(a.effectiveDate)
            );

            // Find the first rate where effectiveDate <= date
            const applicableRate = sortedRates.find(rate =>
                new Date(rate.effectiveDate) <= dateObj
            );

            return applicableRate ? applicableRate.hourlyRate : 0;
        }

        // Get current (latest) rate
        getCurrentRate(category, name) {
            const today = new Date().toISOString().split('T')[0];
            return this.getRateOnDate(category, name, today);
        }

        // Add new equipment rate
        addEquipmentRate(equipmentName, hourlyRate, effectiveDate, description) {
            if (!this.rateSheets.equipment[equipmentName]) {
                this.rateSheets.equipment[equipmentName] = [];
            }

            this.rateSheets.equipment[equipmentName].push({
                effectiveDate,
                hourlyRate: parseFloat(hourlyRate),
                description: description || equipmentName
            });

            this.saveRateSheets();
        }

        // Add new labor rate
        addLaborRate(laborType, hourlyRate, effectiveDate, description) {
            if (!this.rateSheets.labor[laborType]) {
                this.rateSheets.labor[laborType] = [];
            }

            this.rateSheets.labor[laborType].push({
                effectiveDate,
                hourlyRate: parseFloat(hourlyRate),
                description: description || laborType
            });

            this.saveRateSheets();
        }

        // Update standby rate
        updateStandbyRate(hourlyRate, description) {
            this.rateSheets.standby = {
                rate: parseFloat(hourlyRate),
                description: description || 'Standby time hourly rate'
            };
            this.saveRateSheets();
        }

        // Get all equipment names
        getAllEquipment() {
            return Object.keys(this.rateSheets.equipment);
        }

        // Get all labor types
        getAllLaborTypes() {
            return Object.keys(this.rateSheets.labor);
        }

        // Get all rates for an equipment
        getEquipmentRateHistory(equipmentName) {
            return this.rateSheets.equipment[equipmentName] || [];
        }

        // Get all rates for a labor type
        getLaborRateHistory(laborType) {
            return this.rateSheets.labor[laborType] || [];
        }

        // Calculate total for equipment hours
        calculateEquipmentCost(equipmentName, hours, date) {
            const rate = this.getRateOnDate('equipment', equipmentName, date);
            return rate * parseFloat(hours || 0);
        }

        // Calculate total for labor hours
        calculateLaborCost(laborType, hours, date) {
            const rate = this.getRateOnDate('labor', laborType, date);
            return rate * parseFloat(hours || 0);
        }

        // Calculate standby cost
        calculateStandbyCost(hours) {
            return this.rateSheets.standby.rate * parseFloat(hours || 0);
        }

        // Delete a specific rate entry
        deleteRate(category, name, effectiveDate) {
            if (!this.rateSheets[category] || !this.rateSheets[category][name]) {
                return false;
            }

            this.rateSheets[category][name] = this.rateSheets[category][name].filter(
                rate => rate.effectiveDate !== effectiveDate
            );

            // If no rates left, remove the entry entirely
            if (this.rateSheets[category][name].length === 0) {
                delete this.rateSheets[category][name];
            }

            this.saveRateSheets();
            return true;
        }

        // Export rate sheets to JSON
        exportToJSON() {
            return JSON.stringify(this.rateSheets, null, 2);
        }

        // Import rate sheets from JSON
        importFromJSON(jsonString) {
            try {
                const imported = JSON.parse(jsonString);
                this.rateSheets = imported;
                this.saveRateSheets();
                return true;
            } catch (error) {
                console.error('Error importing rate sheets:', error);
                return false;
            }
        }

        // Reset to defaults
        resetToDefaults() {
            this.rateSheets = this.getDefaultRateSheets();
            this.saveRateSheets();
        }
    }

    // Make available globally
    window.RateSheetService = RateSheetService;

})();
