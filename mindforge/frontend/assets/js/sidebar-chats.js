// Renders chat history in any page's sidebar and wires up New Chat button
(function () {
  const STORAGE_KEY = "mf_chats";
  const list = document.getElementById("chatHistoryList");
  const newBtn = document.getElementById("newChatBtn");
  if (!list) return;

  function esc(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function load() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  function save(c) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }

  function render() {
    const chats = load().filter(c => c.messages && c.messages.length > 0);
    if (!chats.length) { list.innerHTML = ""; return; }
    list.innerHTML = chats.map(c => `
      <a href="../pages/chatbot.html" data-id="${c.id}"
        class="group flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-purple-50 transition cursor-pointer">
        <div class="flex items-center gap-2 overflow-hidden flex-1">
          <i data-lucide="message-circle" class="w-3.5 h-3.5 text-gray-400 flex-shrink-0"></i>
          <span class="truncate text-xs text-gray-500">${esc(c.title)}</span>
        </div>
        <button class="delete-chat opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition ml-1 flex-shrink-0 text-xs" data-id="${c.id}">✕</button>
      </a>`).join("");

    list.querySelectorAll(".delete-chat").forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation();
        const chats = load().filter(c => c.id !== btn.dataset.id);
        save(chats);
        render();
        if (window.lucide) lucide.createIcons();
      });
    });
    if (window.lucide) lucide.createIcons();
  }

  // New Chat button — navigate to chatbot page, a new chat will be created there
  if (newBtn) {
    newBtn.addEventListener("click", () => {
      window.location.href = "../pages/chatbot.html";
    });
  }

  render();
})();
