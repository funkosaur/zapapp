import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSightings } from '../utils/api';
import './SightingsList.css';

/**
 * Displays all pangolin sightings
 */
const SightingsList = () => {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSightings();
  }, []);

  const loadSightings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSightings();
      setSightings(data);
    } catch (err) {
      setError('Failed to load sightings. Please check your connection.');
      console.error('Error loading sightings:', err);
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
        <div className="loading">Loading sightings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sightings-list">
        <div className="error">
          <p>{error}</p>
          <button onClick={loadSightings} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sightings-list">
      <div className="header">
        <h1>Pangolin Sightings</h1>
        <Link to="/new" className="btn-new">
          + New Sighting
        </Link>
      </div>

      {sightings.length === 0 ? (
        <div className="empty-state">
          <p>No sightings recorded yet.</p>
          <Link to="/new" className="btn-primary">
            Record First Sighting
          </Link>
        </div>
      ) : (
        <div className="sightings-grid">
          {sightings.map((sighting) => (
            <div key={sighting.id} className="sighting-card">
              <div className="sighting-image">
                <img
                  src={`https://mb1868.brighton.domains/restServ/zapapp/${sighting.image_path}`}
                  alt="Pangolin sighting"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="sighting-content">
                <div className="sighting-header">
                  {getStatusBadge(sighting.status)}
                  <span className="sighting-date">
                    {formatDate(sighting.created_at)}
                  </span>
                </div>

                {sighting.status === 'dead' && sighting.mortality_type && (
                  <div className="mortality-info">
                    <strong>Cause:</strong> {getMortalityLabel(sighting.mortality_type)}
                  </div>
                )}

                <div className="location-info">
                  <strong>Location:</strong> {parseFloat(sighting.latitude).toFixed(6)}, {parseFloat(sighting.longitude).toFixed(6)}
                </div>

                {sighting.notes && (
                  <div className="sighting-notes">
                    <strong>Notes:</strong> {sighting.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SightingsList;
