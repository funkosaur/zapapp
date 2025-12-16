import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SightingsList from './pages/SightingsList';
import NewSighting from './pages/NewSighting';
import OfflineIndicator from './components/OfflineIndicator';
import { getPendingSightings, deletePendingSighting } from './utils/db';
import { createSighting } from './utils/api';
import './App.css';

function App() {
  // Sync pending sightings when coming back online
  useEffect(() => {
    const syncPendingSightings = async () => {
      if (navigator.onLine) {
        try {
          const pendingSightings = await getPendingSightings();

          for (const sighting of pendingSightings) {
            try {
              await createSighting({
                latitude: sighting.latitude,
                longitude: sighting.longitude,
                status: sighting.status,
                mortality_type: sighting.mortality_type,
                notes: sighting.notes,
                image: sighting.image
              });
              await deletePendingSighting(sighting.id);
              console.log('Synced offline sighting:', sighting.id);
            } catch (error) {
              console.error('Failed to sync sighting:', sighting.id, error);
            }
          }
        } catch (error) {
          console.error('Error syncing pending sightings:', error);
        }
      }
    };

    // Sync on mount if online
    syncPendingSightings();

    // Sync when connection is restored
    window.addEventListener('online', syncPendingSightings);

    return () => {
      window.removeEventListener('online', syncPendingSightings);
    };
  }, []);

  return (
    <Router basename="/zapapp">
      <div className="App">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <OfflineIndicator />
        <main id="main-content">
          <Routes>
            <Route path="/" element={<SightingsList />} />
            <Route path="/new" element={<NewSighting />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
