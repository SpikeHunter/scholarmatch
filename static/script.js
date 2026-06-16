const searchBtn = document.querySelector("#searchBtn");
const searchTab = document.querySelector("#searchTab");
const favoritesTab = document.querySelector("#favoritesTab");
const resultsDiv = document.querySelector("#results");
const paginationDiv = document.querySelector("#pagination");
const sortSelect = document.querySelector("#sortBy");

let currentPage = 1;
const perPage = 10;
let currentView = "search";

const setActiveTab = tab => {
    currentView = tab;
    if (tab === "search") {
        searchTab.className = "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600";
        favoritesTab.className = "px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300";
        searchBtn.style.display = "inline-block";
        paginationDiv.style.display = "flex";
    } else {
        searchTab.className = "px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300";
        favoritesTab.className = "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600";
        searchBtn.style.display = "none";
        paginationDiv.style.display = "none";
    }
};

const renderPagination = (page, totalPages) => {
    paginationDiv.innerHTML = "";

    if (currentView !== "search" || totalPages <= 1) {
        return;
    }

    const prevButton = document.createElement("button");
    prevButton.id = "prevBtn";
    prevButton.textContent = "Previous";
    prevButton.className = "px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed";
    prevButton.disabled = page <= 1;

    const nextButton = document.createElement("button");
    nextButton.id = "nextBtn";
    nextButton.textContent = "Next";
    nextButton.className = "px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed";
    nextButton.disabled = page >= totalPages;

    const pageInfo = document.createElement("span");
    pageInfo.className = "px-3 py-2 text-gray-700";
    pageInfo.textContent = `Page ${page} of ${totalPages}`;

    paginationDiv.appendChild(prevButton);
    paginationDiv.appendChild(pageInfo);
    paginationDiv.appendChild(nextButton);
};

const createScholarshipCard = (scholarship, showSave, isSaved = false) => {
    const card = document.createElement("div");
    card.className = "bg-blue-50 p-4 rounded-lg mb-3 border";
    
    let buttonHtml = "";
    if (showSave) {
        if (isSaved) {
            buttonHtml = `<button data-id="${scholarship.id}" class="save-btn px-3 py-2 bg-gray-400 text-white rounded cursor-not-allowed" disabled>Saved</button>`;
        } else {
            buttonHtml = `<button data-id="${scholarship.id}" class="save-btn px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600">Save</button>`;
        }
    }
    
    card.innerHTML = `
        <div class="flex justify-between items-start gap-4">
            <div>
                <h4 class="text-lg font-semibold">${scholarship.name}</h4>
                <p class="text-sm text-gray-700">${scholarship.country} — ${scholarship.field}</p>
                <p class="text-sm text-gray-700">Min GPA: ${scholarship.min_gpa}</p>
                <a href="${scholarship.link}" target="_blank" class="text-blue-600 underline">Learn more</a>
            </div>
            ${buttonHtml}
        </div>
    `;
    return card;
};

const renderResults = (results, showSave = true, message = "", savedIds = []) => {
    resultsDiv.innerHTML = "";
    if (message) {
        resultsDiv.innerHTML = `<p class='text-red-500'>${message}</p>`;
        return;
    }

    if (!results || results.length === 0) {
        resultsDiv.innerHTML = "<p class='text-red-500'>No scholarships found.</p>";
        return;
    }

    results.forEach(s => {
        const isSaved = savedIds.includes(s.id);
        resultsDiv.appendChild(createScholarshipCard(s, showSave, isSaved));
    });
};

const showLoading = () => {
    resultsDiv.innerHTML = `
        <div class="flex items-center justify-center py-6">
            <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span class="ml-3 text-gray-700">Loading scholarships...</span>
        </div>
    `;
};

const performSearch = async (page = 1) => {
    setActiveTab("search");
    const country = document.querySelector("#country").value.trim();
    const field = document.querySelector("#field").value.trim();
    const gpa = document.querySelector("#gpa").value.trim();
    const sortBy = sortSelect.value;

    if (!country && !field && !gpa) {
        renderResults([], true, "Please fill at least one search field before searching.");
        paginationDiv.innerHTML = "";
        return;
    }

    searchBtn.disabled = true;
    currentPage = page;
    showLoading();

    try {
        // Fetch favorites in parallel
        const favoritesResponse = await fetch("/favorites");
        const favoritesData = await favoritesResponse.json();
        const savedIds = favoritesResponse.ok ? favoritesData.results.map(s => s.id) : [];

        const response = await fetch("/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country, field, gpa, sort_by: sortBy, page, per_page: perPage })
        });

        const data = await response.json();

        if (!response.ok) {
            renderResults([], true, data.error || "Unable to perform search. Please try again.");
            paginationDiv.innerHTML = "";
            return;
        }

        renderResults(data.results, true, "", savedIds);
        renderPagination(data.page, data.total_pages);
    } catch (error) {
        renderResults([], true, "Search failed. Please check your connection and try again.");
        paginationDiv.innerHTML = "";
        console.error("Search error:", error);
    } finally {
        searchBtn.disabled = false;
    }
};

const loadFavorites = async () => {
    setActiveTab("favorites");
    searchBtn.disabled = true;
    showLoading();
    paginationDiv.innerHTML = "";

    try {
        const response = await fetch("/favorites");
        const data = await response.json();

        if (!response.ok) {
            renderResults([], false, data.error || "Unable to load favorites.");
            return;
        }

        renderResults(data.results, false);
    } catch (error) {
        renderResults([], false, "Failed to load favorites. Please try again.");
        console.error("Favorites error:", error);
    } finally {
        searchBtn.disabled = false;
    }
};

const saveFavorite = async id => {
    try {
        const response = await fetch("/favorite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.error || "Unable to save favorite.");
            return;
        }

        const saveButton = document.querySelector(`button.save-btn[data-id='${id}']`);
        if (saveButton) {
            saveButton.textContent = "Saved";
            saveButton.disabled = true;
            saveButton.className = "px-3 py-2 bg-gray-400 text-white rounded";
        }
    } catch (error) {
        alert("Unable to save favorite. Please try again.");
        console.error("Save favorite error:", error);
    }
};

searchBtn.addEventListener("click", () => performSearch(1));
searchTab.addEventListener("click", () => performSearch(1));
favoritesTab.addEventListener("click", loadFavorites);

paginationDiv.addEventListener("click", event => {
    if (event.target.id === "prevBtn" && currentPage > 1) {
        performSearch(currentPage - 1);
    }
    if (event.target.id === "nextBtn") {
        performSearch(currentPage + 1);
    }
});

resultsDiv.addEventListener("click", event => {
    const button = event.target.closest("button.save-btn");
    if (button) {
        const id = button.getAttribute("data-id");
        if (id) {
            saveFavorite(id);
        }
    }
});
