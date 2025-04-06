
const mongoose = require('mongoose');

const timePeriodSchema = new mongoose.Schema({
  year: Number,
  month: Number,
  day: Number,
  hour: Number,
  values: [Number],
  sum: Number,
  count: Number,
  timestamp: Date
});

const sensorSchema = new mongoose.Schema({
  sensorId: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance'],
    default: 'Active'
  },
  address: {
    location: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  latitude: Number,
  longitude: Number,
  currentIntensity: Number,
  lastUpdated: Date,
  hourlyData: [timePeriodSchema],
  dailyData: [timePeriodSchema],
  monthlyData: [timePeriodSchema],
  yearlyData: [timePeriodSchema]
});

module.exports = mongoose.model('Sensor', sensorSchema);