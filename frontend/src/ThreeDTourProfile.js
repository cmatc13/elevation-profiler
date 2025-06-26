import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import * as d3 from 'd3';

// 3D Elevation Profile Component
const ElevationMesh = ({ elevationData, hoveredPoint, setHoveredPoint }) => {
    const meshRef = useRef();
    const { camera, raycaster, pointer } = useThree();
    
    const { geometry, materials, climbs, maxElevation, maxDistance } = useMemo(() => {
        if (!elevationData?.profile_data) return { geometry: null, materials: [], climbs: [], maxElevation: 0, maxDistance: 0 };

        const data = elevationData.profile_data;
        const maxElev = d3.max(data, d => d.elevation);
        const maxDist = d3.max(data, d => d.distance);
        
        // Create geometry for the elevation profile
        const segments = data.length - 1;
        const geometry = new THREE.BufferGeometry();
        
        // Create vertices for the 3D profile
        const vertices = [];
        const colors = [];
        const indices = [];
        
        // Scale factors - doubled width for less bunched up appearance
        const xScale = 40; // Scale for distance (doubled from 20)
        const yScale = 0.02; // Scale for elevation
        const zDepth = 2; // Depth of the 3D profile
        
        // Create vertices for top and bottom surfaces
        for (let i = 0; i < data.length; i++) {
            const x = (data[i].distance / maxDist) * xScale - xScale / 2;
            const y = (data[i].elevation / maxElev) * 10;
            const gradient = Math.abs(data[i].gradient || 0);
            
            // Color based on gradient
            let color = new THREE.Color();
            if (gradient > 8) color.setHex(0xFF4444);
            else if (gradient > 5) color.setHex(0xFF8844);
            else if (gradient > 3) color.setHex(0xFFAA44);
            else color.setHex(0x44AA44);
            
            // Top surface vertices
            vertices.push(x, y, zDepth / 2);
            vertices.push(x, y, -zDepth / 2);
            
            // Bottom surface vertices
            vertices.push(x, 0, zDepth / 2);
            vertices.push(x, 0, -zDepth / 2);
            
            // Colors for all vertices
            for (let j = 0; j < 4; j++) {
                colors.push(color.r, color.g, color.b);
            }
        }
        
        // Create faces
        for (let i = 0; i < data.length - 1; i++) {
            const base = i * 4;
            
            // Top face
            indices.push(base, base + 1, base + 4);
            indices.push(base + 1, base + 5, base + 4);
            
            // Bottom face
            indices.push(base + 2, base + 6, base + 3);
            indices.push(base + 3, base + 6, base + 7);
            
            // Front face
            indices.push(base, base + 4, base + 2);
            indices.push(base + 4, base + 6, base + 2);
            
            // Back face
            indices.push(base + 1, base + 3, base + 5);
            indices.push(base + 3, base + 7, base + 5);
            
            // Side faces
            indices.push(base, base + 2, base + 1);
            indices.push(base + 1, base + 2, base + 3);
            
            indices.push(base + 4, base + 5, base + 6);
            indices.push(base + 5, base + 7, base + 6);
        }
        
        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.computeVertexNormals();
        
        // Detect climbs
        const climbs = detectClimbs(data);
        
        return { 
            geometry, 
            materials: [], 
            climbs, 
            maxElevation: maxElev, 
            maxDistance: maxDist 
        };
    }, [elevationData]);

    // Handle mouse interactions
    useFrame((state) => {
        if (!meshRef.current || !elevationData?.profile_data) return;
        
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObject(meshRef.current);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            const normalizedX = (point.x + 20) / 40; // Normalize back to 0-1 (updated for new scale)
            const distance = normalizedX * maxDistance;
            
            // Find closest data point
            const data = elevationData.profile_data;
            const bisect = d3.bisector(d => d.distance).left;
            const index = bisect(data, distance);
            const d0 = data[index - 1];
            const d1 = data[index];
            const d = distance - (d0?.distance || 0) > (d1?.distance || Infinity) - distance ? d1 : d0;
            
            if (d) {
                setHoveredPoint({
                    distance: d.distance,
                    elevation: d.elevation,
                    gradient: d.gradient || 0,
                    position: point
                });
            }
        } else {
            setHoveredPoint(null);
        }
    });

    if (!geometry) return null;

    return (
        <group>
            {/* Main elevation mesh */}
            <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
                <meshPhongMaterial 
                    vertexColors 
                    side={THREE.DoubleSide}
                    shininess={30}
                    specular={0x111111}
                />
            </mesh>
            
            {/* Distance markers */}
            {Array.from({ length: Math.ceil(maxDistance / 5) }, (_, i) => {
                const km = i * 5;
                const x = (km / maxDistance) * 40 - 20;
                return (
                    <group key={km}>
                        <mesh position={[x, -0.5, 0]}>
                            <boxGeometry args={[0.6, 0.4, 0.2]} />
                            <meshBasicMaterial color="#333333" />
                        </mesh>
                        <Text
                            position={[x, -0.8, 0]}
                            fontSize={0.3}
                            color="white"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {Math.round(maxDistance - km)}
                        </Text>
                    </group>
                );
            })}
            
            {/* Elevation markers */}
            {Array.from({ length: 6 }, (_, i) => {
                const elevation = (maxElevation / 5) * i;
                const y = (elevation / maxElevation) * 10;
                return (
                    <Text
                        key={elevation}
                        position={[-22, y, 0]}
                        fontSize={0.25}
                        color="#666666"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {Math.round(elevation)}m
                    </Text>
                );
            })}
            
            {/* Climb markers */}
            {climbs.map((climb, index) => {
                const x = ((climb.startDistance + climb.endDistance) / 2 / maxDistance) * 40 - 20;
                const y = (climb.maxElevation / maxElevation) * 10 + 1;
                const category = getClimbCategory(climb.elevationGain, climb.distance);
                
                return (
                    <group key={index}>
                        {/* Mountain triangle */}
                        <mesh position={[x, y, 0]}>
                            <coneGeometry args={[0.3, 0.6, 3]} />
                            <meshBasicMaterial color="#8B4513" />
                        </mesh>
                        
                        {/* Category text */}
                        <Text
                            position={[x, y + 0.5, 0]}
                            fontSize={0.2}
                            color="#8B4513"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {category}
                        </Text>
                        
                        {/* Climb stats */}
                        <Text
                            position={[x, y - 0.8, 0]}
                            fontSize={0.15}
                            color="#333333"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {climb.distance.toFixed(1)}km at {climb.avgGradient.toFixed(1)}%
                        </Text>
                    </group>
                );
            })}
        </group>
    );
};

