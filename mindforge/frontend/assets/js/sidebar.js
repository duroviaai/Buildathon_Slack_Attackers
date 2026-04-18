(function () {
  const STORAGE_KEY = "mf_chats";
  const inPages = window.location.pathname.includes("/pages/");
  const root = inPages ? "../" : "";

  const NAV_LINKS = [
    { href: `${root}dashboard.html`,        icon: "home",           label: "Home",         pageMatch: "dashboard" },
    { href: `${root}pages/notes.html`,      icon: "library",        label: "Your Library", pageMatch: "notes" },
    { href: `${root}pages/flashcards.html`, icon: "layers",         label: "Flashcards",   pageMatch: "flashcards" },
    { href: `${root}pages/quiz.html`,       icon: "clipboard-list", label: "Quiz",         pageMatch: "quiz" },
    { href: `${root}pages/chatbot.html`,    icon: "message-square", label: "AI Chat",      pageMatch: "chatbot" },
    { href: `${root}pages/streak.html`,     icon: "flame",          label: "Streak",       pageMatch: "streak" },
  ];

  function esc(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  function currentPage() {
    return window.location.pathname.split("/").pop().replace(".html","");
  }

  // Chatbot page has dark background — detect it
  function isDarkPage() {
    return currentPage() === "chatbot";
  }

  function loadChats() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
      .filter(c => c.messages && c.messages.length > 0);
  }

  function saveChats(chats) {
    // Merge with full list (preserve empty chats for chatbot2.js)
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const ids = new Set(chats.map(c => c.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.filter(c => ids.has(c.id))));
  }

  function renderChatHistory(listEl) {
    if (!listEl) return;
    const dark = isDarkPage();
    const chats = loadChats();
    if (!chats.length) { listEl.innerHTML = ""; return; }
    listEl.innerHTML = chats.map(c => `
      <a href="${root}pages/chatbot.html" data-id="${c.id}"
        class="group flex items-center justify-between px-3 py-2 rounded-lg transition cursor-pointer no-underline ${dark ? "hover:bg-[#1e1e30] text-slate-400" : "hover:bg-purple-50 text-gray-600"}">
        <div class="flex items-center gap-2 overflow-hidden flex-1">
          <i data-lucide="message-circle" class="w-3.5 h-3.5 flex-shrink-0 ${dark ? "text-slate-500" : "text-gray-400"}"></i>
          <span class="truncate text-xs">${esc(c.title)}</span>
        </div>
        <button class="delete-chat opacity-0 group-hover:opacity-100 transition ml-1 flex-shrink-0 text-xs leading-none ${dark ? "text-slate-600 hover:text-red-400" : "text-gray-400 hover:text-red-500"}" data-id="${c.id}">✕</button>
      </a>`).join("");

    listEl.querySelectorAll(".delete-chat").forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault(); e.stopPropagation();
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all.filter(c => c.id !== btn.dataset.id)));
        renderChatHistory(listEl);
        if (window.lucide) lucide.createIcons();
      });
    });
    if (window.lucide) lucide.createIcons();
  }

  function buildSidebar() {
    const page = currentPage();
    const dark = isDarkPage();
    const user = JSON.parse(localStorage.getItem("mf_user") || "null");
    const initial = user ? user.name.charAt(0).toUpperCase() : "M";
    const name = user ? user.name : "User";
    const role = user ? (user.role || "Student") : "Student";

    // Colours based on page theme
    const bg        = dark ? "#13131f" : "#f8f9fc";
    const border    = dark ? "#1e1e30" : "#e5e7eb";
    const textMain  = dark ? "#e2e8f0" : "#1f2937";
    const textSub   = dark ? "#94a3b8" : "#6b7280";
    const textNav   = dark ? "#94a3b8" : "#4b5563";
    const hoverBg   = dark ? "#1e1e30" : "#ede9fe";
    const hoverClr  = dark ? "#a78bfa" : "#6C5CE7";
    const activeBg  = dark ? "#1e1e30" : "#ede9fe";
    const activeClr = dark ? "#a78bfa" : "#6C5CE7";
    const labelClr  = dark ? "#475569" : "#9ca3af";
    const divBorder = dark ? "#1e1e30" : "#e5e7eb";

    const navHtml = NAV_LINKS.map(n => {
      const active = page === n.pageMatch;
      return `<a href="${n.href}" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition cursor-pointer ${active ? "active" : ""}" style="color:${active ? activeClr : textNav}">
        <i data-lucide="${n.icon}" class="w-4 h-4"></i> ${n.label}
      </a>`;
    }).join("");

    const html = `
      <style>
        #app-sidebar {
          width: 240px; min-width: 240px;
          background: ${bg};
          border-right: 1px solid ${border};
          height: 100vh; position: fixed; left: 0; top: 0;
          display: flex; flex-direction: column; z-index: 20;
        }
        #app-sidebar .nav-item:hover { background: ${hoverBg}; color: ${hoverClr} !important; }
        #app-sidebar .nav-item.active { background: ${activeBg}; color: ${activeClr} !important; font-weight: 600; }
      </style>
      <aside id="app-sidebar">
        <div class="flex-1 flex flex-col overflow-y-auto">
          <!-- Logo -->
          <div class="px-5 py-5 flex items-center gap-2 flex-shrink-0" style="border-bottom:1px solid ${border}">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:linear-gradient(135deg,#6C5CE7,#4A90E2)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span class="text-xl font-extrabold tracking-tight" style="color:${textMain}">Mind<span style="color:#6C5CE7">Forge</span></span>
          </div>

          <!-- Nav -->
          <nav class="px-3 py-3 space-y-0.5 flex-shrink-0">${navHtml}</nav>

          <!-- New Chat -->
          <div class="px-4 mt-4 flex-shrink-0">
            <button id="newChatBtn" class="w-full py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition" style="background:linear-gradient(135deg,#6C5CE7,#4A90E2)">
              <i data-lucide="plus" class="w-4 h-4"></i> New Chat
            </button>
          </div>

          <!-- Recent Chats -->
          <div class="px-3 pt-4 pb-1 flex-shrink-0">
            <p class="text-[10px] font-semibold uppercase tracking-widest px-2" style="color:${labelClr}">Recent Chats</p>
          </div>
          <div id="sidebarChatList" class="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5"></div>
        </div>

        <!-- Bottom -->
        <div class="px-4 py-4 space-y-1 flex-shrink-0" style="border-top:1px solid ${divBorder}">
          <a href="#" class="nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition cursor-pointer" style="color:${textSub}">
            <i data-lucide="file-text" class="w-4 h-4"></i> Terms
          </a>
          <a href="#" id="sidebar-logout" class="nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition cursor-pointer" style="color:${textSub}">
            <i data-lucide="log-out" class="w-4 h-4"></i> Logout
          </a>
          <div class="flex items-center gap-3 pt-3 mt-2" style="border-top:1px solid ${divBorder}">
            <div id="sidebar-avatar" class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style="background:linear-gradient(135deg,#6C5CE7,#4A90E2)">${esc(initial)}</div>
            <div class="overflow-hidden">
              <p id="sidebar-name" class="text-sm font-semibold truncate" style="color:${textMain}">${esc(name)}</p>
              <p id="sidebar-role" class="text-xs" style="color:${textSub}">${esc(role)}</p>
            </div>
          </div>
        </div>
      </aside>`;

    const container = document.getElementById("app-sidebar");
    if (container) container.outerHTML = html;
    else document.body.insertAdjacentHTML("afterbegin", html);

    // Push main content right of sidebar
    const main = document.getElementById("main") || document.querySelector(".main-area");
    if (main) main.style.marginLeft = "240px";

    // Logout
    document.getElementById("sidebar-logout").addEventListener("click", e => {
      e.preventDefault();
      localStorage.removeItem("mf_token");
      localStorage.removeItem("mf_user");
      window.location.href = `${root}login.html`;
    });

    // New Chat — if on chatbot page call newChat(), else navigate
    document.getElementById("newChatBtn").addEventListener("click", () => {
      if (page === "chatbot" && typeof window.newChat === "function") {
        window.newChat();
      } else {
        window.location.href = `${root}pages/chatbot.html`;
      }
    });

    renderChatHistory(document.getElementById("sidebarChatList"));
    if (window.lucide) lucide.createIcons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildSidebar);
  } else {
    buildSidebar();
  }
})();
