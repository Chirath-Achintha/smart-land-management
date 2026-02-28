import requests
import json

API = "http://localhost:8000"

def register_user(email, name, role):
    res = requests.post(f"{API}/auth/register", json={
        "full_name": name,
        "nic_number": email.split('@')[0][:10] + "-NIC",
        "role": role,
        "address": "123 Test St",
        "email": email,
        "password": "password123",
        "confirm_password": "password123"
    })
    return res

def test_visit_management():
    print("--- Starting Visit Management Test ---")
    
    seller_email = "test_seller@example.com"
    buyer_email = "test_buyer@example.com"
    password = "password123"

    # 1. Ensure Seller exists and login
    print(f"Logging in as Seller ({seller_email})...")
    login_res = requests.post(f"{API}/auth/login", json={"email": seller_email, "password": password})
    if login_res.status_code != 200:
        print("Seller login failed, trying to register...")
        reg_res = register_user(seller_email, "Test Seller", "seller")
        if reg_res.status_code != 201:
            print(f"Seller Registration failed: {reg_res.text}")
            return
        login_res = requests.post(f"{API}/auth/login", json={"email": seller_email, "password": password})
    
    seller_token = login_res.json()["access_token"]
    seller_headers = {"Authorization": f"Bearer {seller_token}", "Content-Type": "application/json"}
    print("Logged in as Seller.")

    # 2. Ensure Land exists for Seller
    my_lands = requests.get(f"{API}/lands/my", headers=seller_headers)
    lands = my_lands.json()
    if not lands:
        print("No lands found for seller, creating one...")
        land_data = {
            "name": "Verification Land",
            "district": "Test District",
            "village": "Test Village",
            "perches": 10.0,
            "price_per_perch": 100000.0,
            "land_type": "Residential",
            "status": "Available",
            "road_access": "Good",
            "electricity": True,
            "water": True
        }
        create_res = requests.post(f"{API}/lands/", headers=seller_headers, json=land_data)
        if create_res.status_code != 201:
            print(f"Land creation failed: {create_res.text}")
            return
        land_id = create_res.json()["id"]
        land_name = create_res.json()["name"]
    else:
        land_id = lands[0]["id"]
        land_name = lands[0]["name"]
    print(f"Using Land: {land_name} (ID: {land_id})")

    # 3. Ensure Buyer exists and login
    print(f"Logging in as Buyer ({buyer_email})...")
    login_res = requests.post(f"{API}/auth/login", json={"email": buyer_email, "password": password})
    if login_res.status_code != 200:
        print("Buyer login failed, trying to register...")
        reg_res = register_user(buyer_email, "Test Buyer", "buyer")
        if reg_res.status_code != 201:
            print(f"Buyer Registration failed: {reg_res.text}")
            return
        login_res = requests.post(f"{API}/auth/login", json={"email": buyer_email, "password": password})
    
    buyer_token = login_res.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}", "Content-Type": "application/json"}
    print("Logged in as Buyer.")

    # 4. Submit a visit request as Buyer
    print("Submitting visit request...")
    visit_data = {
        "land_id": land_id,
        "visit_type": "self_visit",
        "visit_date": "2026-05-25",
        "visit_time": "11:00 AM",
        "message": "Protocol Verification Visit"
    }
    visit_res = requests.post(f"{API}/visits/", headers=buyer_headers, json=visit_data)
    if visit_res.status_code not in [201, 409]:
        print(f"Booking failed: {visit_res.text}")
        return
    
    if visit_res.status_code == 409:
        print("Existing pending request found.")
        my_reqs = requests.get(f"{API}/visits/my-requests", headers=buyer_headers)
        visit_id = my_reqs.json()[0]["id"]
    else:
        visit_id = visit_res.json()["id"]
        print(f"Visit request created: ID={visit_id}")

    # 5. Fetch requests as Seller
    print("Seller checking for visit requests...")
    seller_reqs_res = requests.get(f"{API}/visits/my-lands", headers=seller_headers)
    seller_visits = seller_reqs_res.json()
    print(f"Seller sees {len(seller_visits)} visit request(s).")
    
    match = next((v for v in seller_visits if v["id"] == visit_id), None)
    if match:
        print(f"Verification Success! Found Visit ID {visit_id}")
        print(f"Status: {match['status']}, Type: {match['visit_type']}, Buyer: {match['buyer_name']}")
        
        # 6. Accept request
        print("Seller accepting request...")
        update_res = requests.put(f"{API}/visits/{visit_id}/status", headers=seller_headers, json={"status": "Accepted"})
        if update_res.status_code == 200:
            print("--- VISIT FLOW VERIFIED SUCCESSFULLY ---")
        else:
            print(f"Final update failed: {update_res.text}")
    else:
        print(f"Error: Seller did not see visit request {visit_id}")

if __name__ == "__main__":
    test_visit_management()
