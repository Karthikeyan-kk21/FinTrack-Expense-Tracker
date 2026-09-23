from datetime import date

def test_auth_registration_and_login(client):
    # 1. Register
    reg_res = client.post("/api/auth/register", json={
        "name": "Alex Smith",
        "email": "alex@example.com",
        "password": "securepassword",
        "currency": "USD"
    })
    assert reg_res.status_code == 201
    data = reg_res.get_json()["data"]
    assert data["user"]["email"] == "alex@example.com"
    assert data["user"]["currency"] == "USD"
    assert "token" in data

    # 2. Duplicate registration fails
    dup_res = client.post("/api/auth/register", json={
        "name": "Alex Duplicate",
        "email": "alex@example.com",
        "password": "securepassword"
    })
    assert dup_res.status_code == 409

    # 3. Login
    login_res = client.post("/api/auth/login", json={
        "email": "alex@example.com",
        "password": "securepassword"
    })
    assert login_res.status_code == 200
    assert "token" in login_res.get_json()["data"]

    # 4. Wrong password
    bad_login = client.post("/api/auth/login", json={
        "email": "alex@example.com",
        "password": "wrongpassword"
    })
    assert bad_login.status_code == 401

    # 5. Reset password
    reset_res = client.post("/api/auth/reset-password", json={
        "email": "alex@example.com",
        "new_password": "newsuperpassword123"
    })
    assert reset_res.status_code == 200

    # 6. Login with new password
    new_login = client.post("/api/auth/login", json={
        "email": "alex@example.com",
        "password": "newsuperpassword123"
    })
    assert new_login.status_code == 200


def test_default_categories_seeded_and_crud(client, auth_headers):
    # 1. Check categories were seeded
    cat_res = client.get("/api/categories", headers=auth_headers)
    assert cat_res.status_code == 200
    categories = cat_res.get_json()["data"]
    assert len(categories) > 0
    expense_cats = [c for c in categories if c["type"] == "expense"]
    income_cats = [c for c in categories if c["type"] == "income"]
    assert len(expense_cats) >= 8
    assert len(income_cats) >= 5

    # 2. Create custom category
    new_cat_res = client.post("/api/categories", headers=auth_headers, json={
        "name": "Crypto Mining",
        "type": "income",
        "icon": "Cpu",
        "color": "#10B981"
    })
    assert new_cat_res.status_code == 201
    created_id = new_cat_res.get_json()["data"]["category"]["id"]

    # 3. Update category
    upd_res = client.put(f"/api/categories/{created_id}", headers=auth_headers, json={
        "name": "Cloud Mining",
        "color": "#06B6D4"
    })
    assert upd_res.status_code == 200
    assert upd_res.get_json()["data"]["category"]["name"] == "Cloud Mining"

    # 4. Delete category
    del_res = client.delete(f"/api/categories/{created_id}", headers=auth_headers)
    assert del_res.status_code == 200

def test_transactions_crud_and_budget_calculation(client, auth_headers):
    # 1. Fetch Food & Dining expense category and Salary income category
    cat_res = client.get("/api/categories", headers=auth_headers)
    categories = cat_res.get_json()["data"]
    food_cat = next(c for c in categories if c["name"] == "Food & Dining")
    salary_cat = next(c for c in categories if c["name"] == "Salary")

    today_str = date.today().strftime("%Y-%m-%d")

    # 2. Add Salary income
    inc_res = client.post("/api/transactions", headers=auth_headers, json={
        "title": "Monthly Software Engineering Salary",
        "category_id": salary_cat["id"],
        "type": "income",
        "amount": 75000.0,
        "transaction_date": today_str
    })
    assert inc_res.status_code == 201

    # 3. Add Food Expense
    exp_res = client.post("/api/transactions", headers=auth_headers, json={
        "title": "Grocery Supermarket",
        "category_id": food_cat["id"],
        "type": "expense",
        "amount": 4500.0,
        "transaction_date": today_str
    })
    assert exp_res.status_code == 201

    # 4. Set Budget for Food & Dining
    cur_month = date.today().month
    cur_year = date.today().year
    b_res = client.post("/api/budgets", headers=auth_headers, json={
        "category_id": food_cat["id"],
        "amount": 10000.0,
        "month": cur_month,
        "year": cur_year
    })
    assert b_res.status_code == 200

    # 5. Fetch Budgets and verify spent amount & remaining calculation
    get_b_res = client.get(f"/api/budgets?month={cur_month}&year={cur_year}", headers=auth_headers)
    assert get_b_res.status_code == 200
    b_data = get_b_res.get_json()["data"]
    assert b_data["summary"]["total_budgeted"] == 10000.0
    assert b_data["summary"]["total_spent"] == 4500.0
    assert b_data["summary"]["total_remaining"] == 5500.0
    assert b_data["summary"]["overall_percentage_used"] == 45.0

    # 6. Verify Dashboard Summary
    dash_res = client.get("/api/dashboard/summary", headers=auth_headers)
    assert dash_res.status_code == 200
    d_data = dash_res.get_json()["data"]
    assert d_data["lifetime"]["total_income"] == 75000.0
    assert d_data["lifetime"]["total_expense"] == 4500.0
    assert d_data["lifetime"]["total_balance"] == 70500.0

    # 7. Test Transaction Search & Filtering
    filter_res = client.get("/api/transactions?type=expense&search=Grocery", headers=auth_headers)
    assert filter_res.status_code == 200
    items = filter_res.get_json()["data"]["transactions"]
    assert len(items) == 1
    assert items[0]["title"] == "Grocery Supermarket"

def test_savings_goals_and_deposits(client, auth_headers):
    # 1. Create a savings goal
    create_res = client.post("/api/savings/goals", headers=auth_headers, json={
        "title": "Emergency Fund",
        "target_amount": 100000.0,
        "initial_amount": 20000.0,
        "color": "#10B981",
        "icon": "ShieldCheck"
    })
    assert create_res.status_code == 201
    goal = create_res.get_json()["data"]["goal"]
    assert goal["title"] == "Emergency Fund"
    assert goal["current_amount"] == 20000.0
    assert goal["percentage_completed"] == 20.0
    goal_id = goal["id"]

    # 2. Add deposit
    deposit_res = client.post(f"/api/savings/goals/{goal_id}/deposit", headers=auth_headers, json={
        "amount": 15000.0,
        "note": "Bonus allocation"
    })
    assert deposit_res.status_code == 201
    updated_goal = deposit_res.get_json()["data"]["goal"]
    assert updated_goal["current_amount"] == 35000.0
    assert updated_goal["percentage_completed"] == 35.0

    # 3. List goals summary
    list_res = client.get("/api/savings/goals", headers=auth_headers)
    assert list_res.status_code == 200
    summary = list_res.get_json()["data"]["summary"]
    assert summary["total_goals"] == 1
    assert summary["total_target"] == 100000.0
    assert summary["total_saved"] == 35000.0

def test_profile_update_email_and_name(client, auth_headers):
    # Update name and email
    upd_res = client.put("/api/auth/profile", headers=auth_headers, json={
        "name": "Jane Updated",
        "email": "jane.updated@example.com"
    })
    assert upd_res.status_code == 200
    user = upd_res.get_json()["data"]["user"]
    assert user["name"] == "Jane Updated"
    assert user["email"] == "jane.updated@example.com"
