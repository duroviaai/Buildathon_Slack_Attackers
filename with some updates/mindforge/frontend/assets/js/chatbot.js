document.addEventListener("DOMContentLoaded", () => {
  const chatInput     = document.getElementById("chatInput");
  const sendBtn       = document.getElementById("sendBtn");
  const chatContainer = document.getElementById("chatContainer");
  const expandBtn     = document.getElementById("expandBtn");
  const expandLabel   = document.getElementById("expandLabel");
  const chatCard      = document.getElementById("chatCard");
  const newChatBtn    = document.getElementById("newChatBtn");

  const DEFAULT_INNER = `<div class="flex items-start gap-2.5 msg-animate">
    <div class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style="background:linear-gradient(135deg,#6C5CE7,#4A90E2)">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
    </div>
    <div class="bg-slate-700 text-white px-4 py-3 rounded-xl max-w-[70%] text-sm leading-relaxed whitespace-pre-line shadow-sm">
      Hi! I'm MindForge AI. Ask me anything.
    </div>
  </div>`;

  const DEFAULT_MSG = `<div class="max-w-[900px] mx-auto space-y-3">${DEFAULT_INNER}</div>`;

  function getMsgWrapper() {
    return chatContainer.querySelector("div");
  }

  function scrollBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function userBubble(text) {
    return `<div class="flex justify-end msg-animate">
      <div class="bg-indigo-500 text-white px-4 py-3 rounded-xl max-w-[60%] text-sm leading-relaxed whitespace-pre-line shadow-sm">${escHtml(text)}</div>
    </div>`;
  }

  function aiBubble(text) {
    return `<div class="flex items-start gap-2.5 msg-animate">
      <div class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style="background:linear-gradient(135deg,#6C5CE7,#4A90E2)">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
      </div>
      <div class="bg-slate-700 text-white px-4 py-3 rounded-xl max-w-[70%] text-sm leading-relaxed whitespace-pre-line shadow-sm">${escHtml(text)}</div>
    </div>`;
  }

  function typingBubble(id) {
    return `<div id="${id}" class="flex items-start gap-2.5 msg-animate">
      <div class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-300"></div>
      <div class="bg-slate-200 text-slate-500 px-4 py-3 rounded-xl text-sm italic animate-pulse">🤖 MindForge AI is thinking...</div>
    </div>`;
  }

  function errorBubble(text) {
    return `<div class="flex items-start gap-2.5 msg-animate">
      <div class="bg-red-100 text-red-600 px-4 py-3 rounded-xl max-w-[70%] text-sm leading-relaxed border border-red-200">${text}</div>
    </div>`;
  }

  function escHtml(str) {
    return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  function append(html) {
    getMsgWrapper().insertAdjacentHTML("beforeend", html);
    scrollBottom();
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = "";
    sendBtn.disabled = true;
    sendBtn.style.opacity = "0.5";
    append(userBubble(text));

    const typingId = "typing-" + Date.now();
    append(typingBubble(typingId));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await res.json();
      document.getElementById(typingId)?.remove();
      append(aiBubble(data.reply || "⚠️ No response received."));
    } catch (err) {
      clearTimeout(timeout);
      document.getElementById(typingId)?.remove();
      const msg = err.name === "AbortError"
        ? "⚠️ Request timed out. Try again."
        : "⚠️ AI is temporarily unavailable. Try again.";
      append(errorBubble(msg));
    } finally {
      sendBtn.disabled = false;
      sendBtn.style.opacity = "1";
      chatInput.focus();
    }
  }

  // Send on click
  sendBtn.addEventListener("click", sendMessage);

  // Enter = send, Shift+Enter = newline (only works on textarea; for input just send)
  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Expand / Collapse
  expandBtn?.addEventListener("click", () => {
    const isExpanded = chatCard.classList.toggle("expanded");
    expandLabel.textContent = isExpanded ? "Collapse" : "Expand";
    const icon = expandBtn.querySelector("i, svg");
    if (icon?.setAttribute) icon.setAttribute("data-lucide", isExpanded ? "minimize-2" : "maximize-2");
    if (window.lucide) lucide.createIcons();
    scrollBottom();
  });

  // New Chat reset
  newChatBtn?.addEventListener("click", () => {
    chatContainer.innerHTML = DEFAULT_MSG;
    chatInput.value = "";
    chatInput.focus();
  });
});
