import requests

def check_lands_api():
    try:
        r = requests.get("http://localhost:8000/lands/")
        print(f"GET /lands/ status: {r.status_code}")
        print(f"GET /lands/ output: {r.json()}")
    except Exception as e:
        print(f"GET /lands/ failed: {e}")

if __name__ == "__main__":
    check_lands_api()