// Camera controller for smooth zoom
const CameraController = ({ zoomLevel, setZoomLevel }) => {
    const { camera } = useThree();
    
    useEffect(() => {
        camera.position.set(0, 12, 25);
        camera.lookAt(0, 3, 0);
    }, [camera]);
    
    return null;
};

// Main 3D Tour Profile Component
const ThreeDTourProfile = ({ elevationData }) => {
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    if (!elevationData || !elevationData.profile_data || !Array.isArray(elevationData.profile_data) || elevationData.profile_data.length === 0) {
        return (
            <div className="text-center p-4">
                <p className="text-muted">No elevation data available for 3D visualization</p>
            </div>
        );
    }

    return (
        <div className="position-relative" style={{ height: '600px', width: '100%' }}>
            <Canvas
                camera={{ position: [0, 12, 25], fov: 60 }}
                style={{ background: 'linear-gradient(to bottom, #87CEEB, #f8f9fa)' }}
                gl={{ 
                    antialias: true, 
                    alpha: true, 
                    powerPreference: "high-performance",
                    shadowMap: { enabled: true, type: THREE.PCFSoftShadowMap }
                }}
                dpr={[1, 2]}
            >
                {/* Lighting */}
                <ambientLight intensity={0.6} />
                <directionalLight 
                    position={[10, 10, 5]} 
                    intensity={0.8}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
                
                {/* Controls */}
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={8}
                    maxDistance={60}
                    maxPolarAngle={Math.PI / 2}
                    minPolarAngle={0}
                />
                
                {/* 3D Elevation Profile */}
                <ElevationMesh 
                    elevationData={elevationData}
                    hoveredPoint={hoveredPoint}
                    setHoveredPoint={setHoveredPoint}
                />
                
                {/* Camera Controller */}
                <CameraController zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />
                
                {/* Hover tooltip */}
                {hoveredPoint && (
                    <Html position={[hoveredPoint.position.x, hoveredPoint.position.y + 1, hoveredPoint.position.z]}>
                        <div className="bg-dark text-white p-2 rounded shadow" style={{ fontSize: '12px' }}>
                            <div>Distance: {hoveredPoint.distance.toFixed(1)} km</div>
                            <div>Elevation: {hoveredPoint.elevation.toFixed(0)} m</div>
                            <div>Gradient: {hoveredPoint.gradient.toFixed(1)}%</div>
                        </div>
                    </Html>
                )}
            </Canvas>
            
            {/* Control Panel */}
            <div className="position-absolute top-0 end-0 m-3">
                <div className="card shadow-sm" style={{ width: '200px' }}>
                    <div className="card-body p-2">
                        <h6 className="card-title mb-2">3D Controls</h6>
                        <small className="text-muted">
                            <div><strong>Mouse:</strong> Drag to rotate</div>
                            <div><strong>Wheel:</strong> Zoom in/out</div>
                            <div><strong>Right-click:</strong> Pan view</div>
                            <div><strong>Hover:</strong> View details</div>
                        </small>
                    </div>
                </div>
            </div>
            
            {/* Stage Information */}
            <div className="position-absolute top-0 start-0 m-3">
                <div className="card shadow-sm">
                    <div className="card-body p-2">
                        <h6 className="card-title mb-1">{elevationData.route_name}</h6>
                        <div style={{ fontSize: '12px' }}>
                            <div><strong>{elevationData.statistics.max_elevation}m</strong> max elevation</div>
                            <div><strong>{elevationData.statistics.total_distance}km</strong> total distance</div>
                            <div><strong>{elevationData.statistics.total_elevation_gain}m</strong> elevation gain</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper functions
const detectClimbs = (data) => {
    const climbs = [];
    let currentClimb = null;
    
    for (let i = 1; i < data.length; i++) {
        const gradient = data[i].gradient || 0;
        
        if (gradient > 3 && !currentClimb) {
            currentClimb = {
                startDistance: data[i-1].distance,
                startElevation: data[i-1].elevation,
                maxElevation: data[i].elevation,
                endDistance: data[i].distance,
                endElevation: data[i].elevation
            };
        } else if (currentClimb && gradient > 1) {
            currentClimb.endDistance = data[i].distance;
            currentClimb.endElevation = data[i].elevation;
            currentClimb.maxElevation = Math.max(currentClimb.maxElevation, data[i].elevation);
        } else if (currentClimb && gradient <= 1) {
            currentClimb.distance = currentClimb.endDistance - currentClimb.startDistance;
            currentClimb.elevationGain = currentClimb.maxElevation - currentClimb.startElevation;
            currentClimb.avgGradient = (currentClimb.elevationGain / (currentClimb.distance * 1000)) * 100;
            
            if (currentClimb.distance > 0.5 && currentClimb.elevationGain > 30) {
                climbs.push(currentClimb);
            }
            currentClimb = null;
        }
    }
    
    return climbs;
};

const getClimbCategory = (elevationGain, distance) => {
    const score = elevationGain * distance;
    if (score > 80000) return "HC";
    if (score > 32000) return "1";
    if (score > 16000) return "2";
    if (score > 8000) return "3";
    return "4";
};

export default ThreeDTourProfile;
