# test_dev.py
import httpx

response = httpx.post(
    'http://localhost:8000/api/search/coaches/dev',
    json={
        'school_name': 'Duke',
        'sport_name': 'Football'
    },
    timeout=120
)

coaches = response.json()

print(f"✅ Found {len(coaches)} coaches:\n")

# Print school logo (from first coach)
if coaches:
    print(f"🏫 School Logo: {coaches[0].get('school_logo_url', 'N/A')}\n")

for coach in coaches:
    print(f"  - {coach['name']} ({coach['position']})")
    print(f"    Email: {coach.get('email', 'N/A')}")
    print(f"    Phone: {coach.get('phone', 'N/A')}")
    print(f"    Twitter: {coach.get('twitter', 'N/A')}")
    print()
