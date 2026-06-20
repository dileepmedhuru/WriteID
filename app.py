import os
import sqlite3
import hashlib
from flask import Flask, request, jsonify
from flask_cors import CORS
from handwriting_match import match_handwriting

app = Flask(__name__, static_folder="frontend", static_url_path="")
CORS(app)

# Use /tmp for uploads on production (Render filesystem is read-only except /tmp)
UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "/tmp/writeid_uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

def init_db():
    conn = None
    try:
        conn = sqlite3.connect("users.db")
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        """)
        conn.commit()
    finally:
        if conn:
            conn.close()

# Initialize Database on Startup
init_db()

@app.route("/")
def index():
    return app.send_static_file("index.html")

@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    if not data or "username" not in data or "email" not in data or "password" not in data:
        return jsonify({"error": "Missing username, email or password"}), 400
    
    username = data["username"].strip()
    email = data["email"].strip().lower()
    password = data["password"].strip()
    
    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
        
    if "@" not in email or "." not in email:
        return jsonify({"error": "Invalid email address"}), 400
    
    if len(password) < 4:
        return jsonify({"error": "Password must be at least 4 characters"}), 400
        
    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    
    conn = None
    try:
        conn = sqlite3.connect("users.db")
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", (username, email, password_hash))
        conn.commit()
        return jsonify({"success": True, "message": "User registered successfully!"})
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username or Email already registered"}), 400
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Missing email or password"}), 400
    
    email = data["email"].strip().lower()
    password = data["password"].strip()
    
    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    
    conn = None
    try:
        conn = sqlite3.connect("users.db")
        cursor = conn.cursor()
        cursor.execute("SELECT password, username FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        
        if row and row[0] == password_hash:
            return jsonify({"success": True, "email": email, "username": row[1]})
        else:
            return jsonify({"error": "Invalid email or password"}), 401
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

@app.route("/process-handwriting", methods=["POST"])
def process_handwriting():
    print("\n[INFO] Received a request at /process-handwriting\n")  # Debugging

    if "sample" not in request.files or "handwriting" not in request.files:
        print("[ERROR] Missing files!")  # Debugging
        return jsonify({"error": "Missing files"}), 400

    # Retrieve files
    sample_file = request.files["sample"]
    handwriting_file = request.files["handwriting"]
    
    # Retrieve mode (handwriting or signature)
    mode = request.form.get("mode", "handwriting")

    # Save files
    sample_path = os.path.join(app.config["UPLOAD_FOLDER"], sample_file.filename)
    handwriting_path = os.path.join(app.config["UPLOAD_FOLDER"], handwriting_file.filename)
    sample_file.save(sample_path)
    handwriting_file.save(handwriting_path)

    print(f"[INFO] Files saved: {sample_path}, {handwriting_path}, mode={mode}")  # Debugging

    # Calculate real handwriting similarity using improved hybrid matching
    result = match_handwriting(sample_path, handwriting_path, mode=mode)

    print(f"[INFO] Match Results: {result}")  # Debugging
    return jsonify(result)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[START] Starting Flask server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)

