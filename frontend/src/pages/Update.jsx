import React, { useState, useEffect, useRef } from 'react';
import Sidenav from '../components/Sidenav';
import Navbar from '../components/Navbar';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Paper, 
  Alert,
  Container,
  Divider,
  CircularProgress,
  Snackbar,
  IconButton,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LocationOnIcon from '@mui/icons-material/LocationOn';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const FormPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
}));

const LocationPicker = ({ position, setPosition, setSnackbarOpen, setSnackbarMessage }) => {
  const [userPosition, setUserPosition] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef(null);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setSnackbarMessage("Geolocation is not supported by your browser");
      setSnackbarOpen(true);
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPos = [pos.coords.latitude, pos.coords.longitude];
        setUserPosition(userPos);
        setPosition(userPos);
        if (mapRef.current) {
          mapRef.current.flyTo(userPos, 15);
        }
        setIsLocating(false);
      },
      (err) => {
        setSnackbarMessage(`Error getting location: ${err.message}`);
        setSnackbarOpen(true);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const newPosition = [e.latlng.lat, e.latlng.lng];
        setPosition(newPosition);
      },
    });
    return null;
  };

  return (
    <Box sx={{ position: 'relative', height: '300px', mb: 2 }}>
      <MapContainer 
        center={position || [0, 0]} 
        zoom={position ? 15 : 2} 
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {position && (
          <Marker position={position}>
            <Popup>Selected Location</Popup>
          </Marker>
        )}
        {userPosition && (
          <Marker position={userPosition}>
            <Popup>Your Current Location</Popup>
          </Marker>
        )}
        <MapClickHandler />
      </MapContainer>
      
      <Tooltip title="Use my current location">
        <IconButton
          onClick={handleLocateMe}
          disabled={isLocating}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            backgroundColor: 'white',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          {isLocating ? <CircularProgress size={24} /> : <MyLocationIcon color="primary" />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default function Update() {
  const [sensorId, setSensorId] = useState('');
  const [address, setAddress] = useState({
    location: '',
    city: '',
    state: '',
    country: '',
    pincode: ''
  });
  const [coordinates, setCoordinates] = useState([0, 0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentSensor, setCurrentSensor] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showMap, setShowMap] = useState(false);

  const API_BASE = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000' 
    : '';

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const response = await fetch(`${API_BASE}/api/sensors?sensorId=${sensorId}`);
      
      if (!response.ok) {
        throw new Error('Sensor not found');
      }

      const data = await response.json();
      setCurrentSensor(data);
      setAddress(data.address || {
        location: '',
        city: '',
        state: '',
        country: '',
        pincode: ''
      });
      setCoordinates([data.latitude, data.longitude]);
    } catch (err) {
      setError(err.message);
      setCurrentSensor(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    const index = name === 'latitude' ? 0 : 1;
    setCoordinates(prev => {
      const newCoords = [...prev];
      newCoords[index] = parseFloat(value) || 0;
      return newCoords;
    });
  };

  const handleMapPositionChange = (position) => {
    setCoordinates(position);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const response = await fetch(`${API_BASE}/api/sensors/${currentSensor._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          address,
          latitude: coordinates[0],
          longitude: coordinates[1]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update failed');
      }

      setSnackbarMessage('Sensor updated successfully!');
      setSnackbarOpen(true);
      setSensorId('');
      setAddress({
        location: '',
        city: '',
        state: '',
        country: '',
        pincode: ''
      });
      setCoordinates([0, 0]);
      setCurrentSensor(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Navbar />
      <Box height={30} />
      <Box sx={{ display: "flex", minHeight: '100vh' }}>
        <Sidenav />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Container maxWidth="lg">
            <Box height={30} />
            <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
              Update Sensor Information
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <FormPaper elevation={3}>
              {/* Sensor ID Search Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Find Sensor
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="Enter Sensor ID"
                      value={sensorId}
                      onChange={(e) => setSensorId(e.target.value)}
                      margin="normal"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth 
                      onClick={handleSearch}
                      disabled={loading || !sensorId}
                      sx={{ height: '56px' }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Find Sensor'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {currentSensor && (
                <>
                  <Divider sx={{ my: 3 }} />
                  
                  {/* Current Information Display */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Current Information
                    </Typography>
                    <Typography>
                      <strong>Sensor ID:</strong> {currentSensor.sensorId}
                    </Typography>
                    <Typography>
                      <strong>Current Coordinates:</strong> {currentSensor.latitude}, {currentSensor.longitude}
                    </Typography>
                    <Typography>
                      <strong>Current Address:</strong> {currentSensor.address?.location || 'Not set'}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Update Form */}
                  <Box component="form" onSubmit={handleSubmit}>
                    <Typography variant="h6" gutterBottom>
                      Update Information
                    </Typography>
                    
                    {/* Address Section */}
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                      Address
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Street Address"
                          name="location"
                          value={address.location}
                          onChange={handleAddressChange}
                          margin="normal"
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="City"
                          name="city"
                          value={address.city}
                          onChange={handleAddressChange}
                          margin="normal"
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="State"
                          name="state"
                          value={address.state}
                          onChange={handleAddressChange}
                          margin="normal"
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Country"
                          name="country"
                          value={address.country}
                          onChange={handleAddressChange}
                          margin="normal"
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Pincode"
                          name="pincode"
                          value={address.pincode}
                          onChange={handleAddressChange}
                          margin="normal"
                          required
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>

                    {/* Coordinates Section */}
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 4 }}>
                      Geographic Coordinates
                    </Typography>
                    
                    {/* Always show coordinate fields */}
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Latitude"
                          name="latitude"
                          type="number"
                          value={coordinates[0].toFixed(6)}
                          onChange={handleCoordinateChange}
                          margin="normal"
                          required
                          variant="outlined"
                          inputProps={{ 
                            step: "0.000001",
                            min: -90,
                            max: 90
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Longitude"
                          name="longitude"
                          type="number"
                          value={coordinates[1].toFixed(6)}
                          onChange={handleCoordinateChange}
                          margin="normal"
                          required
                          variant="outlined"
                          inputProps={{ 
                            step: "0.000001",
                            min: -180,
                            max: 180
                          }}
                        />
                      </Grid>
                    </Grid>

                    {/* Map Section */}
                    {showMap ? (
                      <>
                        <LocationPicker 
                          position={coordinates}
                          setPosition={handleMapPositionChange}
                          setSnackbarOpen={setSnackbarOpen}
                          setSnackbarMessage={setSnackbarMessage}
                        />
                        <Button 
                          onClick={() => setShowMap(false)}
                          variant="outlined"
                          sx={{ mb: 2 }}
                        >
                          Hide Map
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => setShowMap(true)}
                        variant="outlined"
                        startIcon={<LocationOnIcon />}
                        sx={{ mt: 1 }}
                      >
                        Show Map
                      </Button>
                    )}

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                        size="large"
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Update Sensor'}
                      </Button>
                    </Box>
                  </Box>
                </>
              )}
            </FormPaper>
          </Container>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

//update sensor

   <Box sx={{ mb: 4 }}>
                  <Typography 
                    variant="h4" 
                    gutterBottom 
                    sx={{ 
                      mb: 4,
                      fontWeight: 'bold',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      color: 'primary.main'
                    }}
                  >
                    ADD SENSOR
                  </Typography>
                </Box>