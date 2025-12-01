import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_endpoint(path):
    print(f"Testing {path}...")
    try:
        response = requests.get(f"{BASE_URL}{path}")
        if response.status_code == 200:
            print("SUCCESS")
            try:
                data = response.json()
                print(json.dumps(data, indent=2)[:500] + "...") # Print first 500 chars
            except:
                print("Response not JSON")
        else:
            print(f"FAILED: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"ERROR: {e}")
    print("-" * 20)

if __name__ == "__main__":
    test_endpoint("/demand/kpis")
    test_endpoint("/demand/trend")
    test_endpoint("/demand/sector")
    test_endpoint("/demand/region")
