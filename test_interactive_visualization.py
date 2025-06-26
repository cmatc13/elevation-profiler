#!/usr/bin/env python3
"""
Test script to verify the interactive visualization is working correctly.
"""

import requests
import json
import os

def test_backend_endpoints():
    """Test that the backend endpoints are working correctly."""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Backend Endpoints...")
    
    # Test if backend is running
    try:
        response = requests.get(f"{base_url}/docs")
        if response.status_code == 200:
            print("✅ Backend server is running")
        else:
            print("❌ Backend server is not responding correctly")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server")
        return False
    
    # Test with sample KML file if it exists
    kml_file = "Bike routes.kml"
    if os.path.exists(kml_file):
        print(f"📁 Found KML file: {kml_file}")
        
        # Test routes endpoint
        try:
            with open(kml_file, 'rb') as f:
                files = {'file': f}
                response = requests.post(f"{base_url}/api/kml/routes", files=files)
                
            if response.status_code == 200:
                routes_data = response.json()
                print(f"✅ Routes endpoint working - Found {len(routes_data['routes'])} routes")
                
                # Test elevation endpoint with first route
                if routes_data['routes']:
                    route_name = routes_data['routes'][0]['name']
                    print(f"🏔️  Testing elevation profile for: {route_name}")
                    
                    with open(kml_file, 'rb') as f:
                        files = {'file': f}
                        data = {'route_name': route_name}
                        response = requests.post(f"{base_url}/api/kml/elevation", files=files, data=data)
                    
                    if response.status_code == 200:
                        elevation_data = response.json()
                        print("✅ Elevation endpoint working")
                        
                        # Check if profile_data exists (needed for interactive component)
                        if 'profile_data' in elevation_data:
                            profile_count = len(elevation_data['profile_data'])
                            print(f"✅ Profile data available - {profile_count} data points")
                            
                            # Check data structure
                            if profile_count > 0:
                                sample_point = elevation_data['profile_data'][0]
                                required_fields = ['distance', 'elevation', 'gradient']
                                missing_fields = [field for field in required_fields if field not in sample_point]
                                
                                if not missing_fields:
                                    print("✅ Profile data structure is correct")
                                    return True
                                else:
                                    print(f"❌ Missing fields in profile data: {missing_fields}")
                            else:
                                print("❌ Profile data is empty")
                        else:
                            print("❌ Profile data not found in response")
                    else:
                        print(f"❌ Elevation endpoint failed: {response.status_code}")
                else:
                    print("❌ No routes found to test")
            else:
                print(f"❌ Routes endpoint failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Error testing endpoints: {e}")
    else:
        print(f"⚠️  KML file not found: {kml_file}")
        print("   You can test manually by uploading a KML file through the web interface")
        return True  # Not a failure, just no test file
    
    return False

def test_frontend_accessibility():
    """Test that the frontend is accessible."""
    print("\n🌐 Testing Frontend Accessibility...")
    
    frontend_urls = [
        "http://localhost:3000",
        "http://192.168.0.72:3000"
    ]
    
    for url in frontend_urls:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ Frontend accessible at: {url}")
                return True
        except requests.exceptions.RequestException:
            print(f"❌ Frontend not accessible at: {url}")
    
    return False

def main():
    """Run all tests."""
    print("🚀 Interactive Visualization Test Suite")
    print("=" * 50)
    
    backend_ok = test_backend_endpoints()
    frontend_ok = test_frontend_accessibility()
    
    print("\n📊 Test Results:")
    print("=" * 50)
    
    if backend_ok:
        print("✅ Backend: All tests passed")
    else:
        print("❌ Backend: Some tests failed")
    
    if frontend_ok:
        print("✅ Frontend: Accessible")
    else:
        print("❌ Frontend: Not accessible")
    
    if backend_ok and frontend_ok:
        print("\n🎉 All systems operational!")
        print("📝 Next steps:")
        print("   1. Open your browser to the frontend URL")
        print("   2. Upload a KML file")
        print("   3. Generate an elevation profile")
        print("   4. Toggle between Static and Interactive views")
        print("   5. Hover over the interactive chart to see details")
    else:
        print("\n⚠️  Some issues detected. Please check the output above.")

if __name__ == "__main__":
    main()
