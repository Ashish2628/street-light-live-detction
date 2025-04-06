const Sensor = require('./Sensor');
const moment = require('moment');

// Daily cleanup (run at midnight)
async function cleanHourlyData() {
  try {
    const yesterday = moment().subtract(1, 'day').startOf('day').toDate();
    
    await Sensor.updateMany(
      { 'hourlyData.timestamp': { $lt: yesterday } },
      { $set: { hourlyData: [] } }
    );
    
    console.log('Hourly data cleanup completed');
  } catch (err) {
    console.error('Error cleaning hourly data:', err);
  }
}

// Monthly cleanup (run on 1st of each month)
async function cleanDailyData() {
  try {
    const lastMonth = moment().subtract(1, 'month').startOf('month').toDate();
    
    await Sensor.updateMany(
      { 'dailyData.timestamp': { $lt: lastMonth } },
      { $set: { dailyData: [] } }
    );
    
    console.log('Daily data cleanup completed');
  } catch (err) {
    console.error('Error cleaning daily data:', err);
  }
}

// Yearly cleanup (run on January 1st)
async function cleanYearlyData() {
  try {
    const lastYear = moment().subtract(1, 'year').startOf('year').toDate();
    
    await Sensor.updateMany(
      { 'yearlyData.timestamp': { $lt: lastYear } },
      { $set: { yearlyData: [] } }
    );
    
    console.log('Yearly data cleanup completed');
  } catch (err) {
    console.error('Error cleaning yearly data:', err);
  }
}

// Set up scheduled jobs
function setupCleanupJobs() {
  const schedule = require('node-schedule');
  
  // Daily at midnight
  schedule.scheduleJob('0 0 * * *', cleanHourlyData);
  
  // First day of each month at 00:01
  schedule.scheduleJob('1 0 1 * *', cleanDailyData);
  
  // January 1st at 00:02
  schedule.scheduleJob('2 0 1 1 *', cleanYearlyData);
  
  console.log('Data cleanup jobs scheduled');
}

module.exports = {
  cleanHourlyData,
  cleanDailyData,
  cleanYearlyData,
  setupCleanupJobs
};