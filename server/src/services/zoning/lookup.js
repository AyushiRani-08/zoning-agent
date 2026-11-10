const mongoose = require('mongoose');
const turf = require('@turf/turf');
const Zone = require('../../models/Zone');
const Rule = require('../../models/Rule');
const pilotRules = require('../../rules/pilotRules');

/**
 * Looks up the municipal zone and corresponding building rules for a plot.
 * Uses MongoDB $geoIntersects when connected; falls back to pilot rules if offline.
 *
 * @param {Object} plot - GeoJSON Polygon
 * @returns {Promise<{ zone: Object | null, rules: Object | null, outsideCoverage: boolean }>}
 */
async function lookupZoneAndRules(plot) {
  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    try {
      // Geospatial intersection query
      const zone = await Zone.findOne({
        geometry: {
          $geoIntersects: {
            $geometry: plot,
          },
        },
      }).lean();

      if (!zone) {
        return { zone: null, rules: null, outsideCoverage: true };
      }

      const rule = await Rule.findOne({ zoneCode: zone.code }).lean();
      return {
        zone,
        rules: rule || pilotRules,
        outsideCoverage: false,
      };
    } catch (err) {
      console.warn('[Zoning] DB lookup error, falling back to pilot rules:', err.message);
    }
  }

  // Fallback mode (when DB is offline / during local unit tests):
  // Checks if plot is in the vicinity of pilot region [76.96, 11.0] (Coimbatore industrial belt)
  const plotCenter = turf.centroid(turf.polygon(plot.coordinates)).geometry.coordinates;
  const [lng, lat] = plotCenter;

  // Approximate pilot corridor bounds (Tamil Nadu pilot area)
  const inPilotBounds = lng >= 76.0 && lng <= 80.5 && lat >= 8.0 && lat <= 13.5;

  if (inPilotBounds) {
    return {
      zone: { code: pilotRules.zoneCode, name: pilotRules.zoneName, region: 'Tamil Nadu' },
      rules: pilotRules,
      outsideCoverage: false,
    };
  }

  return { zone: null, rules: null, outsideCoverage: true };
}

module.exports = { lookupZoneAndRules };

