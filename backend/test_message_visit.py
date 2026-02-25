import requests

API = "http://localhost:8000"

def test_visit_with_message():
    print("--- Testing Visit Request with Message ---")
    
    # 1. Login as Buyer
    login_res = requests.post(f"{API}/auth/login", json={"email": "test_buyer@example.com", "password": "password123"})
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.text}")
        return
    
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Book a visit with a message
    visit_data = {
        "land_id": 1, # Assuming land_id 1 exists
        "visit_type": "agent_visit",
        "visit_date": "2026-03-01",
        "visit_time": "14:30",
        "message": "I would like to see the soil quality."
    }
    
    res = requests.post(f"{API}/visits/", headers=headers, json=visit_data)
    
    if res.status_code == 201:
        data = res.json()
        print(f"Success! Visit ID: {data['id']}")
        print(f"Message in response: {data.get('message')}")
        if data.get('message') == visit_data['message']:
            print("--- VERIFIED: Message successfully stored and returned ---")
        else:
            print("--- FAILED: Message mismatch in response ---")
    elif res.status_code == 409:
        print("Conflict: A pending request already exists for this type. This is expected if run multiple times.")
    else:
        print(f"Failed with status {res.status_code}: {res.text}")

if __name__ == "__main__":
    test_visit_with_message()
