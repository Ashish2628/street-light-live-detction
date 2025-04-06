import React, { useState, useEffect } from 'react';
import Sidenav from '../components/Sidenav';
import Navbar from '../components/Navbar';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  IconButton,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function Sensors() {
  const [sensors, setSensors] = useState({
    active: [],
    inactive: [],
    maintenance: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSensors();
  }, []);

  const fetchSensors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/sensors/all');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      if (!Array.isArray(data)) {
        throw new Error('Expected array but got ' + typeof data);
      }

      // Categorize sensors by status with null checks
      const categorized = {
        active: data.filter(s => s?.status === 'Active'),
        inactive: data.filter(s => s?.status === 'Inactive'),
        maintenance: data.filter(s => s?.status === 'Maintenance')
      };
      
      setSensors(categorized);
    } catch (error) {
      console.error('Error fetching sensors:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sensorId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/sensors/${sensorId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete sensor');
      }
      
      fetchSensors(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting sensor:', error);
      setError(error.message);
    }
  };

  const StatusChip = ({ status }) => {
    const color = status === 'Active' ? 'success' : 
                 status === 'Inactive' ? 'error' : 'warning';
    return <Chip label={status} color={color} size="small" />;
  };

  const SensorTable = ({ title, sensors }) => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        {title} Sensors ({sensors.length})
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sensor ID</TableCell>
              <TableCell>Longitude</TableCell>
              <TableCell>Latitude</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sensors.map((sensor) => (
              <TableRow key={sensor._id || sensor.sensorId}>
                <TableCell>{sensor.sensorId}</TableCell>
                <TableCell>{sensor.longitude}</TableCell>
                <TableCell>{sensor.latitude}</TableCell>
                <TableCell>{sensor.address?.city || 'N/A'}</TableCell>
                <TableCell>
                  <StatusChip status={sensor.status} />
                </TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => handleDelete(sensor._id || sensor.sensorId)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <>
      <Navbar />
      <Box height={30} />
      <Box sx={{ display: "flex" }}>
        <Sidenav />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
               Sensor Management
        </Typography>
          
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}
          
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              <SensorTable title="Active" sensors={sensors.active} />
              <SensorTable title="Inactive" sensors={sensors.inactive} />
              <SensorTable title="Maintenance" sensors={sensors.maintenance} />
            </>
          )}
        </Box>
      </Box>
    </>
  );
}