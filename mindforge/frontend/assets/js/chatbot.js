const BASE_URL = "http://localhost:5000/api";

function appendMessage(role, text) {
  const container = document.getElementById("chatContainer");
  if (!container) return;
  const isBot = role === "bot";
  const wrapper = document.createElement("div");
  wrapper.className = "flex items-start gap-2.5" + (isBot ? "" : " justify-end");
  wrapper.innerHTML = isBot
    ? `<div class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style="background:linear-gradient(135deg,#6C5CE7,#4A90E2)">
        <i data-lucide="bot" class="w-4 h-4 text-white"></i>
       </div>
       <div class="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-700 shadow-sm max-w-xs">${text}</div>`
    : `<div class="bg-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-xs">${text}</div>`;
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
  lucide.createIcons();
}

async function sendMessage() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;
  input.value = "";
  appendMessage("user", msg);

  const token = localStorage.getItem("mf_token");
  try {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ message: msg }),
    });
    const json = await res.json().catch(() => ({}));
    appendMessage("bot", json.reply || json.error || "Sorry, I couldn't process that.");
  } catch {
    appendMessage("bot", "Network error. Is the server running?");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("sendBtn");
  const chatInput = document.getElementById("chatInput");
  if (sendBtn) sendBtn.addEventListener("click", sendMessage);
  if (chatInput) chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
});
