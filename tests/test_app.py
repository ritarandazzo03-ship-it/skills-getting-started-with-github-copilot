from fastapi.testclient import TestClient
import importlib

import src.app as app_module

client = TestClient(app_module.app)

BASE_ACTIVITIES = {
    "Test Activity": {
        "description": "A test activity",
        "schedule": "Now",
        "max_participants": 5,
        "participants": ["alice@example.com"]
    }
}


def setup_function():
    # Reset the in-memory activities before each test
    app_module.activities.clear()
    app_module.activities.update({k: {**v, 'participants': list(v['participants'])} for k, v in BASE_ACTIVITIES.items()})


def test_get_activities_returns_baseline():
    res = client.get('/activities')
    assert res.status_code == 200
    data = res.json()
    assert 'Test Activity' in data
    assert data['Test Activity']['participants'] == ['alice@example.com']


def test_signup_adds_participant():
    email = 'bob@example.com'
    res = client.post(f"/activities/Test%20Activity/signup?email={email}")
    assert res.status_code == 200
    body = res.json()
    assert 'Signed up' in body.get('message', '')

    # Verify state changed
    res2 = client.get('/activities')
    data = res2.json()
    assert email in data['Test Activity']['participants']


def test_signup_duplicate_returns_400():
    # alice is already signed up in baseline
    res = client.post('/activities/Test%20Activity/signup?email=alice@example.com')
    assert res.status_code == 400


def test_unregister_participant():
    # unregister alice
    res = client.delete('/activities/Test%20Activity/participants?email=alice@example.com')
    assert res.status_code == 200
    body = res.json()
    assert 'Unregistered' in body.get('message', '')

    # verify removed
    res2 = client.get('/activities')
    data = res2.json()
    assert 'alice@example.com' not in data['Test Activity']['participants']


def test_unregister_missing_returns_404():
    res = client.delete('/activities/Test%20Activity/participants?email=charlie@example.com')
    assert res.status_code == 404

