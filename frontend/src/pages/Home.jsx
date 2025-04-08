import React, { useState, useEffect } from 'react';
import Sidenav from '../components/Sidenav';
import Navbar from '../components/Navbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

export default function Home() {
  const [sensorId, setSensorId] = useState('');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  const [sensorData, setSensorData] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

 const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';


  useEffect(() => {
    setMapLoaded(true);
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Use template literals with backticks (`) properly
      let url = `${API_BASE}/api/sensors?`;  // CORRECT - using backticks
      
      if (sensorId) {
        url += `sensorId=${encodeURIComponent(sensorId)}`;
      } else if (longitude && latitude) {
        url += `longitude=${encodeURIComponent(longitude)}&latitude=${encodeURIComponent(latitude)}`;
      } else {
        setError('Please enter either Sensor ID or both Latitude and Longitude');
        setLoading(false);
        return;
      }
  
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        // Handle different types of error responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Sensor not found');
        } else {
          const errorText = await response.text();
          throw new Error(errorText || 'Request failed');
        }
      }
  
      const data = await response.json();
      console.log('Received data:', data);
      
      setSensorData({
        ...data,
        intensity: `${data.currentIntensity} lux`
      });
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      setSensorData(null);
    } finally {
      setLoading(false);
    }
  };

  const mapCenter = sensorData 
    ? [sensorData.latitude, sensorData.longitude]
    : [40.7128, -74.0060]; // Default to New York

  return (
    <>
      <Navbar />
      <Box height={30} />
      <Box height={30} />
      <Box sx={{ display: "flex" }}>
        <Sidenav />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          {/* Search Section */}
          <Box sx={{ flexGrow: 1, mb: 4 }}>
            <Grid container spacing={2} alignItems="center">
              
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Sensor ID"
                  variant="outlined"
                  fullWidth
                  value={sensorId}
                  onChange={(e) => setSensorId(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={1} textAlign="center">
                <Typography variant="body1" color="textSecondary">
                  OR
                </Typography>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  label="Longitude"
                  variant="outlined"
                  fullWidth
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  type="number"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  label="Latitude"
                  variant="outlined"
                  fullWidth
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  type="number"
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  onClick={handleSearch}
                  disabled={loading}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </Grid>
            </Grid>
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </Box>

          {/* Sensor Information Grid */}
          <Box sx={{ flexGrow: 1, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Sensor Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {loading ? (
              <Typography>Loading sensor data...</Typography>
            ) : sensorData ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Item elevation={3}>
                    <Typography variant="subtitle1" gutterBottom>
                      Basic Information
                    </Typography>
                    <Grid container spacing={2} textAlign="left">
                      <Grid item xs={6}>
                        <Typography><strong>Sensor ID:</strong></Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography>{sensorData.sensorId}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography><strong>Status:</strong></Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography color={sensorData.status === 'Active' ? 'success.main' : 'error.main'}>
                          {sensorData.status}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography><strong>Current Intensity:</strong></Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography>{sensorData.intensity}</Typography>
                      </Grid>
                    </Grid>
                  </Item>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Item elevation={3}>
                    <Typography variant="subtitle1" gutterBottom>
                      Address Information
                    </Typography>
                    <Grid container spacing={2} textAlign="left">
                      <Grid item xs={6}>
                        <Typography><strong>Street Address:</strong></Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography>{sensorData.address.location}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography><strong>City:</strong></Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography>{sensorData.address.city}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography><strong>State:</strong></Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography>{sensorData.address.state}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography><strong>Country:</strong></Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography>{sensorData.address.country}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography><strong>Pincode:</strong></Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography>{sensorData.address.pincode}</Typography>
                      </Grid>
                    </Grid>
                  </Item>
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body1" color="textSecondary">
                {error || 'No sensor data available. Please search for a sensor.'}
              </Typography>
            )}
          </Box>

          {/* Map Section */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              Sensor Location Map
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Item elevation={3}>
             {mapLoaded && (
                <MapContainer 
                  key={sensorData ? sensorData._id : 'default'} // This forces re-render when sensor changes
                  center={mapCenter} 
                  zoom={sensorData ? 15 : 5} // Zoom level 5 for India view, 15 for sensor view
                  style={{ height: '400px', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {sensorData && (
                    <Marker position={mapCenter}>
                      <Popup>
                        <strong>{sensorData.address.city}, {sensorData.address.state}</strong><br />
                        {sensorData.address.location}<br />
                        Pincode: {sensorData.address.pincode}<br />
                        Status: {sensorData.status}
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              )}
            </Item>
          </Box>
        </Box>
      </Box>
    </>
  );
}
