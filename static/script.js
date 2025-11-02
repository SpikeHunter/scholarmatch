document.querySelector("#searchBtn").addEventListener("click", async () => {
    const country = document.querySelector("#country").value;
    const field = document.querySelector("#field").value;
    const gpa = document.querySelector("#gpa").value;

    const response = await fetch("/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, field, gpa })
    });

    const data = await response.json();
    const resultsDiv = document.querySelector("#results");
    resultsDiv.innerHTML = "";

    if (data.length === 0) {
        resultsDiv.innerHTML = "<p class='text-red-500'>No matches found.</p>";
        return;
    }

    data.forEach(s => {
        const card = document.createElement("div");
        card.className = "bg-blue-50 p-4 rounded-lg mb-3 border";
        card.innerHTML = `
            <h4 class="text-lg font-semibold">${s.name}</h4>
            <p>${s.country} — ${s.field}</p>
            <p>Min GPA: ${s.min_gpa}</p>
            <a href="${s.link}" target="_blank" class="text-blue-600 underline">Learn more</a>
        `;
        resultsDiv.appendChild(card);
    });
});
