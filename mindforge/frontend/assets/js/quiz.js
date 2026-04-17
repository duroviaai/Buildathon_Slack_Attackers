const QUIZ_BASE = "http://localhost:5000/api";

let quizData = [];
let userAnswers = {};

function authHeaders() {
  const token = localStorage.getItem("mf_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function renderQuiz(questions) {
  quizData = questions;
  userAnswers = {};

  document.getElementById("empty-state").classList.add("hidden");

  const old = document.getElementById("quiz-area");
  if (old) old.remove();

  const container = document.querySelector(".main-bg") || document.querySelector("main");
  const quizArea = document.createElement("div");
  quizArea.id = "quiz-area";
  quizArea.className = "fade-in space-y-4 p-6";

  quizArea.innerHTML = `
    <div class="card-bg bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3 flex items-center justify-between">
      <span class="text-sm text-gray-500 font-medium text-sub">${questions.length} Questions</span>
      <span id="answered-count" class="text-sm font-semibold" style="color:#6C5CE7">0 / ${questions.length} answered</span>
    </div>
    <div class="w-full h-1.5 bg-gray-200 rounded-full">
      <div id="progress-bar" class="progress-bar-fill h-1.5" style="width:0%"></div>
    </div>
    <div id="questions-list" class="space-y-4"></div>
    <div class="flex items-center justify-between pt-2">
      <button id="reset-quiz-btn"
        class="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 text-sm font-medium transition-all">
        Reset
      </button>
      <button id="submit-quiz-btn"
        class="btn-generate px-8 py-2.5 rounded-xl text-white font-semibold text-sm">
        Submit Quiz
      </button>
    </div>
    <div id="quiz-result" class="hidden"></div>`;

  container.appendChild(quizArea);

  const list = document.getElementById("questions-list");
  questions.forEach((q, qi) => {
    const opts = q.options || q.choices || [];
    const card = document.createElement("div");
    card.className = "card-bg bg-white rounded-2xl shadow-sm border border-gray-100 p-6 fade-in";
    card.style.animationDelay = `${qi * 0.05}s`;
    card.innerHTML = `
      <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:#6C5CE7">Question ${qi + 1}</p>
      <p class="text-gray-800 font-semibold text-sm leading-relaxed mb-4 text-main">${q.question}</p>
      <div class="space-y-2" id="opts-${qi}">
        ${opts.map((opt, oi) => `
          <button type="button" data-qi="${qi}" data-oi="${oi}"
            class="opt-btn w-full text-left px-4 py-3 rounded-xl border border-gray-200
                   bg-gray-50 text-gray-700 text-sm transition-all">
            <span class="inline-flex items-center justify-center w-6 h-6 rounded-full
                         border border-gray-300 text-xs font-bold mr-3 flex-shrink-0 text-gray-500">
              ${String.fromCharCode(65 + oi)}
            </span>${opt}
          </button>`).join("")}
      </div>`;
    list.appendChild(card);
  });

  document.getElementById("questions-list").addEventListener("click", (e) => {
    const btn = e.target.closest(".opt-btn");
    if (!btn) return;
    const qi = parseInt(btn.dataset.qi);
    const oi = parseInt(btn.dataset.oi);
    userAnswers[qi] = oi;

    document.querySelectorAll(`#opts-${qi} .opt-btn`).forEach((b, i) => {
      b.classList.toggle("selected", i === oi);
      b.classList.toggle("bg-gray-50", i !== oi);
      b.classList.toggle("border-gray-200", i !== oi);
      b.classList.toggle("text-gray-700", i !== oi);
    });

    const answered = Object.keys(userAnswers).length;
    document.getElementById("answered-count").textContent = `${answered} / ${questions.length} answered`;
    document.getElementById("progress-bar").style.width = `${(answered / questions.length) * 100}%`;
  });

  document.getElementById("submit-quiz-btn").addEventListener("click", submitQuiz);
  document.getElementById("reset-quiz-btn").addEventListener("click", resetQuiz);
}

function submitQuiz() {
  if (Object.keys(userAnswers).length < quizData.length) {
    if (!confirm("You haven't answered all questions. Submit anyway?")) return;
  }

  let score = 0;
  const list = document.getElementById("questions-list");

  quizData.forEach((q, qi) => {
    const correctIdx = typeof q.correct_index !== "undefined" ? q.correct_index
                     : typeof q.answer_index  !== "undefined" ? q.answer_index
                     : (q.options || q.choices || []).findIndex(o => o === q.correct || o === q.answer);
    const userIdx = userAnswers[qi];
    const isCorrect = userIdx === correctIdx;
    if (isCorrect) score++;

    const opts = list.querySelectorAll(`#opts-${qi} .opt-btn`);
    opts.forEach((b, i) => {
      b.disabled = true;
      b.classList.remove("selected", "bg-gray-50", "border-gray-200", "text-gray-700");
      if (i === correctIdx) {
        b.classList.add("correct");
      } else if (i === userIdx && !isCorrect) {
        b.classList.add("wrong");
      } else {
        b.classList.add("bg-gray-50", "border-gray-200", "text-gray-400");
      }
    });

    if (q.explanation) {
      const exp = document.createElement("p");
      exp.className = "mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2";
      exp.textContent = `💡 ${q.explanation}`;
      list.children[qi].appendChild(exp);
    }
  });

  const pct = Math.round((score / quizData.length) * 100);
  const color = pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-500";
  const result = document.getElementById("quiz-result");
  result.className = "card-bg bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center fade-in";
  result.innerHTML = `
    <p class="text-lg font-bold text-gray-800 text-main mb-1">Quiz Complete!</p>
    <p class="text-4xl font-extrabold ${color} mb-2">${pct}%</p>
    <p class="text-sm text-gray-500 text-sub">${score} / ${quizData.length} correct</p>`;
  result.classList.remove("hidden");

  document.getElementById("submit-quiz-btn")?.classList.add("hidden");
  result.scrollIntoView({ behavior: "smooth", block: "center" });
}

function resetQuiz() {
  const area = document.getElementById("quiz-area");
  if (area) area.remove();
  document.getElementById("empty-state").classList.remove("hidden");
  quizData = [];
  userAnswers = {};
}

async function generateQuiz() {
  const notes = document.getElementById("notes-input").value.trim();
  const file  = document.getElementById("file-input").files[0];
  const count = document.getElementById("question-count").value;
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

    const res  = await fetch(`${QUIZ_BASE}/quiz/generate`, { method: "POST", headers, body });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data.error || "Failed to generate quiz.");

    const questions = data.questions || data.quiz || [];
    if (!questions.length) throw new Error("No questions returned.");

    renderQuiz(questions);

  } catch (err) {
    errorMsg.textContent = err.message || "Failed to generate quiz. Is the server running?";
    errorMsg.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    document.getElementById("btn-text").classList.remove("hidden");
    document.getElementById("btn-icon").classList.remove("hidden");
    document.getElementById("btn-spinner").classList.add("hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("generate-btn")?.addEventListener("click", generateQuiz);

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
    document.getElementById("question-count").value = pill.dataset.value;
  });
});
