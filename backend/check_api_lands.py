import requests
import json

def check_api():
    try:
        response = requests.get("http://localhost:8000/lands/")
        with open("api_lands_response.json", "w") as f:
            json.dump(response.json(), f, indent=2)
        print("Response written to api_lands_response.json")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_api()
