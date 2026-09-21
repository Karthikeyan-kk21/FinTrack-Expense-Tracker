import os
from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    print(f"[INFO] Expense Tracker Backend Server running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
