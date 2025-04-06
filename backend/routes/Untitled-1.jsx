
const express = require('express');
const router = express.Router();
const Sensor = require('../models/Sensor');

// Add new sensor
router.post('/', async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.sensorId) {
      return res.status(400).json({ message: 'Sensor ID is required' });
    }
    if (!req.body.latitude || !req.body.longitude) {
      return res.status(400).json({ message: 'Coordinates are required' });
    }
    if (!req.body.address?.location) {
      return res.status(400).json({ message: 'Address is required' });
    }

    // Check for existing sensor
    const existingSensor = await Sensor.findOne({ sensorId: req.body.sensorId });
    if (existingSensor) {
      return res.status(400).json({ message: 'Sensor ID already exists' });
    }

    // Create new sensor with defaults
    const sensor = new Sensor({
      sensorId: req.body.sensorId,
      status: req.body.status || 'Active',
      intensity: req.body.intensity || 100, // Default value
      address: {
        location: req.body.address.location,
        city: req.body.address.city,
        state: req.body.address.state,
        country: req.body.address.country,
        pincode: req.body.address.pincode
      },
      latitude: req.body.latitude,
      longitude: req.body.longitude
    });

    const savedSensor = await sensor.save();
    res.status(201).json(savedSensor);

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: err.message 
    });
  }
});

