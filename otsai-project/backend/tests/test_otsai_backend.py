"""Comprehensive backend API tests for OtsAI."""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]


def _no_object_id(obj):
    """Recursively check no '_id' key exists in response."""
    if isinstance(obj, dict):
        assert "_id" not in obj, f"MongoDB _id leaked in: {list(obj.keys())}"
        for v in obj.values():
            _no_object_id(v)
    elif isinstance(obj, list):
        for v in obj:
            _no_object_id(v)


# ===== Health =====
class TestHealth:
    def test_root_metadata(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        data = r.json()
        assert data["app"] == "OtsAI"
        assert data["status"] == "ok"
        assert "version" in data


# ===== Auth: signup / login / me / logout =====
class TestAuth:
    def test_signup_creates_user_with_100_credits_and_ledger(self, api_client):
        suffix = uuid.uuid4().hex[:8]
        email = f"TEST_signup_{suffix}@otsaiqa.io"
        r = api_client.post(f"{BASE_URL}/api/auth/signup",
                            json={"email": email, "password": "TestPass1234!", "name": f"Sign {suffix}"})
        assert r.status_code == 200, r.text
        body = r.json()
        _no_object_id(body)
        assert body["token_type"] == "bearer"
        assert isinstance(body["access_token"], str) and len(body["access_token"]) > 20
        u = body["user"]
        assert u["email"] == email.lower()
        assert u["role"] == "user"
        assert u["credits"] == 100
        assert u["auth_provider"] == "password"
        # ledger entry verification via /credits/me
        cr = api_client.get(f"{BASE_URL}/api/credits/me",
                            headers={"Authorization": f"Bearer {body['access_token']}"})
        assert cr.status_code == 200
        cdata = cr.json()
        _no_object_id(cdata)
        assert cdata["balance"] == 100
        types = [t["type"] for t in cdata["transactions"]]
        assert "signup_bonus" in types
        bonus = next(t for t in cdata["transactions"] if t["type"] == "signup_bonus")
        assert bonus["amount"] == 100
        assert bonus["balance_after"] == 100

    def test_signup_duplicate_email_409(self, api_client, test_user):
        r = api_client.post(f"{BASE_URL}/api/auth/signup",
                            json={"email": test_user["email"], "password": "TestPass1234!", "name": "dup"})
        assert r.status_code == 409

    def test_admin_login_success(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/auth/login",
                            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        body = r.json()
        _no_object_id(body)
        u = body["user"]
        assert u["email"] == ADMIN_EMAIL
        assert u["role"] == "admin"
        assert u["credits"] >= 10000 - 100  # may be slightly less if previous tests ran

    def test_login_invalid_password(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/auth/login",
                            json={"email": ADMIN_EMAIL, "password": "WRONG"})
        assert r.status_code == 401

    def test_login_unknown_email(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/auth/login",
                            json={"email": "nobody_xyz@otsaiqa.io", "password": "whatever1"})
        assert r.status_code == 401

    def test_me_returns_profile(self, api_client, test_user, auth_headers_user):
        r = api_client.get(f"{BASE_URL}/api/auth/me", headers=auth_headers_user)
        assert r.status_code == 200
        data = r.json()
        _no_object_id(data)
        assert data["email"] == test_user["email"].lower()
        assert data["role"] == "user"
        assert "password_hash" not in data

    def test_me_without_token_401(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_logout_clears_cookie(self, api_client, auth_headers_user):
        r = api_client.post(f"{BASE_URL}/api/auth/logout", headers=auth_headers_user)
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ===== Generation models registry =====
class TestModels:
    def test_list_models(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/generate/models")
        assert r.status_code == 200
        data = r.json()
        ids = {m["id"] for m in data["models"]}
        assert "gpt-5.2" in ids
        assert "claude-sonnet-4-5-20250929" in ids
        assert "gemini-3.1-pro-preview" in ids
        for m in data["models"]:
            assert "credits" in m and m["credits"] > 0
            assert "provider" in m
            assert "label" in m


# ===== Generation actual LLM call =====
class TestGenerate:
    def test_generate_gpt52_success_deducts_credits(self, api_client, test_user, auth_headers_user):
        # Capture pre balance
        me1 = api_client.get(f"{BASE_URL}/api/auth/me", headers=auth_headers_user).json()
        pre = me1["credits"]

        r = api_client.post(
            f"{BASE_URL}/api/generate",
            headers=auth_headers_user,
            json={"prompt": "Say hello in 3 words", "model": "gpt-5.2"},
            timeout=120,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        _no_object_id(data)
        gen = data["generation"]
        assert gen["status"] == "success", f"LLM failed: {gen.get('error')}"
        assert isinstance(gen["output"], str) and len(gen["output"]) > 0
        assert gen["model"] == "gpt-5.2"
        assert gen["credits_used"] == 5

        # post balance
        me2 = api_client.get(f"{BASE_URL}/api/auth/me", headers=auth_headers_user).json()
        assert me2["credits"] == pre - 5
        assert data["balance"] == pre - 5

        # ledger entry
        cr = api_client.get(f"{BASE_URL}/api/credits/me", headers=auth_headers_user).json()
        gen_txns = [t for t in cr["transactions"] if t["type"] == "generation"]
        assert len(gen_txns) >= 1
        latest = gen_txns[0]
        assert latest["amount"] == -5
        assert latest["balance_after"] == me2["credits"]
        assert latest["reference_id"] == gen["generation_id"]

    def test_generate_unknown_model_400(self, api_client, auth_headers_user):
        r = api_client.post(f"{BASE_URL}/api/generate", headers=auth_headers_user,
                            json={"prompt": "hi", "model": "fake-model"})
        assert r.status_code == 400

    def test_generate_insufficient_credits_402(self, api_client, admin_token):
        # Create a fresh user, drain credits via admin deduct
        suffix = uuid.uuid4().hex[:8]
        email = f"TEST_drain_{suffix}@otsaiqa.io"
        signup = api_client.post(f"{BASE_URL}/api/auth/signup",
                                 json={"email": email, "password": "TestPass1234!", "name": "Drain"}).json()
        uid = signup["user"]["user_id"]
        # admin deduct all credits
        adj = api_client.post(f"{BASE_URL}/api/admin/credits/adjust",
                              headers={"Authorization": f"Bearer {admin_token}"},
                              json={"target_user_id": uid, "amount": 100,
                                    "adjustment_type": "deduct", "reason": "TEST drain"})
        assert adj.status_code == 200
        # try generate
        r = api_client.post(f"{BASE_URL}/api/generate",
                            headers={"Authorization": f"Bearer {signup['access_token']}"},
                            json={"prompt": "hi", "model": "gpt-5.2"})
        assert r.status_code == 402


# ===== Projects CRUD =====
class TestProjects:
    def test_full_project_lifecycle(self, api_client, auth_headers_user):
        # create
        r = api_client.post(f"{BASE_URL}/api/projects", headers=auth_headers_user,
                            json={"title": "TEST Project", "description": "desc"})
        assert r.status_code == 200, r.text
        proj = r.json()["project"]
        _no_object_id(r.json())
        pid = proj["project_id"]
        assert proj["title"] == "TEST Project"

        # list
        lst = api_client.get(f"{BASE_URL}/api/projects", headers=auth_headers_user).json()
        assert any(p["project_id"] == pid for p in lst["projects"])

        # get
        g = api_client.get(f"{BASE_URL}/api/projects/{pid}", headers=auth_headers_user).json()
        assert g["project"]["project_id"] == pid
        assert "generations" in g

        # patch
        u = api_client.patch(f"{BASE_URL}/api/projects/{pid}", headers=auth_headers_user,
                             json={"title": "TEST Updated"}).json()
        assert u["project"]["title"] == "TEST Updated"

        # generation increments project.generation_count
        pre_count = u["project"]["generation_count"]
        gen = api_client.post(f"{BASE_URL}/api/generate", headers=auth_headers_user,
                              json={"prompt": "Reply OK", "model": "gpt-5.2", "project_id": pid},
                              timeout=120)
        assert gen.status_code == 200
        if gen.json()["generation"]["status"] == "success":
            after = api_client.get(f"{BASE_URL}/api/projects/{pid}", headers=auth_headers_user).json()
            assert after["project"]["generation_count"] == pre_count + 1
            assert len(after["generations"]) >= 1

        # delete
        d = api_client.delete(f"{BASE_URL}/api/projects/{pid}", headers=auth_headers_user)
        assert d.status_code == 200
        # verify gone
        g2 = api_client.get(f"{BASE_URL}/api/projects/{pid}", headers=auth_headers_user)
        assert g2.status_code == 404

    def test_get_nonexistent_project_404(self, api_client, auth_headers_user):
        r = api_client.get(f"{BASE_URL}/api/projects/proj_doesnotexist", headers=auth_headers_user)
        assert r.status_code == 404


# ===== Credits =====
class TestCredits:
    def test_credits_me_balance_and_transactions(self, api_client, auth_headers_user):
        r = api_client.get(f"{BASE_URL}/api/credits/me", headers=auth_headers_user)
        assert r.status_code == 200
        data = r.json()
        _no_object_id(data)
        assert "balance" in data and isinstance(data["balance"], int)
        assert isinstance(data["transactions"], list)


# ===== Admin =====
class TestAdmin:
    def test_admin_stats(self, api_client, auth_headers_admin):
        r = api_client.get(f"{BASE_URL}/api/admin/stats", headers=auth_headers_admin)
        assert r.status_code == 200
        d = r.json()
        for k in ("users", "projects", "generations", "successful_generations",
                  "total_credits_in_circulation"):
            assert k in d
            assert isinstance(d[k], int)

    def test_admin_list_users_search(self, api_client, auth_headers_admin, test_user):
        r = api_client.get(f"{BASE_URL}/api/admin/users",
                           headers=auth_headers_admin,
                           params={"q": test_user["email"].lower()})
        assert r.status_code == 200
        users = r.json()["users"]
        _no_object_id(r.json())
        assert any(u["email"] == test_user["email"].lower() for u in users)
        for u in users:
            assert "password_hash" not in u

    def test_admin_get_user_detail(self, api_client, auth_headers_admin, test_user):
        uid = test_user["user"]["user_id"]
        r = api_client.get(f"{BASE_URL}/api/admin/users/{uid}", headers=auth_headers_admin)
        assert r.status_code == 200
        d = r.json()
        _no_object_id(d)
        assert d["user"]["user_id"] == uid
        assert isinstance(d["transactions"], list)
        assert isinstance(d["projects"], list)

    @pytest.mark.parametrize("adj_type,amount,sign_expected", [
        ("add", 50, +1),
        ("deduct", 10, -1),
        ("promo", 25, +1),
        ("correction", -7, -1),
        ("test", 5, +1),
    ])
    def test_credit_adjustments_all_types(self, api_client, auth_headers_admin, admin_token, adj_type, amount, sign_expected):
        # fresh user for each
        suffix = uuid.uuid4().hex[:8]
        email = f"TEST_adj_{adj_type}_{suffix}@otsaiqa.io"
        s = api_client.post(f"{BASE_URL}/api/auth/signup",
                            json={"email": email, "password": "TestPass1234!", "name": "adj"}).json()
        uid = s["user"]["user_id"]
        pre = s["user"]["credits"]  # 100

        r = api_client.post(f"{BASE_URL}/api/admin/credits/adjust",
                            headers=auth_headers_admin,
                            json={"target_user_id": uid, "amount": amount,
                                  "adjustment_type": adj_type,
                                  "reason": f"TEST {adj_type} reason",
                                  "note": "automated test"})
        assert r.status_code == 200, r.text
        body = r.json()
        applied = body["amount_applied"]
        new_bal = body["balance_after"]

        # verify direction
        if sign_expected > 0:
            assert applied > 0
        else:
            assert applied < 0

        # verify user balance
        u = api_client.get(f"{BASE_URL}/api/admin/users/{uid}", headers=auth_headers_admin).json()
        assert u["user"]["credits"] == new_bal
        # txn entry
        txns = u["transactions"]
        latest = txns[0]
        assert latest["type"] == "admin_adjust"
        assert latest["balance_after"] == new_bal
        assert latest["amount"] == applied
        # audit log: search recent
        audit = api_client.get(f"{BASE_URL}/api/admin/audit", headers=auth_headers_admin,
                               params={"limit": 50}).json()["logs"]
        related = [a for a in audit if a["action"] == "admin.credit_adjust"
                   and a.get("target_id") == uid]
        assert related, "no audit log for credit adjustment"
        assert "reason" in related[0]["metadata"]

    def test_admin_can_adjust_own_credits(self, api_client, auth_headers_admin, admin_user):
        uid = admin_user["user_id"]
        pre = admin_user["credits"]
        r = api_client.post(f"{BASE_URL}/api/admin/credits/adjust",
                            headers=auth_headers_admin,
                            json={"target_user_id": uid, "amount": 1,
                                  "adjustment_type": "test",
                                  "reason": "TEST self-adjust"})
        assert r.status_code == 200
        assert r.json()["balance_after"] == pre + 1

    def test_non_admin_cannot_adjust(self, api_client, auth_headers_user, test_user):
        r = api_client.post(f"{BASE_URL}/api/admin/credits/adjust",
                            headers=auth_headers_user,
                            json={"target_user_id": test_user["user"]["user_id"],
                                  "amount": 10, "adjustment_type": "add",
                                  "reason": "should fail"})
        assert r.status_code == 403

    def test_admin_audit_listing(self, api_client, auth_headers_admin):
        r = api_client.get(f"{BASE_URL}/api/admin/audit", headers=auth_headers_admin)
        assert r.status_code == 200
        logs = r.json()["logs"]
        _no_object_id(r.json())
        actions = {l["action"] for l in logs}
        # should see at least some of the recorded actions across tests
        assert any(a in actions for a in ("user.signup", "user.login", "admin.credit_adjust"))

    def test_admin_role_change(self, api_client, auth_headers_admin):
        # create temp user then promote
        suffix = uuid.uuid4().hex[:8]
        email = f"TEST_promote_{suffix}@otsaiqa.io"
        s = api_client.post(f"{BASE_URL}/api/auth/signup",
                            json={"email": email, "password": "TestPass1234!", "name": "p"}).json()
        uid = s["user"]["user_id"]
        r = api_client.patch(f"{BASE_URL}/api/admin/users/{uid}/role",
                             headers=auth_headers_admin, params={"role": "admin"})
        assert r.status_code == 200
        assert r.json()["role"] == "admin"
        # verify in DB via list
        u = api_client.get(f"{BASE_URL}/api/admin/users/{uid}", headers=auth_headers_admin).json()
        assert u["user"]["role"] == "admin"
        # audit
        audit = api_client.get(f"{BASE_URL}/api/admin/audit", headers=auth_headers_admin).json()["logs"]
        assert any(l["action"] == "admin.role_change" and l.get("target_id") == uid for l in audit)

    def test_admin_projects_listing(self, api_client, auth_headers_admin):
        r = api_client.get(f"{BASE_URL}/api/admin/projects", headers=auth_headers_admin)
        assert r.status_code == 200
        _no_object_id(r.json())

    def test_rbac_user_blocked_from_admin_endpoints(self, api_client, auth_headers_user):
        endpoints = [
            ("GET", "/api/admin/stats"),
            ("GET", "/api/admin/users"),
            ("GET", "/api/admin/audit"),
            ("GET", "/api/admin/projects"),
        ]
        for method, ep in endpoints:
            r = api_client.request(method, f"{BASE_URL}{ep}", headers=auth_headers_user)
            assert r.status_code == 403, f"{ep} should be 403, got {r.status_code}"
