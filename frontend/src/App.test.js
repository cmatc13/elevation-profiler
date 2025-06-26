import { render, screen } from '@testing-library/react';

// Mock axios to avoid import issues
jest.mock('axios', () => ({
  post: jest.fn(() => Promise.resolve({ data: {} }))
}));

// Mock the InteractiveTourProfile component
jest.mock('./InteractiveTourProfile', () => {
  return function MockInteractiveTourProfile() {
    return <div data-testid="interactive-tour-profile">Interactive Tour Profile</div>;
  };
});

import App from './App';

test('renders elevation profiler heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Elevation Profiler/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders file upload section', () => {
  render(<App />);
  const uploadText = screen.getByText(/Upload Route File/i);
  expect(uploadText).toBeInTheDocument();
});
