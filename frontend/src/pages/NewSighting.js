import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { createSighting } from '../utils/api';
import { savePendingSighting } from '../utils/db';
import './NewSighting.css';

/**
 * Recording a new pangolin sighting
 */
const NewSighting = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    status: 'alive',
    mortality_type: '',
    notes: '',
    image: null
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Automatically get GPS location on component mount
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setGpsLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setGpsLoading(false);
      },
      (error) => {
        setError(`GPS Error: ${error.message}. Please enter coordinates manually.`);
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleImageCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Compress image for better performance
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };

      const compressedFile = await imageCompression(file, options);

      setFormData(prev => ({ ...prev, image: compressedFile }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      setError('Failed to process image. Please try again.');
      console.error('Image compression error:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear mortality_type if status changes to alive
    if (name === 'status' && value === 'alive') {
      setFormData(prev => ({ ...prev, mortality_type: '' }));
    }
  };

  const validateForm = () => {
    if (!formData.latitude || !formData.longitude) {
      setError('GPS coordinates are required');
      return false;
    }

    if (!formData.image) {
      setError('Photo is required');
      return false;
    }

    if (formData.status === 'dead' && !formData.mortality_type) {
      setError('Please select cause of death');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Check if online
      if (navigator.onLine) {
        // Try to upload directly
        await createSighting(formData);
        setSuccess('Sighting recorded successfully!');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        // Save to IndexedDB for later sync
        await savePendingSighting(formData);
        setSuccess('Saved offline! Will sync when connection is restored.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting sighting:', error);

      // If upload fails, save offline
      try {
        await savePendingSighting(formData);
        setSuccess('Saved offline! Will sync when connection is restored.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (dbError) {
        setError('Failed to save sighting. Please try again.');
        console.error('IndexedDB error:', dbError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-sighting">
      <div className="form-container">
        <h1>Record New Sighting</h1>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* GPS Coordinates */}
          <div className="form-section">
            <h3>Location</h3>
            <div className="gps-group">
              <div className="form-group">
                <label htmlFor="latitude">Latitude *</label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  required
                  disabled={gpsLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="longitude">Longitude *</label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  required
                  disabled={gpsLoading}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={getLocation}
              className="btn-secondary"
              disabled={gpsLoading}
            >
              {gpsLoading ? 'Getting location...' : 'Refresh GPS'}
            </button>
          </div>

          {/* Photo Capture */}
          <div className="form-section">
            <h3>Photo *</h3>
            <div className="photo-capture">
              {preview ? (
                <div className="preview-container">
                  <img src={preview} alt="Preview" className="image-preview" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="btn-change-photo"
                  >
                    Change Photo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="btn-capture"
                >
                  📷 Take Photo
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Status */}
          <div className="form-section">
            <h3>Pangolin Status *</h3>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="status"
                  value="alive"
                  checked={formData.status === 'alive'}
                  onChange={handleInputChange}
                />
                <span className="radio-text">Alive</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="status"
                  value="dead"
                  checked={formData.status === 'dead'}
                  onChange={handleInputChange}
                />
                <span className="radio-text">Dead</span>
              </label>
            </div>
          </div>

          {/* Mortality Type (only if dead) */}
          {formData.status === 'dead' && (
            <div className="form-section">
              <h3>Cause of Death *</h3>
              <select
                name="mortality_type"
                value={formData.mortality_type}
                onChange={handleInputChange}
                required
                className="form-select"
              >
                <option value="">Select cause...</option>
                <option value="fence_electrocution">Fence Electrocution</option>
                <option value="fence_caught">Caught in Fence</option>
                <option value="road_death">Road Death</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div className="form-section">
            <h3>Additional Notes</h3>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any additional observations..."
              rows="4"
              className="form-textarea"
            />
          </div>

          {/* Submit Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Sighting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSighting;
