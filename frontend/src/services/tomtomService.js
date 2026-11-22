/**
 * ResQIntel - TomTom Maps & Location Services
 * Official TomTom Map Display, Places Search, Geocoding & Reverse Geocoding Integration
 *
 * Requirements addressed:
 * - Map Display API (raster tiles: basic/main, basic/night)
 * - Places Search API & Geocoding API (search suggestions with typeahead & debounce)
 * - Reverse Geocoding API (coordinate to structured address)
 * - Safe environment variable handling (VITE_TOMTOM_API_KEY)
 * - Evaluation key limits protection (in-memory caching, debounced requests)
 */

const TOMTOM_BASE_URL = 'https://api.tomtom.com';

// Sensible Kolkata default coordinates
export const DEFAULT_MAP_CENTER = [22.5726, 88.3639];
export const DEFAULT_MAP_ZOOM = 13;

// In-memory cache to conserve evaluation quota
const searchCache = new Map();
const reverseGeocodeCache = new Map();

/**
 * Retrieve the configured TomTom API Key
 */
export const getTomTomApiKey = () => {
  const key = import.meta.env.VITE_TOMTOM_API_KEY;
  if (!key || typeof key !== 'string') return '';
  return key.trim();
};

/**
 * Check if a valid, non-placeholder TomTom API Key is present
 */
export const isTomTomConfigured = () => {
  const key = getTomTomApiKey();
  return Boolean(
    key &&
    key !== '' &&
    key !== 'your_tomtom_api_key_here' &&
    key !== 'undefined' &&
    key !== 'null'
  );
};

/**
 * Return a safe, masked string of the API key for diagnostics without leaking credentials
 */
export const getMaskedApiKey = () => {
  const key = getTomTomApiKey();
  if (!key) return 'Not configured';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

/**
 * Get the TomTom Map Display tile URL template
 * @param {'main' | 'night'} style - Street style ('main' for standard street map, 'night' for dark ops)
 */
export const getTomTomTileUrl = (style = 'main') => {
  const key = getTomTomApiKey();
  return `${TOMTOM_BASE_URL}/map/1/tile/basic/${style}/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}&tileSize=256`;
};

/**
 * Attribution string required by TomTom Maps Terms of Service
 */
export const TOMTOM_ATTRIBUTION = '&copy; 1992 - 2026 <a href="https://www.tomtom.com" target="_blank" rel="noopener noreferrer">TomTom</a>';

/**
 * Search places, addresses, landmarks, street names, or PIN codes using TomTom Places Search
 * @param {string} query
 * @param {Object} options
 * @param {number} [options.limit=5]
 * @param {string} [options.countrySet='IN']
 * @param {number} [options.lat=22.5726] - Bias center latitude
 * @param {number} [options.lon=88.3639] - Bias center longitude
 * @param {number} [options.radius=50000] - Bias radius in meters
 */
export const searchPlaces = async (query, options = {}) => {
  if (!query || query.trim().length < 2) return [];

  const key = getTomTomApiKey();
  if (!isTomTomConfigured()) {
    throw new Error('TOMTOM_API_KEY_MISSING');
  }

  const cleanQuery = query.trim().toLowerCase();
  const cacheKey = `${cleanQuery}_${options.countrySet || 'IN'}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  const params = new URLSearchParams({
    key,
    typeahead: 'true',
    limit: String(options.limit || 6),
    language: 'en-GB'
  });

  if (options.countrySet !== null) {
    params.set('countrySet', options.countrySet || 'IN');
  }

  // Location biasing towards Kolkata or current map view
  const biasLat = options.lat !== undefined ? options.lat : DEFAULT_MAP_CENTER[0];
  const biasLon = options.lon !== undefined ? options.lon : DEFAULT_MAP_CENTER[1];
  params.set('lat', String(biasLat));
  params.set('lon', String(biasLon));
  params.set('radius', String(options.radius || 60000));

  const url = `${TOMTOM_BASE_URL}/search/2/search/${encodeURIComponent(query.trim())}.json?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 403 || res.status === 401) {
        throw new Error('TOMTOM_API_KEY_INVALID');
      }
      if (res.status === 429) {
        throw new Error('TOMTOM_RATE_LIMITED');
      }
      throw new Error(`TomTom search returned status ${res.status}`);
    }

    const data = await res.json();
    const results = (data.results || []).map((item) => {
      const addr = item.address || {};
      const poi = item.poi || {};
      const pos = item.position || {};

      // Build a clean, readable display title & subtitle
      const title = poi.name || addr.freeformAddress || query;
      const subtitle = [
        addr.streetName ? `${addr.streetNumber || ''} ${addr.streetName}`.trim() : null,
        addr.municipality || addr.municipalitySubdivision || null,
        addr.countrySecondarySubdivision || null,
        addr.countrySubdivision || null,
        addr.postalCode || null
      ].filter(Boolean).join(', ');

      return {
        id: item.id || `${pos.lat}_${pos.lon}`,
        title,
        subtitle: subtitle || addr.freeformAddress || '',
        formattedAddress: addr.freeformAddress || title,
        street: addr.streetName ? `${addr.streetNumber || ''} ${addr.streetName}`.trim() : (poi.name || ''),
        city: addr.municipality || addr.municipalitySubdivision || '',
        district: addr.countrySecondarySubdivision || '',
        state: addr.countrySubdivision || addr.countrySubdivisionName || '',
        postalCode: addr.postalCode || '',
        country: addr.country || 'India',
        latitude: pos.lat,
        longitude: pos.lon,
        type: item.type || 'place'
      };
    });

    searchCache.set(cacheKey, results);
    return results;
  } catch (err) {
    if (err.message === 'TOMTOM_API_KEY_INVALID' || err.message === 'TOMTOM_RATE_LIMITED') {
      throw err;
    }
    console.warn('TomTom search places error:', err.message);
    throw err;
  }
};

