const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Input
  plot: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true,
    },
    coordinates: {
      type: [[[Number]]],
      required: true,
    },
  },
  intendedUse: {
    type: String,
    required: true,
    trim: true,
  },
  frontEdgeIndex: {
    type: Number,
    default: null,
  },

  // Output (snapshot of study result)
  verdict: {
    type: String,
    enum: ['feasible', 'conditionally_feasible', 'not_feasible', 'cannot_assess'],
    required: true,
  },
  reasons: [String],
  zoneCode: String,
  zoneName: String,
  plotAreaSqM: Number,
  buildableFootprintSqM: Number,
  maxFootprintSqM: Number,
  maxFloorAreaSqM: Number,
  estimatedFloors: Number,
  method: String,
  edgeBreakdown: mongoose.Schema.Types.Mixed,
  buildableFootprint: mongoose.Schema.Types.Mixed, // GeoJSON polygon for map rendering
  aiExplanation: mongoose.Schema.Types.Mixed,      // LLM urban planning analysis

  // Provenance
  rulesSource: String,
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);

