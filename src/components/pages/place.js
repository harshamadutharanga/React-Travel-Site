import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import { Button, Card, Form } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { database, storage } from '../../firebase';  // Import the Firebase database instance
import './place.css';

const libraries = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '800px',
};
const center = {
  lat: 6.364039977799532,  // Default center location
  lng: 80.40625906382867
};

function Place() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: 'AIzaSyBHZJjA4WH--aPUGgf3nLc5HSAUBzhrdY4',
    libraries,
  });

  const [markers, setMarkers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    topic: '',
    description: '',
    image: null,
    selectedLocation: '',  // New field for selected location
  });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [map, setMap] = useState(null); // State to store map instance
  const formRef = useRef(null);  // Ref for the form container
  const mapRef = useRef(null);  // Ref for the Google Map container

  useEffect(() => {
    // Fetch markers from Firebase Realtime Database
    const markersRef = database.ref('map');
    markersRef.on('value', (snapshot) => {
      const data = snapshot.val();
      const fetchedMarkers = data ? Object.values(data) : [];
      setMarkers(fetchedMarkers);
    });

    return () => {
      markersRef.off();  // Detach the listener when the component unmounts
    };
  }, []);

  useEffect(() => {
    // Handle clicks outside the form and details card
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target) && !mapRef.current.contains(event.target)) {
        handleCloseForm();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const onMapClick = useCallback((event) => {
    if (!showForm) return; // Prevent form display if it's already hidden

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setFormData({
      ...formData,
      location: `${lat}, ${lng}`,
      selectedLocation: `Latitude: ${lat}, Longitude: ${lng}`,  // Update selected location
    });
  }, [showForm, formData]);

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'image' ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.topic || !formData.description || !formData.image) return;
  
    // Create a storage reference
    const storageRef = storage.ref();
    const imageRef = storageRef.child(`images/${uuidv4()}`);
  
    // Upload the image to Firebase Storage
    const snapshot = await imageRef.put(formData.image);
    const downloadURL = await snapshot.ref.getDownloadURL();
  
    const newMarker = {
      id: uuidv4(),
      location: formData.location,
      topic: formData.topic,
      description: formData.description,
      image: downloadURL,
      position: {
        lat: parseFloat(formData.location.split(',')[0]),
        lng: parseFloat(formData.location.split(',')[1]),
      },
    };
  
    // Save marker to Firebase Realtime Database
    database.ref('map').push(newMarker);
  
    setFormData({
      location: '',
      topic: '',
      description: '',
      image: null,
      selectedLocation: '',  // Reset selected location
    });
    setShowForm(false);
    setSelectedMarker(null); // Close the details card
  };

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    setShowForm(false);  // Hide the form when a marker is clicked
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData({
      location: '',
      topic: '',
      description: '',
      image: null,
      selectedLocation: '',  // Reset selected location
    });
    setSelectedMarker(null); // Close the details card
  };

  const handleToggleForm = () => {
    if (showForm) {
      handleCloseForm();
    } else {
      setShowForm(true);
    }
  };

 const handleNavigate = () => {
  if (selectedMarker) {
    const { lat, lng } = selectedMarker.position;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          window.location.href = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${lat},${lng}`;
        },
        () => {
          alert('Unable to retrieve your location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }
};


  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div style={{ position: 'relative' }} ref={mapRef}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={10}
        onClick={onMapClick}
        onLoad={(mapInstance) => setMap(mapInstance)} // Store the map instance
      >
        {markers.map(marker => (
          <Marker
            key={marker.id}
            position={marker.position}
            title={marker.topic}
            onClick={() => handleMarkerClick(marker)}
          >
            {selectedMarker && selectedMarker.id === marker.id && (
              <InfoWindow
                position={marker.position}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="info-window-card">
                  <Card>
                    <Card.Body>
                      <Card.Title className='maker-tropic'>{marker.topic}</Card.Title>
                      <p>{marker.description}</p>
                      <img src={marker.image} alt={marker.topic} />
                      <Button 
                        variant="primary" 
                        onClick={handleNavigate}
                        className="navigate-button btn-sm"
                      >
                        Navigate
                      </Button>
                    </Card.Body>
                  </Card>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}
      </GoogleMap>

      {showForm && (
        <div className="map-form-container" ref={formRef}>
          <Card style={{ width: '18rem' }}>
            <Card.Body>
              <Card.Title className='title'>Add New Marker</Card.Title>
              <Button 
                variant="danger" 
                className="close-button" 
                onClick={handleCloseForm}
              >
                X
              </Button>
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="formSelectedLocation">
                  <Form.Label>Selected Location</Form.Label>
                  <Form.Control
                    type="text"
                    name="selectedLocation"
                    value={formData.selectedLocation}
                    readOnly  // This field is read-only
                  />
                </Form.Group>
                <Form.Group controlId="formTopic">
                  <Form.Label>Topic</Form.Label>
                  <Form.Control
                    type="text"
                    name="topic"
                    value={formData.topic}
                    onChange={handleFormChange}
                    placeholder="Enter topic"
                  />
                </Form.Group>
                <Form.Group controlId="formDescription">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Enter description"
                  />
                </Form.Group>
                <Form.Group controlId="formImage">
                  <Form.Label>Upload Image</Form.Label>
                  <Form.Control
                    type="file"
                    name="image"
                    onChange={handleFormChange}
                  />
                </Form.Group>
                <Button 
                    variant="primary" 
                    type="submit"
                    className="btn-small"  // Add the small button class here
                >
                    Submit
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </div>
      )}

      <Button 
        className={`map-toggle-button ${showForm ? 'minus' : 'plus'}`} 
        onClick={handleToggleForm}
      >
        {showForm ? '−' : '+'}
      </Button>
    </div>
  );
}

export default Place;
