import React, { useState, useEffect } from 'react';
import Sidenav from '../components/Sidenav';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Navbar from '../components/Navbar';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function Report() {
  const [sensorId, setSensorId] = useState('');
  const [period, setPeriod] = useState('hourly');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedChart, setSelectedChart] = useState('line');

  const fetchReportData = async () => {
    if (!sensorId) {
      setError('Please enter a Sensor ID');
      return;
    }
    
    setLoading(true);
    setError('');
    try {

      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await fetch(`${API_BASE}//api/sensors/${sensorId}/values?period=${period}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with status ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.data || result.data.length === 0) {
        setError('No data available for this sensor and time period');
        setChartData([]);
        return;
      }

      const processedData = processSensorData(result.data, period, result.currentDate);
      setChartData(processedData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch sensor data');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const processSensorData = (data, periodType, currentDate) => {
    const now = new Date(currentDate);
    let allTimeUnits = [];
    let dataMap = {};

    if (periodType === 'hourly') {
      // For current day's hours (0-23)
      for (let hour = 0; hour < 24; hour++) {
        allTimeUnits.push({
          name: `${hour.toString().padStart(2, '0')}:00`,
          hour,
          value: null,
          hasData: false,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate()
        });
      }
      
      data.forEach(item => {
        const key = `${item.year}-${item.month}-${item.day}-${item.hour}`;
        // Calculate average from sum and count
        const avgValue = item.sum / item.count;
        dataMap[key] = {
          name: `${item.hour.toString().padStart(2, '0')}:00`,
          value: avgValue,
          hasData: true,
          timestamp: item.timestamp,
          year: item.year,
          month: item.month,
          day: item.day,
          hour: item.hour,
          rawValues: item.values // Include raw values for tooltip
        };
      });
    } 
    else if (periodType === 'daily') {
      // For current month's days
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        allTimeUnits.push({
          name: `Day ${day}`,
          day,
          value: null,
          hasData: false,
          year: now.getFullYear(),
          month: now.getMonth() + 1
        });
      }
      
      data.forEach(item => {
        const key = `${item.year}-${item.month}-${item.day}`;
        const avgValue = item.sum / item.count;
        dataMap[key] = {
          name: `Day ${item.day}`,
          value: avgValue,
          hasData: true,
          timestamp: item.timestamp,
          year: item.year,
          month: item.month,
          day: item.day,
          rawValues: item.values
        };
      });
    } 
    else if (periodType === 'monthly') {
      // For current year's months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let month = 1; month <= 12; month++) {
        allTimeUnits.push({
          name: monthNames[month - 1],
          month,
          value: null,
          hasData: false,
          year: now.getFullYear()
        });
      }
      
      data.forEach(item => {
        const key = `${item.year}-${item.month}`;
        const avgValue = item.sum / item.count;
        dataMap[key] = {
          name: monthNames[item.month - 1],
          value: avgValue,
          hasData: true,
          timestamp: item.timestamp,
          year: item.year,
          month: item.month,
          rawValues: item.values
        };
      });
    }
    else if (periodType === 'yearly') {
      // For all available years
      const years = [...new Set(data.map(item => item.year))].sort();
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      
      for (let year = minYear; year <= maxYear; year++) {
        allTimeUnits.push({
          name: year.toString(),
          year,
          value: null,
          hasData: false
        });
      }
      
      data.forEach(item => {
        const avgValue = item.sum / item.count;
        dataMap[item.year] = {
          name: item.year.toString(),
          value: avgValue,
          hasData: true,
          timestamp: item.timestamp,
          year: item.year,
          rawValues: item.values
        };
      });
    }

    return allTimeUnits.map(unit => {
      let key;
      if (periodType === 'hourly') {
        key = `${unit.year}-${unit.month}-${unit.day}-${unit.hour}`;
      } else if (periodType === 'daily') {
        key = `${unit.year}-${unit.month}-${unit.day}`;
      } else if (periodType === 'monthly') {
        key = `${unit.year}-${unit.month}`;
      } else {
        key = unit.year;
      }
      return dataMap[key] || unit;
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{ 
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p><strong>{label}</strong></p>
          {data.hasData ? (
            <>
              <p>Average: {data.value.toFixed(2)} lux</p>
              {data.rawValues && (
                <>
                  <p>Readings: {data.rawValues.length}</p>
                  <p>Min: {Math.min(...data.rawValues).toFixed(2)} lux</p>
                  <p>Max: {Math.max(...data.rawValues).toFixed(2)} lux</p>
                </>
              )}
              {data.timestamp && (
                <p>Date: {new Date(data.timestamp).toLocaleString()}</p>
              )}
            </>
          ) : (
            <p>No data available</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomizedAxisTick = ({ x, y, payload }) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="end" 
          fill="#666"
          transform="rotate(-35)"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <>
      <Navbar />
      <Box height={30} />
      <Box sx={{ display: "flex" }}>
        <Sidenav />
        <Box component="main" sx={{ flexGrow: 4, p: 8 }}>
          <Typography variant="h4" gutterBottom>Street Light Monitoring Report</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center' }}>
            <TextField
              label="Sensor ID"
              variant="outlined"
              value={sensorId}
              onChange={(e) => setSensorId(e.target.value)}
              fullWidth
              error={!!error}
              helperText={error}
            />
            
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={period}
                label="Time Period"
                onChange={(e) => setPeriod(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="hourly">Hourly (0-23)</MenuItem>
                <MenuItem value="daily">Daily (1-31)</MenuItem>
                <MenuItem value="monthly">Monthly (1-12)</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={selectedChart}
                label="Chart Type"
                onChange={(e) => setSelectedChart(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
              </Select>
            </FormControl>
            
            <Button 
              variant="contained" 
              onClick={fetchReportData}
              disabled={loading || !sensorId}
              sx={{ height: 56 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Generate Report'}
            </Button>
          </Box>

          {error && (
            <Box sx={{ backgroundColor: '#ffebee', color: '#d32f2f', p: 2, mb: 2, borderRadius: 1 }}>
              {error}
            </Box>
          )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading data...</Typography>
            </Box>
          )}

          {!loading && chartData.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                {`Light Intensity - ${
                  period === 'hourly' ? 'Today (24 Hours)' : 
                  period === 'daily' ? `Current Month (${new Date().toLocaleString('default', { month: 'long' })}) Days` :
                  period === 'monthly' ? 'Current Year (Months)' :
                  'All Years'
                }`}
                <Typography component="span" variant="body2" sx={{ ml: 2 }}>
                  (Showing {chartData.filter(d => d.hasData).length} data points)
                </Typography>
              </Typography>
              
              <Box sx={{ 
                height: 500, 
                mt: 2,
                border: '1px solid #eee',
                borderRadius: 2,
                p: 2,
                backgroundColor: '#fff'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  {selectedChart === 'line' ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis 
                        dataKey="name" 
                        tick={<CustomizedAxisTick />}
                        interval={0}
                        height={60}
                      />
                      <YAxis 
                        label={{ 
                          value: 'Intensity (lux)', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fill: '#666' }
                        }} 
                        domain={[0, 'dataMax + 10']}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2 }} 
                        name="Light Intensity"
                        connectNulls={true}
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis 
                        dataKey="name" 
                        tick={<CustomizedAxisTick />}
                        interval={0}
                        height={60}
                      />
                      <YAxis 
                        label={{ 
                          value: 'Intensity (lux)', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fill: '#666' }
                        }} 
                        domain={[0, 'dataMax + 10']}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        fill="#8884d8" 
                        name="Light Intensity"
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </Box>

              {chartData.filter(d => d.hasData).length > 0 && (
                <Box sx={{ mt: 4, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>Summary Statistics</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body1">
                        <strong>Average:</strong> {(
                          chartData
                            .filter(d => d.hasData)
                            .reduce((sum, d) => sum + d.value, 0) / 
                          chartData.filter(d => d.hasData).length
                        ).toFixed(2)} lux
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body1">
                        <strong>Max:</strong> {Math.max(
                          ...chartData
                            .filter(d => d.hasData)
                            .map(d => d.value)
                        ).toFixed(2)} lux
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body1">
                        <strong>Min:</strong> {Math.min(
                          ...chartData
                            .filter(d => d.hasData)
                            .map(d => d.value)
                        ).toFixed(2)} lux
                      </Typography>
                    </Grid>
                    {/* <Grid item xs={6} md={3}>
                      <Typography variant="body1">
                        <strong>Data Points:</strong> {chartData.filter(d => d.hasData).length}
                      </Typography>
                    </Grid> */}
                  </Grid>
                </Box>
              )}
            </>
          )}

          {!loading && chartData.length === 0 && !error && (
            <Typography variant="body1" color="textSecondary" sx={{ mt: 4, textAlign: 'center' }}>
              Enter a sensor ID and select time period to generate a report
            </Typography>
          )}
        </Box>
      </Box>
    </>
  );
}
