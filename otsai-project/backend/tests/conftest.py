"""Shared pytest fixtures for OtsAI backend tests."""
import os
import uuid
import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
load_dotenv("/app/backend/.env", override=False)

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(api_client):
    r = api_client.post(f"{BASE_URL}/api/auth/login",
                        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_user(api_client, admin_token):
    r = api_client.get(f"{BASE_URL}/api/auth/me",
                       headers={"Authorization": f"Bearer {admin_token}"})
    return r.json()


@pytest.fixture(scope="session")
def test_user(api_client):
    """Create a fresh non-admin user via signup."""
    suffix = uuid.uuid4().hex[:8]
    email = f"TEST_user_{suffix}@otsaiqa.io"
    password = "TestPass1234!"
    r = api_client.post(f"{BASE_URL}/api/auth/signup",
                        json={"email": email, "password": password, "name": f"Test {suffix}"})
    assert r.status_code == 200, f"signup failed: {r.status_code} {r.text}"
    body = r.json()
    return {
        "email": email,
        "password": password,
        "token": body["access_token"],
        "user": body["user"],
    }


@pytest.fixture
def auth_headers_admin(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def auth_headers_user(test_user):
    return {"Authorization": f"Bearer {test_user['token']}"}
