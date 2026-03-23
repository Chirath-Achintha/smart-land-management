import requests

API = "http://localhost:8000"

def diag_register():
    email = "diag_user@example.com"
    data = {
        "full_name": "Diag User",
        "nic_number": "DIAG-NIC-1",
        "role": "seller",
        "address": "Diag Address",
        "email": email,
        "password": "password123",
        "confirm_password": "password123"
    }
    try:
        res = requests.post(f"{API}/auth/register", json=data)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    diag_register()
