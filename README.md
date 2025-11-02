# ScholarMatch
#### Video Demo: https://youtu.be/n3UzWZK8NOQ
#### Description:
**ScholarMatch** is a web application built with Flask that helps students discover scholarship opportunities based on their country, academic field, and GPA.

The main goal of this project is to make scholarship searching easier for students who want to study abroad but struggle to find opportunities that fit their academic profile. ScholarMatch provides a simple and interactive interface where users can input their information and instantly see matching scholarships.

---

### 🧠 How It Works
When a user visits the ScholarMatch homepage, they are greeted with a clean and minimal interface.
The user can:
1. Enter their **country** of residence.
2. Enter their **field of study**.
3. Provide their **GPA** value.

When the **Search** button is clicked:
- The frontend JavaScript collects the user’s input and sends it to the backend using a **POST request**.
- The **Flask** backend processes the request, searches through the dataset, and returns matching scholarships.
- The results are displayed dynamically on the same page, showing the scholarship’s name, country, field, minimum GPA, and a link for more details.

If no scholarships match the query, the message **“No matches found”** is shown.

---

### 🎨 Technologies Used
- **Flask (Python)** – for handling routes, processing requests, and serving templates.
- **HTML & Tailwind CSS** – for a responsive and visually appealing interface.
- **JavaScript (Fetch API)** – for handling user input and displaying search results dynamically.
- **SQLite / JSON** – for storing and retrieving scholarship data.

---

### 💡 Design Decisions
I chose **Flask** because it is lightweight and beginner-friendly, yet powerful enough to handle a small-scale web application like ScholarMatch.
**Tailwind CSS** was used to style the app quickly and maintain a clean, modern design.
Instead of using a large SQL database, I decided to use a **simplified JSON-like structure** for the initial prototype, making it easy to update and expand later.

This approach makes ScholarMatch modular and easy to maintain — the backend can be scaled or connected to an API in the future without changing the frontend logic.

---

### 🚀 Future Improvements
- Add user accounts so students can save favorite scholarships.
- Allow users to submit new scholarships through a form.
- Connect the app to a real external scholarship API or database.
- Add filters for language requirements, degree level, and application deadlines.
- Improve search ranking to show the most relevant scholarships first.

---

### 🧑‍💻 Inspiration
I created ScholarMatch as part of the **CS50x final project**.
The inspiration came from my personal experience trying to find scholarships to study abroad. I wanted to make the process simpler, faster, and more accessible for students everywhere.

ScholarMatch represents my growing skills in **Flask**, **frontend development**, and **API integration**, and I’m proud of how it turned out.

---
