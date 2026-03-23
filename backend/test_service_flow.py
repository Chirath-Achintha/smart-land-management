import requests
import json

API = "http://localhost:8000"

def test_service_booking():
    print("--- Starting Service Booking Test ---")
    
    buyer_email = "test_buyer@example.com"
    password = "password123"

    # 1. Login as Buyer (using account from previous test)
    print(f"Logging in as Buyer ({buyer_email})...")
    login_res = requests.post(f"{API}/auth/login", json={"email": buyer_email, "password": password})
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.text}")
        return
    
    buyer_token = login_res.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}", "Content-Type": "application/json"}
    print("Logged in as Buyer.")

    # 2. Submit a Construction Booking
    print("Submitting construction booking...")
    booking_data = {
        "land_id": 1,
        "service_type": "Land Development",
        "preferred_date": "2026-06-15",
        "preferred_time": "09:00 AM",
        "notes": "Verify serialization fix for construction booking."
    }
    booking_res = requests.post(f"{API}/service-bookings/", headers=buyer_headers, json=booking_data)
    
    if booking_res.status_code == 201:
        print("--- SERVICE BOOKING VERIFIED SUCCESSFULLY ---")
        data = booking_res.json()
        print(f"Booking ID: {data['id']}")
        print(f"Status: {data['status']}")
        print(f"Land: {data['land_name']}")
    else:
        print(f"Booking failed with status {booking_res.status_code}: {booking_res.text}")

if __name__ == "__main__":
    test_service_booking()
