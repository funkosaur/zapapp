import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSightings } from '../utils/api';
import { getCachedSightings, cacheSightings, getPendingSightings } from '../utils/db';
import './SightingsList.css';

/**
 * Displays all pangolin sightings
 */
const SightingsList = () => {
  const [sightings, setSightings] = useState([]);
  const [pendingSightings, setPendingSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [imageKey, setImageKey] = useState(Date.now()); // Force image reload

  useEffect(() => {
    loadSightings();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      setImageKey(Date.now()); // Force images to reload when coming back online
      loadSightings();
    };
    const handleOffline = () => {
      setIsOffline(true);
      // When going offline, immediately load cached data
      loadSightings();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array is intentional - only run once on mount

  const loadSightings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load pending sightings
      const pending = await getPendingSightings();
      setPendingSightings(pending);

      if (navigator.onLine) {
        // Online: Fetch from API and cache
        const data = await fetchSightings();
        setSightings(data);
        await cacheSightings(data);
      } else {
        // Offline: Load from cache
        const cached = await getCachedSightings();
        setSightings(cached);
      }
    } catch (err) {
      console.error('Error loading sightings:', err);

      // If API fails, try to load from cache
      try {
        const cached = await getCachedSightings();
        setSightings(cached);
        setError('Showing cached sightings. Unable to fetch latest data.');
      } catch (cacheErr) {
        setError('Failed to load sightings. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    return status === 'alive' ? (
      <span className="status-badge alive">Alive</span>
    ) : (
      <span className="status-badge dead">Dead</span>
    );
  };

  const getMortalityLabel = (type) => {
    const labels = {
      fence_electrocution: 'Fence Electrocution',
      fence_caught: 'Caught in Fence',
      road_death: 'Road Death',
      other: 'Other'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="sightings-list">
        <div className="loading" role="status" aria-live="polite">
          Loading sightings...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sightings-list">
        <div className="error" role="alert" aria-live="assertive">
          <p>{error}</p>
          <button onClick={loadSightings} className="btn-retry" aria-label="Retry loading sightings">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render a sighting card
  const renderSightingCard = (sighting, isPending = false) => (
    <div key={isPending ? `pending-${sighting.id}` : sighting.id} className={`sighting-card ${isPending ? 'pending-card' : ''}`}>
      {isPending && (
        <div className="pending-badge">
          Pending Upload
        </div>
      )}
      <div className="sighting-image">
        {(isPending && sighting.image) || (!isPending && sighting.image_path) ? (
          <img
            key={`${isPending ? `pending-${sighting.id}` : sighting.id}-${imageKey}`}
            src={
              isPending 
                ? (typeof sighting.image === 'string' ? sighting.image : URL.createObjectURL(sighting.image))
                : `https://mb1868.brighton.domains/restServ/zapapp/${sighting.image_path}${isOffline ? '' : `?v=${imageKey}`}`
            }
            alt={`Pangolin sighting - ${sighting.status} at coordinates ${parseFloat(sighting.latitude).toFixed(6)}, ${parseFloat(sighting.longitude).toFixed(6)}${sighting.status === 'dead' && sighting.mortality_type ? `, cause: ${getMortalityLabel(sighting.mortality_type)}` : ''}`}
            onError={(e) => {
              // Only set placeholder if we haven't already, to prevent loops
              if (!e.target.dataset.errored) {
                e.target.dataset.errored = 'true';
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
              }
            }}
          />
        ) : (
          <div className="no-image-placeholder">No Image</div>
        )}
      </div>
      <div className="sighting-content">
        <div className="sighting-header">
          {getStatusBadge(sighting.status)}
          <span className="sighting-date">
            {isPending ? 'Not yet uploaded' : formatDate(sighting.created_at)}
          </span>
        </div>

        {sighting.status === 'dead' && sighting.mortality_type && (
          <div className="mortality-info">
            <strong>Cause:</strong> {getMortalityLabel(sighting.mortality_type)}
          </div>
        )}

        <div className="location-info">
          <strong>Location:</strong> {parseFloat(sighting.latitude).toFixed(6)}, {parseFloat(sighting.longitude).toFixed(6)}
          <br />
          <a
            href={`https://www.google.com/maps?q=${sighting.latitude},${sighting.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="maps-link"
            aria-label={`View location ${parseFloat(sighting.latitude).toFixed(6)}, ${parseFloat(sighting.longitude).toFixed(6)} on Google Maps`}
          >
            View on Google Maps
          </a>
        </div>

        {sighting.notes && (
          <div className="sighting-notes">
            <strong>Notes:</strong> {sighting.notes}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="sightings-list">
      <div className="header">
        <h1>Pangolin Sightings</h1>
        <Link to="/new" className="btn-new">
          + New Sighting
        </Link>
      </div>

      {isOffline && (
        <div className="offline-notice" role="status" aria-live="polite">
          Viewing cached sightings (offline mode)
        </div>
      )}

      {error && (
        <div className="cache-notice" role="status" aria-live="polite">
          {error}
        </div>
      )}

      {pendingSightings.length > 0 && (
        <div className="pending-section">
          <h2>Pending Uploads ({pendingSightings.length})</h2>
          <p className="pending-description">
            These sightings will be uploaded automatically when you're back online.
          </p>
          <div className="sightings-grid">
            {pendingSightings.map((sighting) => renderSightingCard(sighting, true))}
          </div>
        </div>
      )}

      {sightings.length === 0 && pendingSightings.length === 0 ? (
        <div className="empty-state">
          <p>No sightings recorded yet.</p>
          <Link to="/new" className="btn-primary">
            Record First Sighting
          </Link>
        </div>
      ) : sightings.length > 0 ? (
        <>
          <h2 className="section-heading">
            {isOffline ? 'Cached Sightings' : 'All Sightings'}
          </h2>
          <div className="sightings-grid">
            {sightings.map((sighting) => renderSightingCard(sighting, false))}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default SightingsList;
