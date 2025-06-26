import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThreeDTourProfile from './ThreeDTourProfile';

// Mock Three.js and React Three Fiber
jest.mock('@react-three/fiber', () => ({
    Canvas: ({ children }) => <div data-testid="three-canvas">{children}</div>,
    useFrame: () => {},
    useThree: () => ({
        camera: { position: { set: jest.fn() }, lookAt: jest.fn() },
        raycaster: { setFromCamera: jest.fn(), intersectObject: jest.fn(() => []) },
        pointer: {}
    })
}));

jest.mock('@react-three/drei', () => ({
    OrbitControls: () => <div data-testid="orbit-controls" />,
    Text: ({ children }) => <div data-testid="three-text">{children}</div>,
    Html: ({ children }) => <div data-testid="three-html">{children}</div>
}));

jest.mock('three', () => ({
    BufferGeometry: jest.fn(() => ({
        setIndex: jest.fn(),
        setAttribute: jest.fn(),
        computeVertexNormals: jest.fn()
    })),
    Float32BufferAttribute: jest.fn(),
    Color: jest.fn(() => ({
        setHex: jest.fn(),
        r: 1,
        g: 1,
        b: 1
    })),
    DoubleSide: 'DoubleSide'
}));

const mockElevationData = {
    route_name: 'Test Route',
    statistics: {
        max_elevation: 1000,
        total_distance: 50,
        total_elevation_gain: 500
    },
    profile_data: [
        { distance: 0, elevation: 100, gradient: 2 },
        { distance: 10, elevation: 200, gradient: 4 },
        { distance: 20, elevation: 300, gradient: 6 },
        { distance: 30, elevation: 400, gradient: 8 },
        { distance: 40, elevation: 500, gradient: 3 },
        { distance: 50, elevation: 600, gradient: 1 }
    ]
};

describe('ThreeDTourProfile', () => {
    test('renders without crashing with valid data', () => {
        render(<ThreeDTourProfile elevationData={mockElevationData} />);
        expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
    });

    test('displays route information', () => {
        render(<ThreeDTourProfile elevationData={mockElevationData} />);
        expect(screen.getByText('Test Route')).toBeInTheDocument();
        expect(screen.getByText('1000m')).toBeInTheDocument();
        expect(screen.getByText('50km')).toBeInTheDocument();
        expect(screen.getByText('500m')).toBeInTheDocument();
    });

    test('displays 3D controls information', () => {
        render(<ThreeDTourProfile elevationData={mockElevationData} />);
        expect(screen.getByText('3D Controls')).toBeInTheDocument();
        expect(screen.getByText(/Drag to rotate/)).toBeInTheDocument();
        expect(screen.getByText(/Wheel.*Zoom/)).toBeInTheDocument();
        expect(screen.getByText(/Right-click.*Pan/)).toBeInTheDocument();
    });

    test('renders orbit controls', () => {
        render(<ThreeDTourProfile elevationData={mockElevationData} />);
        expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
    });

    test('handles missing elevation data gracefully', () => {
        render(<ThreeDTourProfile elevationData={null} />);
        expect(screen.getByText('No elevation data available for 3D visualization')).toBeInTheDocument();
    });

    test('handles empty profile data', () => {
        const emptyData = {
            ...mockElevationData,
            profile_data: []
        };
        render(<ThreeDTourProfile elevationData={emptyData} />);
        expect(screen.getByText('No elevation data available for 3D visualization')).toBeInTheDocument();
    });

    test('handles invalid profile data', () => {
        const invalidData = {
            ...mockElevationData,
            profile_data: null
        };
        render(<ThreeDTourProfile elevationData={invalidData} />);
        expect(screen.getByText('No elevation data available for 3D visualization')).toBeInTheDocument();
    });
});
