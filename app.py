from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/search", methods=["POST"])
def search():
    data = request.get_json()
    country = data.get("country", "")
    field = data.get("field", "")
    gpa = float(data.get("gpa", 0))

    conn = sqlite3.connect("scholarmatch.db")
    cur = conn.cursor()
    cur.execute("""
        SELECT name, country, field, min_gpa, link FROM scholarships
        WHERE country LIKE ? AND field LIKE ? AND min_gpa <= ?
    """, (f"%{country}%", f"%{field}%", gpa))
    results = cur.fetchall()
    conn.close()

    scholarships = [
        {"name": r[0], "country": r[1], "field": r[2], "min_gpa": r[3], "link": r[4]}
        for r in results
    ]
    return jsonify(scholarships)

if __name__ == "__main__":
    from os import environ
    port = int(environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

