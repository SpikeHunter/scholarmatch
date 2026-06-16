from flask import Flask, render_template, request, jsonify, session
from flask_session import Session
import json
import os
import sqlite3
from pathlib import Path

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev_secret_key")
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_FILE_DIR"] = str(Path(__file__).resolve().parent / ".flask_session")
app.config["SESSION_PERMANENT"] = False
Session(app)

DB_PATH = Path(__file__).resolve().parent / "scholarmatch.db"
JSON_PATH = Path(__file__).resolve().parent / "scholarships.json"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS scholarships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            country TEXT,
            field TEXT,
            min_gpa REAL,
            link TEXT
        )
        """
    )

    with JSON_PATH.open("r", encoding="utf-8") as f:
        scholarships = json.load(f)

    for scholarship in scholarships:
        name = scholarship.get("name")
        country = scholarship.get("country")
        field = scholarship.get("field")
        min_gpa = scholarship.get("min_gpa")
        link = scholarship.get("link")

        cur.execute("SELECT 1 FROM scholarships WHERE name = ?", (name,))
        if cur.fetchone():
            continue

        cur.execute(
            "INSERT INTO scholarships (name, country, field, min_gpa, link) VALUES (?, ?, ?, ?, ?)",
            (name, country, field, min_gpa, link),
        )

    conn.commit()
    conn.close()

# Initialize database on app startup
with app.app_context():
    init_db()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/search", methods=["POST"])
def search():
    data = request.get_json() or {}
    country = data.get("country", "").strip()
    field = data.get("field", "").strip()
    gpa_value = data.get("gpa", "").strip()
    sort_by = data.get("sort_by", "name")
    page = data.get("page", 1)
    per_page = data.get("per_page", 10)

    allowed_sort_fields = {"min_gpa": "min_gpa", "name": "name COLLATE NOCASE", "country": "country COLLATE NOCASE"}
    if sort_by not in allowed_sort_fields:
        return jsonify({"error": "sort_by must be one of min_gpa, name, country."}), 400

    try:
        page = int(page)
        per_page = int(per_page)
    except (TypeError, ValueError):
        return jsonify({"error": "page and per_page must be integers."}), 400

    if page < 1 or per_page < 1:
        return jsonify({"error": "page and per_page must be positive integers."}), 400

    if gpa_value == "":
        gpa = None
    else:
        try:
            gpa = float(gpa_value)
        except (TypeError, ValueError):
            return jsonify({"error": "GPA must be a number."}), 400

        if gpa < 0.0 or gpa > 4.0:
            return jsonify({"error": "GPA must be between 0.0 and 4.0."}), 400

    sort_clause = allowed_sort_fields[sort_by]
    offset = (page - 1) * per_page

    # Build dynamic WHERE clause
    where_clause = "WHERE 1=1"
    params = []

    if country:
        where_clause += " AND country LIKE ?"
        params.append(f"%{country}%")

    if field:
        where_clause += " AND field LIKE ?"
        params.append(f"%{field}%")

    if gpa is not None:
        where_clause += " AND min_gpa <= ?"
        params.append(gpa)

    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute(f"""
            SELECT COUNT(*) FROM scholarships
            {where_clause}
        """, params)
        total_results = cur.fetchone()[0]

        cur.execute(f"""
            SELECT id, name, country, field, min_gpa, link FROM scholarships
            {where_clause}
            ORDER BY {sort_clause} ASC
            LIMIT ? OFFSET ?
        """, params + [per_page, offset])
        results = cur.fetchall()
        conn.close()
    except sqlite3.DatabaseError:
        return jsonify({"error": "An internal database error occurred."}), 500

    total_pages = (total_results + per_page - 1) // per_page if total_results else 0
    scholarships = [
        {"id": r[0], "name": r[1], "country": r[2], "field": r[3], "min_gpa": r[4], "link": r[5]}
        for r in results
    ]

    return jsonify({
        "results": scholarships,
        "page": page,
        "per_page": per_page,
        "total_results": total_results,
        "total_pages": total_pages,
    })

@app.route("/favorite", methods=["POST"])
def favorite():
    data = request.get_json() or {}
    scholarship_id = data.get("id")

    try:
        scholarship_id = int(scholarship_id)
    except (TypeError, ValueError):
        return jsonify({"error": "Scholarship id must be an integer."}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM scholarships WHERE id = ?", (scholarship_id,))
        if not cur.fetchone():
            conn.close()
            return jsonify({"error": "Scholarship not found."}), 404
        conn.close()
    except sqlite3.DatabaseError:
        return jsonify({"error": "An internal database error occurred."}), 500

    favorites = session.get("favorites", [])
    if scholarship_id not in favorites:
        favorites.append(scholarship_id)
        session["favorites"] = favorites

    return jsonify({"success": True, "favorites": session["favorites"]})

@app.route("/favorites", methods=["GET"])
def favorites():
    favorites = session.get("favorites", [])
    if not favorites:
        return jsonify({"results": []})

    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        placeholders = ",".join("?" for _ in favorites)
        cur.execute(f"SELECT id, name, country, field, min_gpa, link FROM scholarships WHERE id IN ({placeholders})", tuple(favorites))
        results = cur.fetchall()
        conn.close()
    except sqlite3.DatabaseError:
        return jsonify({"error": "An internal database error occurred."}), 500

    scholarship_map = {
        r[0]: {"id": r[0], "name": r[1], "country": r[2], "field": r[3], "min_gpa": r[4], "link": r[5]}
        for r in results
    }
    scholarships = [scholarship_map[fav_id] for fav_id in favorites if fav_id in scholarship_map]
    return jsonify({"results": scholarships})

if __name__ == "__main__":
    from os import environ
    port = int(environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

