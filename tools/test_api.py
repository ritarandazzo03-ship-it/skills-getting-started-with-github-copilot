import urllib.request, urllib.parse, json

def get_activities():
    with urllib.request.urlopen('http://127.0.0.1:8000/activities') as r:
        return json.load(r)

print('Fetching activities...')
acts = get_activities()
print('Activities:', list(acts.keys())[:10])
print("Chess Club participants before:", acts.get('Chess Club', {}).get('participants'))

# Build DELETE URL safely
activity = 'Chess Club'
email = 'michael@mergington.edu'
url = f"http://127.0.0.1:8000/activities/{urllib.parse.quote(activity)}/participants?email={urllib.parse.quote(email)}"
req = urllib.request.Request(url, method='DELETE')
try:
    with urllib.request.urlopen(req) as r:
        resp = json.load(r)
    print('DELETE response:', resp)
except urllib.error.HTTPError as e:
    body = e.read().decode('utf-8', errors='replace')
    print('DELETE error:', e.code, body)

acts2 = get_activities()
print('Chess Club participants after:', acts2.get('Chess Club', {}).get('participants'))

