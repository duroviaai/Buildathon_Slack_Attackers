document.addEventListener("DOMContentLoaded", () => {
  const chatInput       = document.getElementById("chatInput");
  const sendBtn         = document.getElementById("sendBtn");
  const messagesEl      = document.getElementById("messages");
  const attachBtn       = document.getElementById("attachBtn");
  const fileInput       = document.getElementById("fileInput");
  const micBtn          = document.getElementById("micBtn");
  const ttsBtn          = document.getElementById("ttsBtn");

  let lastAIResponse = "";

  // ── Markdown renderer (no external lib) ──────────────────────────────────
  function renderMarkdown(text) {
    let html = esc(text);
    // Code blocks
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code>${code.trim()}</code></pre>`);
    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    // Headings
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm,  "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm,   "<h1>$1</h1>");
    // Blockquote
    html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");
    // HR
    html = html.replace(/^---$/gm, "<hr>");
    // Unordered list
    html = html.replace(/((?:^[-*] .+\n?)+)/gm, m =>
      "<ul>" + m.replace(/^[-*] (.+)$/gm, "<li>$1</li>") + "</ul>");
    // Ordered list
    html = html.replace(/((?:^\d+\. .+\n?)+)/gm, m =>
      "<ol>" + m.replace(/^\d+\. (.+)$/gm, "<li>$1</li>") + "</ol>");
    // Paragraphs (double newline)
    html = html.replace(/\n{2,}/g, "</p><p>");
    // Single newlines
    html = html.replace(/\n/g, "<br>");
    return `<p>${html}</p>`;
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ── Chat persistence ──────────────────────────────────────────────────────
  const STORAGE_KEY = "mf_chats";
  let currentChatId = null;

  function loadAllChats() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  function saveAllChats(c) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }
  function getCurrentChat() { return loadAllChats().find(c => c.id === currentChatId) || null; }

  function persistMessage(role, text, extra = {}) {
    const chats = loadAllChats();
    const idx = chats.findIndex(c => c.id === currentChatId);
    if (idx === -1) return;
    chats[idx].messages.push({ role, text, ...extra });
    if (role === "user" && chats[idx].messages.filter(m => m.role === "user").length === 1) {
      chats[idx].title = (text || "📎 File").slice(0, 42) + ((text || "").length > 42 ? "…" : "");
    }
    saveAllChats(chats);
    renderSidebar();
  }

  function createNewChat() {
    const chats = loadAllChats();
    const chat = { id: Date.now().toString(), title: "New Chat", messages: [] };
    chats.unshift(chat);
    saveAllChats(chats);
    currentChatId = chat.id;
    renderSidebar();
    return chat;
  }

  function renderSidebar() {
    const list = document.getElementById("sidebarChatList");
    if (!list) return;
    const chats = loadAllChats();
    list.innerHTML = chats.map(c => `
      <div class="chat-history-item ${c.id === currentChatId ? "active" : ""} group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer" data-id="${c.id}">
        <div class="flex items-center gap-2 overflow-hidden flex-1">
          <i data-lucide="message-circle" class="w-3.5 h-3.5 text-slate-500 flex-shrink-0"></i>
          <span class="text-xs text-slate-400 truncate">${esc(c.title)}</span>
        </div>
        <button class="delete-chat opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition ml-1 flex-shrink-0" data-id="${c.id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`).join("");
    list.querySelectorAll("[data-id]").forEach(el => {
      el.addEventListener("click", e => {
        if (e.target.closest(".delete-chat")) deleteChat(e.target.closest(".delete-chat").dataset.id);
        else switchChat(el.dataset.id);
      });
    });
    lucide.createIcons();
  }

  function switchChat(id) {
    // delete previous chat if it was empty
    const prev = getCurrentChat();
    if (prev && prev.messages.length === 0 && prev.id !== id) {
      let chats = loadAllChats().filter(c => c.id !== prev.id);
      saveAllChats(chats);
    }
    currentChatId = id;
    const chat = getCurrentChat();
    messagesEl.innerHTML = "";
    if (!chat || chat.messages.length === 0) { showEmptyState(); }
    else {
      chat.messages.forEach(m => {
        if (m.role === "user") appendUserBubble(m.text, m.filePreview, m.fileName, false);
        else appendAIBubble(m.text, false);
      });
    }
    scrollBottom();
    renderSidebar();
  }

  function deleteChat(id) {
    let chats = loadAllChats().filter(c => c.id !== id);
    saveAllChats(chats);
    if (currentChatId === id) {
      if (chats.length) { currentChatId = chats[0].id; switchChat(currentChatId); }
      else { createNewChat(); messagesEl.innerHTML = ""; showEmptyState(); }
    }
    renderSidebar();
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  const SUGGESTIONS = [
    "Explain quantum entanglement simply",
    "Help me study for my math exam",
    "Summarize the French Revolution",
    "Write a Python sorting algorithm",
  ];

  function showEmptyState() {
    messagesEl.innerHTML = `
      <div id="empty-state" class="flex flex-col items-center justify-center flex-1 gap-6 py-12 text-center">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center" style="background:linear-gradient(135deg,#6C5CE7,#4A90E2)">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-white mb-1">How can I help you today?</h2>
          <p class="text-sm text-slate-500">Ask me anything — I can explain, quiz, summarize, and more.</p>
        </div>
        <div class="flex flex-wrap gap-2 justify-center max-w-lg">
          ${SUGGESTIONS.map(s => `<button class="chip suggestion-chip">${esc(s)}</button>`).join("")}
        </div>
      </div>`;
    messagesEl.querySelectorAll(".suggestion-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        chatInput.value = btn.textContent;
        autoResize();
        sendBtn.disabled = false;
        sendMessage();
      });
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  const existing = loadAllChats();
  if (existing.length) { currentChatId = existing[0].id; switchChat(currentChatId); }
  else { createNewChat(); showEmptyState(); }

  // ── DOM helpers ───────────────────────────────────────────────────────────
  function scrollBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }

  function removeEmptyState() {
    document.getElementById("empty-state")?.remove();
  }

  function appendUserBubble(text, filePreview, fileName, animate = true) {
    removeEmptyState();
    const isImage = filePreview && filePreview.startsWith("data:image");
    const div = document.createElement("div");
    div.className = `flex justify-end ${animate ? "msg-in" : ""}`;
    div.innerHTML = `
      <div class="bubble-user">
        ${filePreview ? (isImage
          ? `<img src="${filePreview}" class="rounded-xl max-h-48 object-cover w-full mb-2" />`
          : `<div class="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 mb-2 text-xs">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
               <span class="truncate">${esc(fileName || "file")}</span>
             </div>`) : ""}
        ${text ? `<span>${esc(text)}</span>` : ""}
      </div>`;
    messagesEl.appendChild(div);
    scrollBottom();
  }

  function appendAIBubble(text, animate = true) {
    removeEmptyState();
    const div = document.createElement("div");
    div.className = `flex items-start gap-3 ${animate ? "msg-in" : ""}`;
    div.innerHTML = `
      <div class="ai-avatar mt-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <div class="flex-1 min-w-0">
        <div class="bubble-ai">${renderMarkdown(text)}</div>
        <div class="action-row">
          <button class="action-btn btn-fc fc-btn">⚡ Flashcards</button>
          <button class="action-btn btn-qz qz-btn">📝 Quiz</button>
        </div>
      </div>`;
    messagesEl.appendChild(div);
    scrollBottom();
    return div;
  }

  function appendTyping() {
    const div = document.createElement("div");
    div.id = "typing-indicator";
    div.className = "flex items-start gap-3 msg-in";
    div.innerHTML = `
      <div class="ai-avatar mt-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <div class="bubble-ai flex items-center gap-1.5 py-3">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>`;
    messagesEl.appendChild(div);
    scrollBottom();
  }

  function removeTyping() { document.getElementById("typing-indicator")?.remove(); }

  function appendError(msg) {
    const div = document.createElement("div");
    div.className = "flex items-start gap-3 msg-in";
    div.innerHTML = `
      <div class="ai-avatar mt-1" style="background:linear-gradient(135deg,#ef4444,#f97316)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div class="bubble-ai border-red-900/40 text-red-400 text-sm">${esc(msg)}</div>`;
    messagesEl.appendChild(div);
    scrollBottom();
  }

  // ── Flashcard / Quiz result renderers ────────────────────────────────────
  function flashcardResultHtml(cards) {
    return cards.map(c => `
      <div class="result-card">
        <p class="font-semibold text-slate-200 text-xs mb-1">${esc(c.term || c.front || c.question || "")}</p>
        <p class="text-slate-400 text-xs">${esc(c.definition || c.back || c.answer || "")}</p>
      </div>`).join("");
  }

  function quizResultHtml(questions) {
    return questions.map((q, qi) => {
      const opts = q.options || q.choices || [];
      const correctIdx = typeof q.correct_index !== "undefined" ? q.correct_index
                       : typeof q.answer_index  !== "undefined" ? q.answer_index
                       : opts.findIndex(o => o === q.correct || o === q.answer);
      return `
        <div class="result-card">
          <p class="font-semibold text-slate-200 text-xs mb-2">${qi + 1}. ${esc(q.question)}</p>
          <div class="quiz-opts-group">
            ${opts.map((opt, oi) => `
              <button type="button" class="quiz-opt" data-qi="${qi}" data-oi="${oi}" data-correct="${correctIdx}">
                <span class="font-bold mr-1.5">${String.fromCharCode(65 + oi)}.</span>${esc(opt)}
              </button>`).join("")}
          </div>
        </div>`;
    }).join("");
  }

  // ── Action button delegation ──────────────────────────────────────────────
  messagesEl.addEventListener("click", async e => {
    // Quiz option
    const optBtn = e.target.closest(".quiz-opt");
    if (optBtn) {
      const group = optBtn.closest(".quiz-opts-group");
      if (group.dataset.answered) return;
      group.dataset.answered = "1";
      const correct = parseInt(optBtn.dataset.correct);
      group.querySelectorAll(".quiz-opt").forEach((b, i) => {
        b.disabled = true;
        if (i === correct) b.style.cssText = "background:#166534;border-color:#16a34a;color:#bbf7d0";
        else if (b === optBtn) b.style.cssText = "background:#7f1d1d;border-color:#ef4444;color:#fecaca";
      });
      return;
    }

    const fcBtn = e.target.closest(".fc-btn");
    const qzBtn = e.target.closest(".qz-btn");
    if (!fcBtn && !qzBtn) return;
    if (!lastAIResponse) return;

    const isFC = !!fcBtn;
    const actionRow = (fcBtn || qzBtn).closest(".action-row");
    actionRow.querySelectorAll("button").forEach(b => b.disabled = true);

    // Loading placeholder
    const loadDiv = document.createElement("div");
    loadDiv.className = "text-xs text-slate-500 italic ml-11 msg-in";
    loadDiv.textContent = isFC ? "Generating flashcards…" : "Generating quiz…";
    actionRow.parentElement.appendChild(loadDiv);
    scrollBottom();

    try {
      const res = await fetch(isFC ? "/api/generate-flashcards" : "/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lastAIResponse })
      });
      const data = await res.json();
      loadDiv.remove();
      if (!res.ok) throw new Error(data.error || "Failed");

      const resultHtml = isFC
        ? flashcardResultHtml(data.flashcards || data.cards || [])
        : quizResultHtml(data.questions || data.quiz || []);

      const resultDiv = document.createElement("div");
      resultDiv.className = "ml-11 space-y-2 msg-in";
      resultDiv.innerHTML = resultHtml;
      actionRow.parentElement.appendChild(resultDiv);
      scrollBottom();
    } catch {
      loadDiv.remove();
      const errDiv = document.createElement("div");
      errDiv.className = "ml-11 text-xs text-red-400 msg-in";
      errDiv.textContent = "⚠️ Failed to generate. Try again.";
      actionRow.parentElement.appendChild(errDiv);
      actionRow.querySelectorAll("button").forEach(b => b.disabled = false);
      scrollBottom();
    }
  });

  // ── Send message ──────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = "";
    autoResize();
    setSending(true);
    appendUserBubble(text, null, null);
    persistMessage("user", text);
    await fetchAIReply(text, null);
    setSending(false);
    chatInput.focus();
  }

  function setSending(on) {
    sendBtn.disabled = on;
    chatInput.disabled = on;
  }

  // ── File attach ───────────────────────────────────────────────────────────
  attachBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    fileInput.value = "";
    const caption = chatInput.value.trim();
    chatInput.value = "";
    autoResize();

    let previewSrc = null;
    if (file.type.startsWith("image/")) {
      previewSrc = await new Promise(res => {
        const r = new FileReader();
        r.onload = e => res(e.target.result);
        r.readAsDataURL(file);
      });
    }

    appendUserBubble(caption, previewSrc, file.name);
    persistMessage("user", caption, { filePreview: previewSrc, fileName: file.name });
    setSending(true);
    await fetchAIReply(caption, file);
    setSending(false);
    chatInput.focus();
  });

  // ── Core fetch ────────────────────────────────────────────────────────────
  async function fetchAIReply(text, file) {
    appendTyping();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      let res;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        if (text) fd.append("message", text);
        res = await fetch("/api/chat", { method: "POST", body: fd, signal: controller.signal });
      } else {
        res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
          signal: controller.signal
        });
      }
      clearTimeout(timeout);
      const data = await res.json();
      removeTyping();
      const reply = data.reply || "⚠️ No response received.";
      lastAIResponse = reply;
      appendAIBubble(reply);
      persistMessage("ai", reply);
      if (ttsEnabled) speak(reply);
    } catch (err) {
      clearTimeout(timeout);
      removeTyping();
      appendError(err.name === "AbortError" ? "Request timed out. Please try again." : "AI is temporarily unavailable. Please try again.");
    }
  }

  // ── Input events ──────────────────────────────────────────────────────────
  chatInput.addEventListener("input", () => {
    autoResize();
    sendBtn.disabled = !chatInput.value.trim();
  });

  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!sendBtn.disabled) sendMessage(); }
  });

  sendBtn.addEventListener("click", sendMessage);

  function autoResize() {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + "px";
  }

  // ── Clear current chat ────────────────────────────────────────────────────
  window.clearCurrentChat = function () {
    const chats = loadAllChats();
    const idx = chats.findIndex(c => c.id === currentChatId);
    if (idx !== -1) { chats[idx].messages = []; saveAllChats(chats); }
    messagesEl.innerHTML = "";
    showEmptyState();
    lastAIResponse = "";
  };

  window.newChat = function () {
    const current = getCurrentChat();
    if (current && current.messages.length === 0) {
      // already on an empty chat, just reset UI
      messagesEl.innerHTML = "";
      showEmptyState();
      lastAIResponse = "";
      chatInput.focus();
      return;
    }
    createNewChat();
    messagesEl.innerHTML = "";
    showEmptyState();
    lastAIResponse = "";
    chatInput.focus();
  };

  // ── Voice to Text ─────────────────────────────────────────────────────────
  let mediaRecorder = null, audioChunks = [], isListening = false;

  micBtn.addEventListener("click", async () => {
    if (isListening) { mediaRecorder?.stop(); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { alert("Microphone access denied."); return; }

    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      isListening = false;
      micBtn.classList.remove("mic-active");
      const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      if (blob.size < 1000) return;
      const prev = chatInput.placeholder;
      chatInput.placeholder = "Transcribing…";
      chatInput.disabled = true;
      try {
        const fd = new FormData();
        fd.append("audio", blob, "recording.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: fd });
        const data = await res.json();
        if (data.transcript) { chatInput.value = data.transcript; autoResize(); sendBtn.disabled = false; chatInput.focus(); }
        else { chatInput.placeholder = data.error || "Transcription failed."; setTimeout(() => { chatInput.placeholder = prev; }, 3000); }
      } catch { chatInput.placeholder = "Network error."; setTimeout(() => { chatInput.placeholder = prev; }, 3000); }
      finally { chatInput.disabled = false; chatInput.placeholder = prev; }
    };
    mediaRecorder.start();
    isListening = true;
    micBtn.classList.add("mic-active");
  });

  // ── TTS ───────────────────────────────────────────────────────────────────
  let ttsEnabled = false, voices = [];
  function loadVoices() { voices = window.speechSynthesis?.getVoices() || []; }
  loadVoices();
  if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = loadVoices;

  function speak(text) {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const v = voices.find(v => v.lang.startsWith("en"));
    if (v) utt.voice = v;
    window.speechSynthesis.speak(utt);
  }

  ttsBtn.addEventListener("click", () => {
    ttsEnabled = !ttsEnabled;
    ttsBtn.classList.toggle("active", ttsEnabled);
    ttsBtn.title = ttsEnabled ? "Voice reply ON" : "Voice reply OFF";
    if (!ttsEnabled) window.speechSynthesis?.cancel();
  });
});
