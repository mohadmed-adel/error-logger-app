/**
 * Test script to simulate geofence error logs
 * Run with: npm run test:geofence
 * or: tsx scripts/test-geofence-errors.ts
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

interface GeofenceError {
  message: string;
  userId: string;
  level: 'error' | 'warning' | 'info';
  stack?: string;
  serverUrl?: string;
  userSecretKey?: string;
  metadata?: {
    geofenceId?: string;
    geofenceName?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    eventType?: 'enter' | 'exit' | 'dwell';
    accuracy?: number;
    speed?: number;
    timestamp?: string;
    platform?: string;
    [key: string]: any;
  };
}

const geofenceErrors: GeofenceError[] = [
  {
    message: 'Geofence entry detected',
    userId: '1',
    level: 'info',
    serverUrl: 'https://geofence-service.example.com',
    metadata: {
      geofenceId: 'gf_001',
      geofenceName: 'Office Building',
      latitude: 37.7749,
      longitude: -122.4194,
      radius: 100,
      eventType: 'enter',
      accuracy: 10.5,
      speed: 0,
      timestamp: new Date().toISOString(),
      platform: 'iOS',
    },
  },
  {
    message: 'Geofence exit detected',
    userId: '1',
    level: 'info',
    serverUrl: 'https://geofence-service.example.com',
    metadata: {
      geofenceId: 'gf_001',
      geofenceName: 'Office Building',
      latitude: 37.7750,
      longitude: -122.4195,
      radius: 100,
      eventType: 'exit',
      accuracy: 12.3,
      speed: 5.2,
      timestamp: new Date().toISOString(),
      platform: 'Android',
    },
  },
  {
    message: 'Geofence accuracy too low',
    userId: '1',
    level: 'warning',
    serverUrl: 'https://geofence-service.example.com',
    stack: 'Warning: Location accuracy is below threshold\n    at GeofenceService.checkAccuracy (geofence.ts:45:10)\n    at LocationManager.updateLocation (location.ts:123:5)',
    metadata: {
      geofenceId: 'gf_002',
      geofenceName: 'Home',
      latitude: 37.7849,
      longitude: -122.4094,
      radius: 50,
      eventType: 'enter',
      accuracy: 150.0,
      speed: 0,
      timestamp: new Date().toISOString(),
      platform: 'iOS',
      threshold: 50,
    },
  },
  {
    message: 'Failed to register geofence',
    userId: '1',
    level: 'error',
    serverUrl: 'https://geofence-service.example.com',
    stack: 'Error: Geofence registration failed\n    at GeofenceService.register (geofence.ts:78:15)\n    at LocationManager.setupGeofences (location.ts:234:8)\n    at App.initializeLocation (app.ts:45:12)',
    metadata: {
      geofenceId: 'gf_003',
      geofenceName: 'Restaurant',
      latitude: 37.7649,
      longitude: -122.4294,
      radius: 25,
      errorCode: 'PERMISSION_DENIED',
      errorMessage: 'Location permissions not granted',
      timestamp: new Date().toISOString(),
      platform: 'Android',
    },
  },
  {
    message: 'Geofence dwell time exceeded',
    userId: '1',
    level: 'info',
    serverUrl: 'https://geofence-service.example.com',
    metadata: {
      geofenceId: 'gf_001',
      geofenceName: 'Office Building',
      latitude: 37.7749,
      longitude: -122.4194,
      radius: 100,
      eventType: 'dwell',
      accuracy: 8.2,
      speed: 0,
      dwellTime: 3600000, // 1 hour in milliseconds
      timestamp: new Date().toISOString(),
      platform: 'iOS',
    },
  },
  {
    message: 'Multiple geofences triggered simultaneously',
    userId: '1',
    level: 'warning',
    serverUrl: 'https://geofence-service.example.com',
    metadata: {
      geofenceIds: ['gf_001', 'gf_004'],
      geofenceNames: ['Office Building', 'Parking Lot'],
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 5.0,
      speed: 0,
      timestamp: new Date().toISOString(),
      platform: 'Android',
      conflict: true,
    },
  },
  {
    message: 'Geofence monitoring service unavailable',
    userId: '1',
    level: 'error',
    serverUrl: 'https://geofence-service.example.com',
    stack: 'Error: Service unavailable\n    at GeofenceService.checkServiceStatus (geofence.ts:156:20)\n    at LocationManager.startMonitoring (location.ts:189:5)',
    metadata: {
      serviceStatus: 'unavailable',
      lastCheck: new Date(Date.now() - 60000).toISOString(),
      retryCount: 3,
      timestamp: new Date().toISOString(),
      platform: 'iOS',
    },
  },
  {
    message: 'Geofence boundary crossed',
    userId: '1',
    level: 'info',
    serverUrl: 'https://geofence-service.example.com',
    metadata: {
      geofenceId: 'gf_005',
      geofenceName: 'Gym',
      latitude: 37.7949,
      longitude: -122.4094,
      radius: 30,
      eventType: 'enter',
      accuracy: 15.0,
      speed: 2.5,
      timestamp: new Date().toISOString(),
      platform: 'Android',
      previousLocation: {
        latitude: 37.7948,
        longitude: -122.4093,
      },
    },
  },
];

async function sendGeofenceError(error: GeofenceError) {
  try {
    const response = await fetch(`${API_URL}/api/errors/public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(error),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ ${error.level.toUpperCase()}: ${error.message}`);
      console.log(`   Error ID: ${data.id}`);
    } else {
      console.error(`❌ Failed to send: ${error.message}`);
      console.error(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.error(`❌ Network error sending: ${error}`);
  }
}

async function testGeofenceErrors() {
  console.log('🚀 Starting geofence error log simulation...\n');
  console.log(`📡 API URL: ${API_URL}\n`);

  for (let i = 0; i < geofenceErrors.length; i++) {
    const error = geofenceErrors[i];
    console.log(`[${i + 1}/${geofenceErrors.length}] Sending: ${error.message}`);
    await sendGeofenceError(error);
    
    // Add small delay between requests
    if (i < geofenceErrors.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('');
  }

  console.log('✨ Geofence error simulation complete!');
  console.log(`📊 Check errors at: ${API_URL}`);
}

// Run the test
testGeofenceErrors().catch(console.error);