// Get all sensors
router.get('/all', async (req, res) => {
  try {
    const sensors = await Sensor.find();
    res.json(sensors);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sensor by ID or coordinates
router.get('/', async (req, res) => {
  try {
    const { sensorId, longitude, latitude } = req.query;
    let sensor;

    if (sensorId) {
      sensor = await Sensor.findOne({ sensorId });
    } else if (longitude && latitude) {
      sensor = await Sensor.findOne({
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude)
      });
    }

    if (!sensor) {
      return res.status(404).json({ message: 'Sensor not found' });
    }
    res.json(sensor);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Process real-time sensor data
router.post('/sensor-data', async (req, res) => {
  try {
    const { sensorID, longitude, latitude, value } = req.body;
    
    // Validation
    if (!sensorID || longitude === undefined || latitude === undefined || value === undefined) {
      return res.status(400).json({ 
        message: 'Missing required fields: sensorID, longitude, latitude, or value' 
      });
    }
     
    const sensor = await Sensor.findOne({ sensorId: sensorID });
    if (!sensor) {
      return res.status(400).json({ message: "Invalid sensor ID" });
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Initialize arrays if they don't exist
    if (!sensor.hourlyData) sensor.hourlyData = [];
    if (!sensor.dailyData) sensor.dailyData = [];
    if (!sensor.monthlyData) sensor.monthlyData = [];
    if (!sensor.yearlyData) sensor.yearlyData = [];

    // Create or update current hour data
    let currentHourEntry = sensor.hourlyData.find(entry => 
      entry.year === currentYear && 
      entry.month === currentMonth && 
      entry.day === currentDay && 
      entry.hour === currentHour
    );

    if (!currentHourEntry) {
      currentHourEntry = {
        year: currentYear,
        month: currentMonth,
        day: currentDay,
        hour: currentHour,
        values: [value],
        sum: value,
        count: 1,
        timestamp: new Date(currentYear, currentMonth - 1, currentDay, currentHour)
      };
      sensor.hourlyData.push(currentHourEntry);
    } else {
      currentHourEntry.values.push(value);
      currentHourEntry.sum += value;
      currentHourEntry.count++;
    }

    // Create or update current day data
    let currentDayEntry = sensor.dailyData.find(entry => 
      entry.year === currentYear && 
      entry.month === currentMonth && 
      entry.day === currentDay
    );

    if (!currentDayEntry) {
      currentDayEntry = {
        year: currentYear,
        month: currentMonth,
        day: currentDay,
        values: [value],
        sum: value,
        count: 1,
        timestamp: new Date(currentYear, currentMonth - 1, currentDay)
      };
      sensor.dailyData.push(currentDayEntry);
    } else {
      currentDayEntry.values.push(value);
      currentDayEntry.sum += value;
      currentDayEntry.count++;
    }

    // Create or update current month data
    let currentMonthEntry = sensor.monthlyData.find(entry => 
      entry.year === currentYear && 
      entry.month === currentMonth
    );

    if (!currentMonthEntry) {
      currentMonthEntry = {
        year: currentYear,
        month: currentMonth,
        values: [value],
        sum: value,
        count: 1,
        timestamp: new Date(currentYear, currentMonth - 1, 1)
      };
      sensor.monthlyData.push(currentMonthEntry);
    } else {
      currentMonthEntry.values.push(value);
      currentMonthEntry.sum += value;
      currentMonthEntry.count++;
    }

    // Create or update current year data
    let currentYearEntry = sensor.yearlyData.find(entry => 
      entry.year === currentYear
    );

    if (!currentYearEntry) {
      currentYearEntry = {
        year: currentYear,
        values: [value],
        sum: value,
        count: 1,
        timestamp: new Date(currentYear, 0, 1)
      };
      sensor.yearlyData.push(currentYearEntry);
    } else {
      currentYearEntry.values.push(value);
      currentYearEntry.sum += value;
      currentYearEntry.count++;
    }

    // Update current values
    sensor.currentIntensity = value;
    sensor.longitude = parseFloat(longitude);
    sensor.latitude = parseFloat(latitude);
    sensor.lastUpdated = now;

    await sensor.save();

    res.status(200).json({
      message: 'Sensor data processed successfully',
      data: {
        currentIntensity: value,
        currentHour: {
          year: currentYear,
          month: currentMonth,
          day: currentDay,
          hour: currentHour,
          readingsCount: currentHourEntry.count,
          currentAverage: currentHourEntry.sum / currentHourEntry.count
        },
        currentDay: {
          year: currentYear,
          month: currentMonth,
          day: currentDay,
          readingsCount: currentDayEntry.count,
          currentAverage: currentDayEntry.sum / currentDayEntry.count
        },
        currentMonth: {
          year: currentYear,
          month: currentMonth,
          readingsCount: currentMonthEntry.count,
          currentAverage: currentMonthEntry.sum / currentMonthEntry.count
        },
        currentYear: {
          year: currentYear,
          readingsCount: currentYearEntry.count,
          currentAverage: currentYearEntry.sum / currentYearEntry.count
        },
        hourly: sensor.hourlyData.slice(-24),
        daily: sensor.dailyData.slice(-31),
        monthly: sensor.monthlyData.slice(-12),
        yearly: sensor.yearlyData.slice(-5)
      }
    });

  } catch (err) {
    console.error('Error processing sensor data:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: err.message 
    });
  }
});

// Get sensor data for visualization
router.get('/:sensorId/values', async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { period } = req.query;
    
    if (!['hourly', 'daily', 'monthly', 'yearly'].includes(period)) {
      return res.status(400).json({ message: 'Invalid period parameter' });
    }

    const sensor = await Sensor.findOne({ sensorId });
    if (!sensor) {
      return res.status(404).json({ message: 'Sensor not found' });
    }

    let data = [];
    switch (period) {
      case 'hourly':
        data = sensor.hourlyData;
        break;
      case 'daily':
        data = sensor.dailyData;
        break;
      case 'monthly':
        data = sensor.monthlyData;
        break;
      case 'yearly':
        data = sensor.yearlyData;
        break;
    }

    res.status(200).json({
      message: 'Data retrieved successfully',
      data,
      currentDate: new Date()
    });

  } catch (err) {
    console.error('Error fetching sensor data:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: err.message 
    });
  }
});


// Update sensor address
router.patch('/:id', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ message: 'Address data is required' });
    }

    const updatedSensor = await Sensor.findByIdAndUpdate(
      req.params.id,
      { $set: { address } },
      { new: true, runValidators: true }
    );

    if (!updatedSensor) {
      return res.status(404).json({ message: 'Sensor not found' });
    }

    res.json(updatedSensor);
  } catch (err) {
    console.error('Error updating sensor:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// Delete sensor
router.delete('/:id', async (req, res) => {
  try {
    await Sensor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sensor deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



// schema code




//next code

const mongoose = require('mongoose');

const HourlyDataSchema = new mongoose.Schema({
  hour: { type: Number, required: true, min: 0, max: 23 },
  averageIntensity: { type: Number, required: true },
  timestamp: { type: Date, required: true }
});

const DailyDataSchema = new mongoose.Schema({
  day: { type: Number, required: true, min: 1, max: 31 },
  hourlyData: [HourlyDataSchema],
  averageIntensity: { type: Number, required: true },
  timestamp: { type: Date, required: true }
});

const MonthlyDataSchema = new mongoose.Schema({
  month: { type: Number, required: true, min: 1, max: 12 },
  dailyData: [DailyDataSchema],
  averageIntensity: { type: Number, required: true },
  timestamp: { type: Date, required: true }
});

const YearlyDataSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  monthlyData: [MonthlyDataSchema],
  averageIntensity: { type: Number, required: true },
  timestamp: { type: Date, required: true }
});

const SensorSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance'],
    default: 'Active'
  },
  currentIntensity: {
    type: Number,
    default: 0 
  },
  address: {
    location: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
  hourlyData: [HourlyDataSchema],
  dailyData: [DailyDataSchema],
  monthlyData: [MonthlyDataSchema],
  yearlyData: [YearlyDataSchema]
}, { collection: 'sensorinfo' });

module.exports = mongoose.model('Sensor', SensorSchema);