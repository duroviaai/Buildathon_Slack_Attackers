const FC_BASE = "http://localhost:5000/api";
const FC_STORE_KEY = "mf_flashcard_sets";

function authHeaders() {
  const token = localStorage.getItem("mf_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getSets() {
  return JSON.parse(localStorage.getItem(FC_STORE_KEY) || "[]");
}
function saveSet(set) {
  const sets = getSets();
  sets.unshift(set);
  localStorage.setItem(FC_STORE_KEY, JSON.stringify(sets.slice(0, 20)));
}
function loadSet(id) {
  const set = getSets().find(s => s.id === id);
  if (set) renderCards(set.cards, set.title);
}

function renderCards(cards, title = "Flashcard Set") {
  const empty = document.getElementById("empty-state");
  const grid  = document.getElementById("flashcards-grid");
  if (!cards || !cards.length) return;

  empty.classList.add("hidden");
  grid.classList.remove("hidden");
  grid.innerHTML = "";

  cards.forEach((card, i) => {
    const el = document.createElement("div");
    el.className = "flashcard card-appear";
    el.style.animationDelay = `${i * 0.05}s`;
    el.style.height = "200px";
    el.innerHTML = `
      <div class="flashcard-inner">
        <div class="flashcard-front">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:#6C5CE7">Question</p>
            <p class="text-gray-800 font-semibold text-sm leading-relaxed text-main">${card.front || card.question}</p>
          </div>
        </div>
        <div class="flashcard-back">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:#4A90E2">Answer</p>
            <p class="text-gray-700 text-sm leading-relaxed text-main">${card.back || card.answer}</p>
          </div>
        </div>
      </div>`;
    el.addEventListener("click", () => el.classList.toggle("flipped"));
    grid.appendChild(el);
  });
}

async function generateFlashcards() {
  const notes = document.getElementById("notes-input").value.trim();
  const file  = document.getElementById("file-input").files[0];
  const count = document.getElementById("card-count").value;
  const errorMsg = document.getElementById("error-msg");

  errorMsg.classList.add("hidden");
  if (!notes && !file) {
    errorMsg.textContent = "Please paste notes or attach a file first.";
    errorMsg.classList.remove("hidden");
    return;
  }

  const btn = document.getElementById("generate-btn");
  btn.disabled = true;
  document.getElementById("btn-text").classList.add("hidden");
  document.getElementById("btn-icon").classList.add("hidden");
  document.getElementById("btn-spinner").classList.remove("hidden");

  try {
    let body, headers = { ...authHeaders() };

    if (file) {
      body = new FormData();
      body.append("file", file);
      body.append("count", count);
      if (notes) body.append("notes", notes);
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({ notes, count: parseInt(count) });
    }

    const res  = await fetch(`${FC_BASE}/flashcards/generate`, { method: "POST", headers, body });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data.error || "Failed to generate flashcards.");

    const cards = data.flashcards || data.cards || [];
    if (!cards.length) throw new Error("No flashcards returned.");

    const set = {
      id: Date.now(),
      title: data.title || `Set — ${new Date().toLocaleDateString()}`,
      count: cards.length,
      cards
    };
    saveSet(set);
    renderCards(cards, set.title);

  } catch (err) {
    errorMsg.textContent = err.message || "Failed to generate flashcards. Is the server running?";
    errorMsg.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    document.getElementById("btn-text").classList.remove("hidden");
    document.getElementById("btn-icon").classList.remove("hidden");
    document.getElementById("btn-spinner").classList.add("hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("generate-btn")?.addEventListener("click", generateFlashcards);

  const fileInput = document.getElementById("file-input");
  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById("file-name").textContent = file.name;
    const chip = document.getElementById("file-chip");
    chip.classList.remove("hidden");
    chip.classList.add("flex");
  });
  document.getElementById("file-clear")?.addEventListener("click", () => {
    if (fileInput) fileInput.value = "";
    const chip = document.getElementById("file-chip");
    chip.classList.add("hidden");
    chip.classList.remove("flex");
  });

  document.getElementById("count-picker")?.addEventListener("click", (e) => {
    const pill = e.target.closest(".count-pill");
    if (!pill) return;
    document.querySelectorAll(".count-pill").forEach(p => p.classList.remove("selected"));
    pill.classList.add("selected");
    document.getElementById("card-count").value = pill.dataset.value;
  });
});
