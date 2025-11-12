/**
 * Default State Constants
 * Centralized default values for all state objects to avoid duplication
 * Used across Report app for initialization, reset, and project creation
 */

const DEFAULT_STATES = {
    // Report Data default state
    reportData: {
        client: '',
        jobName: '',
        location: '',
        driller: '',
        helper: '',
        perDiem: '',
        commentsLabor: '',
        uploadedPhotosDetails: []
    },

    // Equipment default state
    equipment: {
        drillRig: '',
        truck: '',
        dumpTruck: 'No',
        dumpTruckTimes: '',
        trailer: 'No',
        coreMachine: false,
        groutMachine: false,
        extruder: false,
        generator: false,
        decon: false
    },

    // Work Day default state (for single day)
    workDay: {
        id: 1,
        date: '', // Will be set to current date at runtime
        timeLeftShop: '',
        arrivedOnSite: '',
        timeLeftSite: '',
        arrivedAtShop: '',
        hoursDriving: '',
        hoursOnSite: '',
        standbyHours: '',
        standbyMinutes: '',
        standbyReason: '',
        pitStopHours: '',
        pitStopMinutes: '',
        pitStopReason: '',
        collapsed: false
    },

    // Boring default state (for single boring)
    boring: {
        id: 1,
        method: '',
        footage: '',
        isEnvironmental: false,
        isGeotechnical: false,
        washboreSetup: false,
        washboreFootage: '',
        casingSetup: false,
        casingFootage: '',
        coreSetup: false,
        coreFootage: '',
        collapsed: false
    },

    // Supplies Data default state
    suppliesData: {
        // Main table items
        endCaps1: '', endCaps2: '', endCaps4: '', endCapsOther: '',
        lockingCaps1: '', lockingCaps2: '', lockingCaps4: '', lockingCapsOther: '',
        screen5_1: '', screen5_2: '', screen5_4: '', screen5Other: '',
        screen10_1: '', screen10_2: '', screen10_4: '', screen10Other: '',
        riser5_1: '', riser5_2: '', riser5_4: '', riser5Other: '',
        riser10_1: '', riser10_2: '', riser10_4: '', riser10Other: '',
        // Other items
        flushMounts7: '', flushMounts8: '', flushMountsOther: '',
        stickUpCovers4: '', stickUpCovers6: '', stickUpCoversOther: '',
        bollards3: '', bollards4: '', bollardsOther: '',
        concrete50: '', concrete60: '', concrete80: '',
        sand: '', drillingMud: '',
        bentoniteChips: '', bentonitePellets: '',
        bentoniteGrout: '', portlandGrout: '',
        buckets: '', shelbyTubes: '',
        numCoreBoxes: '',
        other: '',
        misc: '',
        uploadedPhotosSupplies: []
    }
};

// Helper functions to create default states with current date
DEFAULT_STATES.createDefaultWorkDay = (id = 1) => ({
    ...DEFAULT_STATES.workDay,
    id,
    date: new Date().toISOString().split('T')[0]
});

DEFAULT_STATES.createDefaultBoring = (id = 1) => ({
    ...DEFAULT_STATES.boring,
    id
});

// Helper to get complete default state for new project
DEFAULT_STATES.getCompleteDefaults = () => ({
    reportData: { ...DEFAULT_STATES.reportData },
    equipment: { ...DEFAULT_STATES.equipment },
    workDays: [DEFAULT_STATES.createDefaultWorkDay()],
    borings: [DEFAULT_STATES.createDefaultBoring()],
    suppliesData: { ...DEFAULT_STATES.suppliesData }
});

// Export to window for use in apps
window.DEFAULT_STATES = DEFAULT_STATES;
