import React, { useState, useRef, useEffect } from 'react';
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
  Snackbar,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import CloseIcon from '@mui/icons-material/Close';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Default location with 6 decimal places precision
const DEFAULT_LOCATION = {
  latitude: 28.704059,
  longitude: 77.102490
};

const FormPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
  transition: 'box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[6]
  }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

const LocationPicker = ({ 
  onLocationSelect, 
  initialPosition,
  setSnackbarMessage,
  setSnackbarOpen
}) => {
  const [position, setPosition] = useState(initialPosition || [DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude]);
  const [userPosition, setUserPosition] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);

  // Clean up geolocation watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Set default location when component mounts
  useEffect(() => {
    if (!initialPosition) {
      onLocationSelect({
        latitude: DEFAULT_LOCATION.latitude,
        longitude: DEFAULT_LOCATION.longitude
      });
    }
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setSnackbarMessage("Your browser doesn't support geolocation. Try Chrome or Firefox.");
      setSnackbarOpen(true);
      return;
    }

    setIsLocating(true);
    setSnackbarMessage("");
    setSnackbarOpen(false);

    const showPosition = (pos) => {
      const accuracy = pos.coords.accuracy;
      const userPos = [
        parseFloat(pos.coords.latitude.toFixed(6)),
        parseFloat(pos.coords.longitude.toFixed(6))
      ];
      
      if (accuracy > 1000) {
        setSnackbarMessage(`Weak signal (accuracy: ${Math.round(accuracy)}m). Try moving to an open area.`);
        setSnackbarOpen(true);
        return;
      }

      setUserPosition(userPos);
      setPosition(userPos);
      onLocationSelect({
        latitude: userPos[0],
        longitude: userPos[1],
        accuracy: accuracy
      });

      if (mapRef.current) {
        const zoomLevel = accuracy < 50 ? 16 : accuracy < 200 ? 15 : 14;
        mapRef.current.flyTo(userPos, zoomLevel, {
          animate: true,
          duration: 1
        });
      }
      
      setIsLocating(false);
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };

    const handleError = (err) => {
      let errorMsg = "";
      switch(err.code) {
        case 1: // PERMISSION_DENIED
          errorMsg = "Location access denied. Please check browser permissions";
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMsg = "Can't detect location. Please enable GPS/WiFi";
          break;
        case 3: // TIMEOUT
          errorMsg = "Taking too long to get location. Try moving to an area with better signal.";
          break;
        default:
          errorMsg = `Location error: ${err.message}`;
      }

      setSnackbarMessage(errorMsg);
      setSnackbarOpen(true);
      setIsLocating(false);
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      showPosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const MapClickHandler = () => {
    const map = useMapEvents({
      click(e) {
        const newPos = [
          parseFloat(e.latlng.lat.toFixed(6)),
          parseFloat(e.latlng.lng.toFixed(6))
        ];
        setPosition(newPos);
        onLocationSelect({
          latitude: newPos[0],
          longitude: newPos[1]
        });
      }
    });
    return null;
  };

  return (
    <Box sx={{ position: 'relative', height: '300px' }}>
      <MapContainer 
        center={position} 
        zoom={13}
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

export default function AddSensor() {
  const [formData, setFormData] = useState({
    sensorId: '',
    address: {
      location: '',
      city: '',
      state: '',
      country: '',
      pincode: ''
    },
    latitude: DEFAULT_LOCATION.latitude.toString(),
    longitude: DEFAULT_LOCATION.longitude.toString()
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showMap, setShowMap] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCoordinateBlur = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        [name]: numValue.toFixed(6)
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      sensorId: '',
      address: {
        location: '',
        city: '',
        state: '',
        country: '',
        pincode: ''
      },
      latitude: DEFAULT_LOCATION.latitude.toString(),
      longitude: DEFAULT_LOCATION.longitude.toString()
    });
  };

  const handleMapSelection = (coordinates) => {
    setFormData(prev => ({
      ...prev,
      latitude: coordinates.latitude.toFixed(6),
      longitude: coordinates.longitude.toFixed(6)
    }));
  };

  const getInitialMapPosition = () => {
    if (formData.latitude && formData.longitude) {
      return [
        parseFloat(formData.latitude),
        parseFloat(formData.longitude)
      ];
    }
    return [DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);
  
    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        intensity: 100,
        status: 'Active'
      };

      const checkResponse = await fetch(`${API_BASE}/api/sensors?sensorId=${encodeURIComponent(formData.sensorId)}`);
      
      if (checkResponse.ok) {
        const existingSensor = await checkResponse.json();
        if (existingSensor) {
          throw new Error('Sensor ID already exists!');
        }
      }

      const response = await fetch(`${API_BASE}/api/sensors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create sensor');
      }

      setSuccess(true);
      resetForm();
      setSnackbarMessage('Sensor created successfully!');
      setSnackbarOpen(true);
    } catch (err) {
      setError(err.message);
      setSnackbarMessage(err.message);
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Navbar />
      <Box sx={{ display: "flex", minHeight: '100vh' }}>
        <Sidenav />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
              <AddCircleOutlineIcon fontSize="large" /> Add New Sensor
            </Typography>
            
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Sensor created successfully!
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <FormPaper elevation={3}>
              <form onSubmit={handleSubmit}>
                
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
                                
                <Box sx={{ mb: 4 }}>
                  <SectionTitle variant="h6">
                    Basic Information
                  </SectionTitle>
                  <TextField
                    fullWidth
                    label="Sensor ID"
                    name="sensorId"
                    value={formData.sensorId}
                    onChange={handleChange}
                    margin="normal"
                    required
                    variant="outlined"
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mb: 4 }}>
                  <SectionTitle variant="h6">
                    Location Information
                  </SectionTitle>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Street Address"
                        name="address.location"
                        value={formData.address.location}
                        onChange={handleChange}
                        margin="normal"
                        required
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="City"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleChange}
                        margin="normal"
                        required
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="State"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleChange}
                        margin="normal"
                        required
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Country"
                        name="address.country"
                        value={formData.address.country}
                        onChange={handleChange}
                        margin="normal"
                        required
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Pincode"
                        name="address.pincode"
                        value={formData.address.pincode}
                        onChange={handleChange}
                        margin="normal"
                        required
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mb: 4 }}>
                  <SectionTitle variant="h6">
                    <LocationOnIcon /> Geographic Coordinates
                  </SectionTitle>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Latitude"
                        name="latitude"
                        type="number"
                        value={formData.latitude}
                        onChange={handleChange}
                        onBlur={handleCoordinateBlur}
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
                        value={formData.longitude}
                        onChange={handleChange}
                        onBlur={handleCoordinateBlur}
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

                  {showMap ? (
                    <>
                      <LocationPicker 
                        onLocationSelect={handleMapSelection} 
                        initialPosition={getInitialMapPosition()}
                        setSnackbarMessage={setSnackbarMessage}
                        setSnackbarOpen={setSnackbarOpen}
                      />
                      <Button 
                        onClick={() => setShowMap(false)}
                        variant="outlined"
                        startIcon={<CloseIcon />}
                        sx={{ mt: 2 }}
                      >
                        Close Map
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => setShowMap(true)}
                      variant="outlined"
                      startIcon={<MapIcon />}
                      sx={{ mt: 2 }}
                    >
                      Select from Map
                    </Button>
                  )}
                </Box>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    size="large"
                    disabled={isSubmitting}
                    startIcon={<AddCircleOutlineIcon />}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Sensor'}
                  </Button>
                </Box>
              </form>
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
        <Alert onClose={handleSnackbarClose} severity={success ? "success" : "error"}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
