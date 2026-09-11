import { LocationData, UserProfile } from '../types';

export interface LocationIdentificationResult {
  success: boolean;
  location: LocationData;
  source: 'GPS' | 'NETWORK_IP' | 'MANUAL' | 'DEFAULT';
  sourceLabel: string;
  formattedLocation: string;
  error?: string;
}

/**
 * Identify the user's correct location.
 * Priority 1: High-Accuracy W3C Browser Geolocation (GPS / Wi-Fi / Cell Triangulation)
 * Priority 2: Reverse Geocoding to obtain exact street, neighborhood, city, region, country
 * Priority 3: Fallback to Network IP-based Geolocation if GPS permission is denied or unavailable
 */
export async function identifyUserLocation(userId?: string): Promise<LocationIdentificationResult> {
  // Step 1: Try HTML5 Browser Geolocation with high accuracy
  try {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0
          }
        );
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy || 10;

      // Step 2: Reverse Geocode to obtain human-readable address
      let reverseGeo: any = null;
      try {
        const geoRes = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (geoRes.ok) {
          reverseGeo = await geoRes.json();
        }
      } catch (e) {
        console.warn('Reverse geocode fetch failed, using coordinates:', e);
      }

      const city = reverseGeo?.city || 'Identified Area';
      const region = reverseGeo?.region || '';
      const country = reverseGeo?.country || 'India';
      const address = reverseGeo?.address || `Coordinates: ${(Number(lat) || 0).toFixed(4)}, ${(Number(lng) || 0).toFixed(4)}`;
      const postalCode = reverseGeo?.postalCode || '';

      const locationData: LocationData = {
        lat,
        lng,
        accuracy: Math.round(accuracy),
        city,
        region,
        country,
        address,
        postalCode,
        source: 'GPS',
        detectedAt: new Date().toISOString()
      };

      // Save to server if userId provided
      if (userId) {
        syncUserLocationToServer(userId, locationData).catch(() => {});
      }

      const formatted = [city, region, country].filter(Boolean).join(', ');

      return {
        success: true,
        location: locationData,
        source: 'GPS',
        sourceLabel: `High-Precision Device GPS (±${Math.round(accuracy)}m)`,
        formattedLocation: formatted
      };
    }
  } catch (gpsError: any) {
    console.info('GPS identification did not complete, falling back to IP Geolocation:', gpsError?.message || gpsError);
  }

  // Step 3: Fallback to IP-Based Geolocation
  try {
    // First try internal endpoint
    let ipData: any = null;
    const internalRes = await fetch('/api/detect-ip-location').catch(() => null);
    if (internalRes && internalRes.ok) {
      ipData = await internalRes.json();
    }

    // If internal didn't have external IP or failed, try direct client-side freeipapi
    if (!ipData || !ipData.city) {
      const directRes = await fetch('https://freeipapi.com/api/json').catch(() => null);
      if (directRes && directRes.ok) {
        const d = await directRes.json();
        ipData = {
          lat: d.latitude,
          lng: d.longitude,
          city: d.cityName,
          region: d.regionName,
          country: d.countryName,
          postalCode: d.zipCode,
          address: [d.cityName, d.regionName, d.countryName].filter(Boolean).join(', '),
          ip: d.ipAddress,
          accuracy: 5000
        };
      }
    }

    if (ipData && ipData.lat && ipData.lng) {
      const locationData: LocationData = {
        lat: Number(ipData.lat),
        lng: Number(ipData.lng),
        accuracy: ipData.accuracy || 5000,
        city: ipData.city || 'Chennai',
        region: ipData.region || 'Tamil Nadu',
        country: ipData.country || 'India',
        address: ipData.address || `${ipData.city || 'Area'}, ${ipData.region || ''}`,
        postalCode: ipData.postalCode || '',
        ip: ipData.ip || '',
        source: 'NETWORK_IP',
        detectedAt: new Date().toISOString()
      };

      if (userId) {
        syncUserLocationToServer(userId, locationData).catch(() => {});
      }

      const formatted = [locationData.city, locationData.region, locationData.country].filter(Boolean).join(', ');

      return {
        success: true,
        location: locationData,
        source: 'NETWORK_IP',
        sourceLabel: 'Network / ISP Geolocation',
        formattedLocation: formatted
      };
    }
  } catch (ipError) {
    console.warn('IP geolocation detection failed:', ipError);
  }

  // Fallback default
  const defaultLoc: LocationData = {
    lat: 13.0827,
    lng: 80.2707,
    accuracy: 25,
    city: 'Chennai',
    region: 'Tamil Nadu',
    country: 'India',
    address: 'Anna Salai, Guindy, Chennai, Tamil Nadu',
    source: 'DEFAULT',
    detectedAt: new Date().toISOString()
  };

  return {
    success: false,
    location: defaultLoc,
    source: 'DEFAULT',
    sourceLabel: 'Default Presumed Location',
    formattedLocation: 'Chennai, Tamil Nadu, India',
    error: 'Could not access browser GPS sensor or IP Geolocation network.'
  };
}

/**
 * Persists updated location to backend server
 */
export async function syncUserLocationToServer(userId: string, location: LocationData): Promise<UserProfile | null> {
  try {
    const res = await fetch('/api/user/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, location })
    });

    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
  } catch (e) {
    console.warn('Failed to sync location to server:', e);
  }
  return null;
}

/**
 * Get map link for coordinates
 */
export function getMapUrl(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}
