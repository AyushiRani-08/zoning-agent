const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  zoneCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  zoneName: {
    type: String,
    required: true,
  },
  industryCategory: {
    type: String,
    default: 'Green & Orange industries',
  },
  permittedUses: [{
    type: String,
    trim: true,
  }],
  conditionalUses: [{
    type: String,
    trim: true,
  }],
  far: {
    type: Number,
    required: true,
  },
  minRoadWidthM: {
    type: Number,
    default: 7.0,
  },
  maxHeightM: {
    type: Number,
    default: 18.30,
  },
  groundCoveragePct: {
    type: Number,
    default: 60,
  },
  setbacks: {
    front: { type: Number, required: true },
    side: { type: Number, required: true },
    rear: { type: Number, required: true },
  },
  parking: {
    type: mongoose.Schema.Types.Mixed,
  },
  source: {
    type: String,
    required: true,
  },
  effectiveDate: {
    type: Date,
    default: () => new Date('2019-02-04'),
  },
}, { timestamps: true });

module.exports = mongoose.model('Rule', ruleSchema);

