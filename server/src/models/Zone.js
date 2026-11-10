const mongoose = require('mongoose');

const polygonSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Polygon'],
    required: true,
    default: 'Polygon',
  },
  coordinates: {
    type: [[[Number]]], // Array of linear rings of [lng, lat]
    required: true,
  },
}, { _id: false });

const zoneSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  region: {
    type: String,
    required: true,
    default: 'Tamil Nadu',
  },
  geometry: {
    type: polygonSchema,
    required: true,
  },
}, { timestamps: true });

// Crucial geospatial index for fast Point/Polygon-in-Zone intersection queries
zoneSchema.index({ geometry: '2dsphere' });

module.exports = mongoose.model('Zone', zoneSchema);

