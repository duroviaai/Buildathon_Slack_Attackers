document.addEventListener("DOMContentLoaded", () => {
  const chatInput       = document.getElementById("chatInput");
  const sendBtn         = document.getElementById("sendBtn");
  const chatContainer   = document.getElementById("chatContainer");
  const expandBtn       = document.getElementById("expandBtn");
  const expandLabel     = document.getElementById("expandLabel");
  const chatCard        = document.getElementById("chatCard");
  const newChatBtn      = document.getElementById("newChatBtn");
  const chatHistoryList = document.getElementById("chatHistoryList");
  const attachBtn       = document.getElementById("attachBtn");
  const fileInput       = document.getElementById("fileInput");
  const micBtn          = document.getElementById("micBtn");
  const ttsBtn          = document.getElementById("ttsBtn");

  let lastAIResponse = "";

  const DEFAULT_INNER = `<div class="flex items-start gap-2.5 msg-animate">
    <div class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style="background:linear-gradient(135deg,#6C5CE7,#4A90E2)">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
    </div>
    <div class="bg-slate-700 text-white px-4 py-3 rounded-xl max-w-[70%] text-sm leading-relaxed whitespace-pre-line shadow-sm">
      Hi! I'm MindForge AI. Ask me anything.
    </div>
  </div>`;
  const DEFAULT_MSG = `<div class="msg-wrapper max-w-[900px] mx-auto space-y-3">${DEFAULT_INNER}</div>`;

  // ── Chat persistence ──────────────────────────────────────────────────────
  const STORAGE_KEY = "mf_chats";
  let currentChatId = null;

  function loadAllChats() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  function saveAllChats(chats) { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats)); }
  function getCurrentChat() { return loadAllChats().find(c => c.id === currentChatId) || null; }

  function persistMessage(role, text, extra) {
    const chats = loadAllChats();
    const idx = chats.findIndex(c => c.id === currentChatId);
    if (idx === -1) return;
    chats[idx].messages.push({ role, text, ...extra });
    if (role === "user" && chats[idx].messages.filter(m => m.role === "user").length === 1) {
      chats[idx].title = (text || "📎 File").slice(0, 40) + ((text || "").length > 40 ? "…" : "");
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
    if (!chatHistoryList) return;
    const chats = loadAllChats();
    chatHistoryList.innerHTML = chats.map(c => `
      <div class="flex items-center justify-between group px-3 py-2 rounded-lg text-sm cursor-pointer transition ${
        c.id === currentChatId ? "bg-violet-100 text-violet-700 font-semibold" : "text-gray-600 hover:bg-purple-50"
      }" data-id="${c.id}">
        <span class="truncate flex-1">${escHtml(c.title)}</span>
        <button class="delete-chat ml-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition" data-id="${c.id}" title="Delete">✕</button>
      </div>`).join("");

    chatHistoryList.querySelectorAll("[data-id]").forEach(el => {
      el.addEventListener("click", e => {
        if (e.target.classList.contains("delete-chat")) deleteChat(e.target.dataset.id);
        else switchChat(el.dataset.id);
      });
    });
  }

  function switchChat(id) {
    currentChatId = id;
    const chat = getCurrentChat();
    if (!chat) return;
    chatContainer.innerHTML = `<div class="msg-wrapper max-w-[900px] mx-auto space-y-3">${DEFAULT_INNER}</div>`;
    chat.messages.forEach(m => {
      if (m.role === "user") getMsgWrapper().insertAdjacentHTML("beforeend", m.filePreview ? fileBubble(m.text, m.filePreview, m.fileName) : userBubble(m.text));
      else getMsgWrapper().insertAdjacentHTML("beforeend", aiBubble(m.text));
    });
    scrollBottom();
    renderSidebar();
  }

  function deleteChat(id) {
    let chats = loadAllChats().filter(c => c.id !== id);
    saveAllChats(chats);
    if (currentChatId === id) {
      if (chats.length) { currentChatId = chats[0].id; switchChat(currentChatId); }
      else { createNewChat(); chatContainer.innerHTML = `<div class="msg-wrapper max-w-[900px] mx-auto space-y-3">${DEFAULT_INNER}</div>`; }
    }
    renderSidebar();
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  const existing = loadAllChats();
  if (existing.length) { currentChatId = existing[0].id; switchChat(currentChatId); }
  else createNewChat();

  // ── DOM helpers ───────────────────────────────────────────────────────────
  function getMsgWrapper() { return chatContainer.querySelector(".msg-wrapper"); }
  function scrollBottom() { chatContainer.scrollTop = chatContainer.scrollHeight; }
  function escHtml(str) { return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  function append(html) {
    getMsgWrapper().insertAdjacentHTML("beforeend", html);
    scrollBottom();
  }

  function userBubble(text) {
    return `<div class="flex justify-end msg-animate">
      <div class="bg-indigo-500 text-white px-4 py-3 rounded-xl max-w-[60%] text-sm leading-relaxed whitespace-pre-line shadow-sm">${escHtml(text)}</div>
    </div>`;
  }

  function fileBubble(caption, previewSrc, fileName) {
    const isImage = previewSrc && previewSrc.startsWith("data:image");
    return `<div class="flex justify-end msg-animate">
      <div class="bg-indigo-500 text-white px-4 py-3 rounded-xl max-w-[60%] text-sm shadow-sm space-y-2">
        ${isImage ? `<img src="${previewSrc}" class="rounded-lg max-h-40 object-cover w-full" />` : `<div class="flex items-center gap-2 bg-indigo-400 rounded-lg px-3 py-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span class="truncate text-xs">${escHtml(fileName || "file")}</span></div>`}
        ${caption ? `<div class="whitespace-pre-line">${escHtml(caption)}</div>` : ""}
      </div>
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

  function actionButtons() {
    const id = "actions-" + Date.now();
    return `<div id="${id}" class="flex gap-2 mt-2 ml-9 msg-animate">
      <button class="fc-btn px-3 py-1 rounded-lg text-sm bg-indigo-500 text-white hover:bg-indigo-600 transition" data-id="${id}">Generate Flashcards</button>
      <button class="qz-btn px-3 py-1 rounded-lg text-sm bg-green-500 text-white hover:bg-green-600 transition" data-id="${id}">Generate Quiz</button>
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

  // ── Flashcard / Quiz renderers ────────────────────────────────────────────
  function flashcardResultHtml(cards) {
    const items = cards.map(c => `
      <div class="bg-slate-800 rounded-xl px-4 py-3 text-sm">
        <p class="font-bold text-white">${escHtml(c.term || c.front || c.question || "")}</p>
        <p class="text-slate-300 mt-1">${escHtml(c.definition || c.back || c.answer || "")}</p>
      </div>`).join("");
    return `<div class="ml-9 mt-2 space-y-2 msg-animate">${items}</div>`;
  }

  function quizResultHtml(questions) {
    const items = questions.map((q, qi) => {
      const opts = (q.options || q.choices || []);
      const correctIdx = typeof q.correct_index !== "undefined" ? q.correct_index
                       : typeof q.answer_index  !== "undefined" ? q.answer_index
                       : opts.findIndex(o => o === q.correct || o === q.answer);
      const optHtml = opts.map((opt, oi) => `
        <button type="button" data-qi="${qi}" data-oi="${oi}" data-correct="${correctIdx}"
          class="chat-quiz-opt w-full text-left px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-xs hover:border-indigo-400 transition mt-1">
          <span class="font-bold mr-2">${String.fromCharCode(65+oi)}.</span>${escHtml(opt)}
        </button>`).join("");
      return `<div class="bg-slate-700 rounded-xl px-4 py-3 text-sm">
        <p class="font-semibold text-white mb-2">${qi+1}. ${escHtml(q.question)}</p>
        <div id="chat-opts-${qi}-${Date.now()}" class="space-y-1">${optHtml}</div>
      </div>`;
    }).join("");
    return `<div class="ml-9 mt-2 space-y-3 msg-animate">${items}</div>`;
  }

  // ── Action button click delegation ────────────────────────────────────────
  getMsgWrapper().addEventListener("click", async (e) => {
    // Quiz option click
    const optBtn = e.target.closest(".chat-quiz-opt");
    if (optBtn) {
      const parent = optBtn.closest("div[id^='chat-opts-']") || optBtn.parentElement;
      if (parent.dataset.answered) return;
      parent.dataset.answered = "1";
      const correctIdx = parseInt(optBtn.dataset.correct);
      parent.querySelectorAll(".chat-quiz-opt").forEach((b, i) => {
        b.disabled = true;
        if (i === correctIdx) b.classList.add("!bg-green-600", "!border-green-500", "!text-white");
        else if (b === optBtn) b.classList.add("!bg-red-600", "!border-red-500", "!text-white");
      });
      return;
    }

    const fcBtn = e.target.closest(".fc-btn");
    const qzBtn = e.target.closest(".qz-btn");
    if (!fcBtn && !qzBtn) return;

    const btnEl = fcBtn || qzBtn;
    const isFC = !!fcBtn;
    const actionId = btnEl.dataset.id;
    const actionBlock = document.getElementById(actionId);

    if (!lastAIResponse) return;
    // Disable both buttons in this block
    actionBlock?.querySelectorAll("button").forEach(b => b.disabled = true);

    const loadingHtml = `<div id="loading-${actionId}" class="ml-9 mt-1 text-sm text-slate-400 italic msg-animate">${isFC ? "Generating flashcards..." : "Generating quiz..."}</div>`;
    actionBlock?.insertAdjacentHTML("afterend", loadingHtml);
    scrollBottom();

    try {
      const res = await fetch(isFC ? "/api/generate-flashcards" : "/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lastAIResponse })
      });
      const data = await res.json();
      document.getElementById("loading-" + actionId)?.remove();

      if (!res.ok) throw new Error(data.error || "Failed");

      const resultHtml = isFC
        ? flashcardResultHtml(data.flashcards || data.cards || [])
        : quizResultHtml(data.questions || data.quiz || []);

      actionBlock?.insertAdjacentHTML("afterend", resultHtml);
      scrollBottom();
    } catch {
      document.getElementById("loading-" + actionId)?.remove();
      actionBlock?.insertAdjacentHTML("afterend",
        `<div class="ml-9 mt-1 text-sm text-red-400 msg-animate">⚠️ Failed to generate. Try again.</div>`);
      // Re-enable buttons on failure
      actionBlock?.querySelectorAll("button").forEach(b => b.disabled = false);
      scrollBottom();
    }
  });

  // ── Send message (text) ───────────────────────────────────────────────────
  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = "";
    sendBtn.disabled = true;
    sendBtn.style.opacity = "0.5";
    append(userBubble(text));
    persistMessage("user", text);
    await fetchAIReply(text, null);
    sendBtn.disabled = false;
    sendBtn.style.opacity = "1";
    chatInput.focus();
  }

  // ── Send file ─────────────────────────────────────────────────────────────
  let pendingFile = null;

  attachBtn?.addEventListener("click", () => fileInput?.click());

  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    fileInput.value = "";
    pendingFile = file;

    const caption = chatInput.value.trim();
    chatInput.value = "";

    let previewSrc = null;
    if (file.type.startsWith("image/")) {
      previewSrc = await new Promise(res => {
        const r = new FileReader();
        r.onload = e => res(e.target.result);
        r.readAsDataURL(file);
      });
    }

    append(fileBubble(caption, previewSrc, file.name));
    persistMessage("user", caption, { filePreview: previewSrc, fileName: file.name });

    sendBtn.disabled = true;
    sendBtn.style.opacity = "0.5";
    await fetchAIReply(caption, file);
    sendBtn.disabled = false;
    sendBtn.style.opacity = "1";
    pendingFile = null;
    chatInput.focus();
  });

  // ── Core fetch ────────────────────────────────────────────────────────────
  async function fetchAIReply(text, file) {
    const typingId = "typing-" + Date.now();
    append(typingBubble(typingId));

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
      document.getElementById(typingId)?.remove();
      const reply = data.reply || "⚠️ No response received.";
      lastAIResponse = reply;
      append(aiBubble(reply));
      append(actionButtons());
      persistMessage("ai", reply);
      if (ttsEnabled) speak(reply);
    } catch (err) {
      clearTimeout(timeout);
      document.getElementById(typingId)?.remove();
      append(errorBubble(err.name === "AbortError" ? "⚠️ Request timed out." : "⚠️ AI is temporarily unavailable."));
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // ── Voice to Text (STT via backend Whisper) ────────────────────────────────
  let mediaRecorder = null;
  let audioChunks   = [];
  let isListening   = false;

  micBtn?.addEventListener("click", async () => {
    if (isListening) {
      mediaRecorder?.stop();
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      alert("Microphone access denied. Please allow mic permission and try again.");
      return;
    }

    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      isListening = false;
      micBtn.style.color = "";
      micBtn.style.animation = "";
      micBtn.disabled = false;

      const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      if (blob.size < 1000) return;

      const prev = chatInput.placeholder;
      chatInput.placeholder = "🎤 Transcribing...";
      chatInput.disabled = true;

      try {
        const fd = new FormData();
        fd.append("audio", blob, "recording.webm");
        const res  = await fetch("/api/transcribe", { method: "POST", body: fd });
        const data = await res.json();
        if (data.transcript) {
          chatInput.value = data.transcript;
          chatInput.focus();
        } else {
          chatInput.placeholder = data.error || "Transcription failed. Try again.";
          setTimeout(() => { chatInput.placeholder = prev; }, 3000);
        }
      } catch (e) {
        chatInput.placeholder = "⚠️ Network error during transcription.";
        setTimeout(() => { chatInput.placeholder = prev; }, 3000);
      } finally {
        chatInput.disabled = false;
        chatInput.placeholder = prev;
      }
    };

    mediaRecorder.start();
    isListening = true;
    micBtn.style.color = "#ef4444";
    micBtn.style.animation = "pulse 1s infinite";
  });

  // ── Text to Speech (TTS) ──────────────────────────────────────────────────
  let ttsEnabled = false;
  let voices = [];

  function loadVoices() {
    voices = window.speechSynthesis?.getVoices() || [];
  }
  loadVoices();
  if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = loadVoices;

  function speak(text) {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const engVoice = voices.find(v => v.lang.startsWith("en"));
    if (engVoice) utt.voice = engVoice;
    utt.rate = 1;
    utt.pitch = 1;
    utt.volume = 1;
    window.speechSynthesis.speak(utt);
  }

  ttsBtn?.addEventListener("click", () => {
    ttsEnabled = !ttsEnabled;
    ttsBtn.style.color = ttsEnabled ? "#7c3aed" : "";
    ttsBtn.title = ttsEnabled ? "Voice reply ON (click to turn off)" : "Voice reply OFF (click to turn on)";
    if (!ttsEnabled) window.speechSynthesis?.cancel();
  });

  // ── Expand / Collapse ─────────────────────────────────────────────────────
  expandBtn?.addEventListener("click", () => {
    const isExpanded = chatCard.classList.toggle("expanded");
    expandLabel.textContent = isExpanded ? "Collapse" : "Expand";
    const icon = expandBtn.querySelector("i, svg");
    if (icon?.setAttribute) icon.setAttribute("data-lucide", isExpanded ? "minimize-2" : "maximize-2");
    if (window.lucide) lucide.createIcons();
    scrollBottom();
  });

  // ── New Chat ──────────────────────────────────────────────────────────────
  newChatBtn?.addEventListener("click", () => {
    createNewChat();
    chatContainer.innerHTML = DEFAULT_MSG;
    chatInput.value = "";
    chatInput.focus();
  });
});