/**
 * Reverse geocode latitude and longitude to a structured civic address using TomTom Reverse Geocoding API
 * @param {number|string} lat
 * @param {number|string} lon
 */
export const reverseGeocode = async (lat, lon) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Invalid coordinates for reverse geocoding');
  }

  const key = getTomTomApiKey();
  if (!isTomTomConfigured()) {
    throw new Error('TOMTOM_API_KEY_MISSING');
  }

  const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey);
  }

  const params = new URLSearchParams({
    key,
    language: 'en-GB',
    radius: '100'
  });

  const url = `${TOMTOM_BASE_URL}/search/2/reverseGeocode/${latitude},${longitude}.json?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 403 || res.status === 401) {
        throw new Error('TOMTOM_API_KEY_INVALID');
      }
      if (res.status === 429) {
        throw new Error('TOMTOM_RATE_LIMITED');
      }
      throw new Error(`TomTom reverse geocode returned status ${res.status}`);
    }

    const data = await res.json();
    const addressRecord = data.addresses?.[0]?.address || {};

    const street = addressRecord.streetName
      ? `${addressRecord.streetNumber || ''} ${addressRecord.streetName}`.trim()
      : (addressRecord.freeformAddress?.split(',')?.[0]?.trim() || '');

    const city = addressRecord.municipality ||
                 addressRecord.municipalitySubdivision ||
                 addressRecord.localName ||
                 '';

    const district = addressRecord.countrySecondarySubdivision || '';
    const state = addressRecord.countrySubdivision || addressRecord.countrySubdivisionName || '';
    const postalCode = addressRecord.postalCode || '';
    const formattedAddress = addressRecord.freeformAddress ||
      [street, city, district, state, postalCode].filter(Boolean).join(', ');

    const result = {
      formattedAddress,
      street,
      city,
      district,
      state,
      postalCode,
      country: addressRecord.country || 'India',
      latitude,
      longitude
    };

    reverseGeocodeCache.set(cacheKey, result);
    return result;
  } catch (err) {
    if (err.message === 'TOMTOM_API_KEY_INVALID' || err.message === 'TOMTOM_RATE_LIMITED') {
      throw err;
    }
    console.warn('TomTom reverse geocode error:', err.message);
    throw err;
  }
};
