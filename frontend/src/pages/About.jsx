import React from 'react';
import Sidenav from '../components/Sidenav';
import Navbar from '../components/Navbar';
import { 
  Box, 
  Typography, 
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import SensorsIcon from '@mui/icons-material/Sensors';  // Corrected icon name
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import StorageIcon from '@mui/icons-material/Storage';
import PublicIcon from '@mui/icons-material/Public';
import CodeIcon from '@mui/icons-material/Code';

const FeatureItem = ({ icon, title, description }) => (
  <ListItem>
    <ListItemIcon>{icon}</ListItemIcon>
    <ListItemText 
      primary={title} 
      secondary={description}
      primaryTypographyProps={{ fontWeight: 'medium' }}
    />
  </ListItem>
);

export default function About() {
    return (
      <>
        <Navbar/>
        <Box height={30} />
        <Box sx={{ display: "flex", minHeight: '100vh' }}>
          <Sidenav/>
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Street Light Monitoring System
              </Typography>
              
              <Typography variant="body1" paragraph>
                Our Smart Street Light Monitoring System is an IoT-based solution designed to 
                efficiently manage and monitor urban street lighting infrastructure.
              </Typography>
            </Paper>

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium' }}>
                    Key Features
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <List>
                    <FeatureItem 
                      icon={<SensorsIcon color="primary" />}  
                      title="Real-time Monitoring"
                      description="Track light status and intensity in real-time"
                    />
                    <FeatureItem 
                      icon={<LocationOnIcon color="primary" />}
                      title="GPS Tracking"
                      description="Precise location mapping of street lights"
                    />
                    
                    <FeatureItem 
                      icon={<StorageIcon color="primary" />}
                      title="Data Analytics"
                      description="Historical data for maintenance"
                    />
                  </List>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium' }}>
                    Technical Stack
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <List>
                    <FeatureItem 
                      icon={<CodeIcon color="secondary" />}
                      title="Frontend"
                      description="React.js with Material-UI"
                    />
                    <FeatureItem 
                      icon={<CodeIcon color="secondary" />}
                      title="Backend"
                      description="Node.js with Express.js"
                    />
                    <FeatureItem 
                      icon={<StorageIcon color="secondary" />}
                      title="Database"
                      description="MongoDB storage"
                    />
                    <FeatureItem 
                      icon={<PublicIcon color="secondary" />}
                      title="IoT Integration"
                      description="ESP8266 microcontrollers"
                    />
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </>
    );
}