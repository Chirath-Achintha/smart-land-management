import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_flow():
    print("Testing Forgot Password Flow...\n")
    email = "test@example.com"
    
    # 1. Forgot Password
    print(f"1. Requesting OTP for {email}")
    res = requests.post(f"{BASE_URL}/auth/forgot-password", json={"email": email})
    print("Response:", res.json())
    
    # Wait to see console output for OTP in the server process
    print("Please check the FastAPI server console for the printed OTP if email is not configured.")

if __name__ == "__main__":
    test_flow()
