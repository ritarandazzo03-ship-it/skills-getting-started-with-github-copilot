import urllib.request, urllib.parse, json

BASE='http://127.0.0.1:8000'

def get_activities():
    with urllib.request.urlopen(BASE + '/activities') as r:
        return json.load(r)

print('Before:')
acts = get_activities()
print('Chess Club participants before:', acts.get('Chess Club', {}).get('participants'))

# signup new participant
activity = 'Chess Club'
email = 'newstudent@mergington.edu'
url = f"{BASE}/activities/{urllib.parse.quote(activity)}/signup?email={urllib.parse.quote(email)}"
req = urllib.request.Request(url, method='POST')
try:
    with urllib.request.urlopen(req) as r:
        resp = json.load(r)
    print('Signup response:', resp)
except urllib.error.HTTPError as e:
    body = e.read().decode('utf-8', errors='replace')
    print('Signup error:', e.code, body)

acts2 = get_activities()
print('After:')
print('Chess Club participants after:', acts2.get('Chess Club', {}).get('participants'))

