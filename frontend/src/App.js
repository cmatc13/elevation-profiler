import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import InteractiveTourProfile from './InteractiveTourProfile';
import ThreeDTourProfile from './ThreeDTourProfile';

function App() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState('');
    const [elevationData, setElevationData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('static'); // 'static', 'interactive', or '3d'

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        setError('');
        setRoutes([]);
        setElevationData(null);
        setLoading(true);

        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await axios.post('http://localhost:8000/api/kml/routes', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                setRoutes(response.data.routes);
            } catch (err) {
                setError(err.response ? err.response.data.detail : 'An error occurred while processing the file.');
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    };

    const handleRouteChange = (event) => {
        setSelectedRoute(event.target.value);
        setElevationData(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedFile || !selectedRoute) {
            setError('Please select a file and a route.');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('route_name', selectedRoute);

        try {
            const response = await axios.post('http://localhost:8000/api/kml/elevation', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setElevationData(response.data);
            setError('');
        } catch (err) {
            setError(err.response ? err.response.data.detail : 'An error occurred while fetching elevation data.');
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, unit, icon }) => (
        <div className="col-md-3 mb-3">
            <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                    <div className="text-primary mb-2">
                        <i className={`fas ${icon} fa-2x`}></i>
                    </div>
                    <h6 className="card-title text-muted">{title}</h6>
                    <h4 className="card-text text-dark">
                        {value} <small className="text-muted">{unit}</small>
                    </h4>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="row justify-content-center">
                <div className="col-lg-10">
                    <div className="text-center mb-4">
                        <h1 className="display-4 text-primary mb-2">
                            <i className="fas fa-mountain"></i> Elevation Profiler
                        </h1>
                        <p className="lead text-muted">Create Tour de France style elevation profiles from your routes</p>
                    </div>

                    {/* File Upload Section */}
                    <div className="card shadow mb-4">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">
                                <i className="fas fa-upload me-2"></i>Upload Route File
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Select KML file from Google Earth</label>
                                <input 
                                    className="form-control form-control-lg" 
                                    type="file" 
                                    onChange={handleFileChange} 
                                    accept=".kml" 
                                    disabled={loading}
                                />
                                <div className="form-text">
                                    Supports both route paths (LineString) and round-trip areas (Polygon)
                                </div>
                            </div>

                            {loading && (
                                <div className="text-center py-3">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-2 text-muted">Processing your route...</p>
                                </div>
                            )}

                            {routes.length > 0 && !loading && (
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="routeSelect" className="form-label">Select a Route:</label>
                                        <select 
                                            id="routeSelect" 
                                            className="form-select form-select-lg" 
                                            value={selectedRoute} 
                                            onChange={handleRouteChange}
                                        >
                                            <option value="" disabled>--Choose your route--</option>
                                            {routes.map(route => (
                                                <option key={route.name} value={route.name}>
                                                    {route.name} ({route.description})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary btn-lg w-100"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Generating Profile...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-chart-area me-2"></i>
                                                Generate Elevation Profile
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            {error && (
                                <div className="alert alert-danger mt-3">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Section */}
                    {elevationData && (
                        <>
                            {/* Statistics Cards */}
                            <div className="card shadow mb-4">
                                <div className="card-header bg-success text-white">
                                    <h5 className="mb-0">
                                        <i className="fas fa-chart-bar me-2"></i>
                                        Route Statistics - {elevationData.route_name}
                                    </h5>
                                    <small>
                                        Route Type: {elevationData.route_type} | 
                                        Data Source: {elevationData.api_status}
                                    </small>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <StatCard 
                                            title="Total Distance" 
                                            value={elevationData.statistics.total_distance} 
                                            unit="km" 
                                            icon="fa-route"
                                        />
                                        <StatCard 
                                            title="Elevation Gain" 
                                            value={elevationData.statistics.total_elevation_gain} 
                                            unit="m" 
                                            icon="fa-arrow-up"
                                        />
                                        <StatCard 
                                            title="Max Elevation" 
                                            value={elevationData.statistics.max_elevation} 
                                            unit="m" 
                                            icon="fa-mountain"
                                        />
                                        <StatCard 
                                            title="Steepest Climb" 
                                            value={elevationData.statistics.steepest_climb} 
                                            unit="%" 
                                            icon="fa-angle-up"
                                        />
                                    </div>
                                    <div className="row">
                                        <StatCard 
                                            title="Elevation Loss" 
                                            value={elevationData.statistics.total_elevation_loss} 
                                            unit="m" 
                                            icon="fa-arrow-down"
                                        />
                                        <StatCard 
                                            title="Min Elevation" 
                                            value={elevationData.statistics.min_elevation} 
                                            unit="m" 
                                            icon="fa-level-down-alt"
                                        />
                                        <StatCard 
                                            title="Steepest Descent" 
                                            value={elevationData.statistics.steepest_descent} 
                                            unit="%" 
                                            icon="fa-angle-down"
                                        />
                                        <StatCard 
                                            title="Average Gradient" 
                                            value={elevationData.statistics.average_gradient} 
                                            unit="%" 
                                            icon="fa-chart-line"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Elevation Profile with Toggle */}
                            <div className="card shadow mb-4">
                                <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">
                                        <i className="fas fa-chart-area me-2"></i>
                                        Tour de France Style Elevation Profile
                                    </h5>
                                    <div className="btn-group" role="group">
                                        <button 
                                            type="button" 
                                            className={`btn ${viewMode === 'static' ? 'btn-dark' : 'btn-outline-dark'} btn-sm`}
                                            onClick={() => setViewMode('static')}
                                        >
                                            <i className="fas fa-image me-1"></i>
                                            Static View
                                        </button>
                                        <button 
                                            type="button" 
                                            className={`btn ${viewMode === 'interactive' ? 'btn-dark' : 'btn-outline-dark'} btn-sm`}
                                            onClick={() => setViewMode('interactive')}
                                        >
                                            <i className="fas fa-mouse-pointer me-1"></i>
                                            Interactive View
                                        </button>
                                        <button 
                                            type="button" 
                                            className={`btn ${viewMode === '3d' ? 'btn-dark' : 'btn-outline-dark'} btn-sm`}
                                            onClick={() => setViewMode('3d')}
                                        >
                                            <i className="fas fa-cube me-1"></i>
                                            3D View
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body p-0">
                                    {viewMode === 'static' ? (
                                        <img 
                                            src={elevationData.elevation_profile_image} 
                                            alt="Elevation Profile" 
                                            className="img-fluid w-100"
                                            style={{ maxHeight: '600px', objectFit: 'contain' }}
                                        />
                                    ) : viewMode === 'interactive' ? (
                                        <div className="p-3">
                                            <InteractiveTourProfile elevationData={elevationData} />
                                        </div>
                                    ) : (
                                        <div className="p-0">
                                            <ThreeDTourProfile elevationData={elevationData} />
                                        </div>
                                    )}
                                </div>
                                <div className="card-footer text-muted">
                                    <div className="row">
                                        <div className="col-md-3 text-center">
                                            <span className="badge" style={{ backgroundColor: '#44AA44', color: 'white' }}>
                                                Gentle (0-3%)
                                            </span>
                                        </div>
                                        <div className="col-md-3 text-center">
                                            <span className="badge" style={{ backgroundColor: '#FFAA44', color: 'black' }}>
                                                Moderate (3-5%)
                                            </span>
                                        </div>
                                        <div className="col-md-3 text-center">
                                            <span className="badge" style={{ backgroundColor: '#FF8844', color: 'white' }}>
                                                Steep (5-8%)
                                            </span>
                                        </div>
                                        <div className="col-md-3 text-center">
                                            <span className="badge" style={{ backgroundColor: '#FF4444', color: 'white' }}>
                                                Very Steep (&gt;8%)
                                            </span>
                                        </div>
                                    </div>
                                    {viewMode === 'interactive' && (
                                        <div className="text-center mt-2">
                                            <small className="text-info">
                                                <i className="fas fa-info-circle me-1"></i>
                                                <strong>Interactive Features:</strong> Hover for details • Mountain symbols show climb categories • Zoom coming soon
                                            </small>
                                        </div>
                                    )}
                                    {viewMode === '3d' && (
                                        <div className="text-center mt-2">
                                            <small className="text-info">
                                                <i className="fas fa-info-circle me-1"></i>
                                                <strong>3D Features:</strong> Drag to rotate • Mouse wheel to zoom • Right-click to pan • Hover for details
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Add Font Awesome for icons */}
            <link 
                rel="stylesheet" 
                href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
            />
        </div>
    );
}

export default App;
