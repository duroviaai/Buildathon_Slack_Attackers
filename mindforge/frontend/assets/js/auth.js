const BASE_URL = "http://localhost:5000/api";

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("mf_token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json.error || "Something went wrong.", status: res.status };
    return { data: json };
  } catch {
    return { error: "Network error. Is the server running?" };
  }
}

const api = {
  register:      (p) => apiFetch("/auth/register",       { method: "POST", body: JSON.stringify(p) }),
  login:         (p) => apiFetch("/auth/login",          { method: "POST", body: JSON.stringify(p) }),
  sendOtp:       (p) => apiFetch("/auth/send-otp",       { method: "POST", body: JSON.stringify(p) }),
  verifyOtp:     (p) => apiFetch("/auth/verify-otp",     { method: "POST", body: JSON.stringify(p) }),
  resetPassword: (p) => apiFetch("/auth/reset-password", { method: "POST", body: JSON.stringify(p) }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function showError(fieldId, msg) {
  const el = document.getElementById(`err-${fieldId}`);
  if (el) { el.textContent = msg; el.classList.remove("hidden"); }
}

function clearErrors() {
  document.querySelectorAll("[id^='err-']").forEach((el) => {
    el.textContent = "";
    el.classList.add("hidden");
  });
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector(".btn-text").classList.toggle("hidden", loading);
  btn.querySelector(".btn-spinner").classList.toggle("hidden", !loading);
}

function animateAvatarToCorner(name) {
  const avatar = document.getElementById("avatar-anim");
  const letter = document.getElementById("avatar-letter");
  if (!avatar || !letter) return;
  letter.textContent = name.charAt(0).toUpperCase();
  avatar.style.display = "flex";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { avatar.classList.add("avatar-fly"); });
  });
}

// ─── Signup: Step 4 submit → send OTP → go to step 5 ─────────────────────────

async function handleSignup(e) {
  e.preventDefault();
  clearErrors();

  const name     = document.getElementById("name").value.trim();
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirm  = document.getElementById("confirm").value;
  const role     = document.getElementById("role").value;
  const btn      = document.getElementById("submit-btn");

  let valid = true;
  if (!name)                                        { showError("name",     "Full name is required.");  valid = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))   { showError("email",    "Enter a valid email.");    valid = false; }
  if (password.length < 6)                          { showError("password", "Min 6 characters.");       valid = false; }
  if (password !== confirm)                         { showError("confirm",  "Passwords do not match."); valid = false; }
  if (!valid) return;

  setLoading(btn, true);
  const { data, error } = await api.sendOtp({ email, purpose: "register" });
  setLoading(btn, false);

  if (error) { showError("form", error); return; }

  // Store pending registration data
  sessionStorage.setItem("mf_pending_reg", JSON.stringify({ name, email, password, role }));

  // Show OTP step
  document.getElementById("otp-email-display").textContent = email;
  document.querySelectorAll(".step").forEach((s, i) => s.classList.toggle("active", i + 1 === 5));
  for (let i = 1; i <= 5; i++) document.getElementById(`dot-${i}`).classList.toggle("active", i === 5);
}

// ─── OTP form submit → verify OTP → register ──────────────────────────────────

async function handleOtpSubmit(e) {
  e.preventDefault();
  clearErrors();

  const otp = document.getElementById("otp-input").value.trim();
  const btn = document.getElementById("otp-submit-btn");

  if (!otp || otp.length !== 6) { showError("otp", "Enter the 6-digit code."); return; }

  const pending = JSON.parse(sessionStorage.getItem("mf_pending_reg") || "{}");
  if (!pending.email) { showError("otp-form", "Session expired. Please start over."); return; }

  setLoading(btn, true);

  // Verify OTP then register in one shot — backend verifies OTP on register route
  // We verify first, then register
  const { error: otpErr } = await api.verifyOtp({ email: pending.email, otp, purpose: "register" });
  if (otpErr) { setLoading(btn, false); showError("otp-form", otpErr); return; }

  const { data, error } = await api.register(pending);
  setLoading(btn, false);

  if (error) { showError("otp-form", error); return; }

  sessionStorage.removeItem("mf_pending_reg");

  // Auto-login after registration
  const { data: loginData, error: loginErr } = await api.login({ email: pending.email, password: pending.password });
  if (loginErr) { window.location.href = "/login.html?registered=1"; return; }

  localStorage.setItem("mf_token", loginData.token);
  localStorage.setItem("mf_user", JSON.stringify(loginData.user));
  window.location.href = "/dashboard.html";
}

// ─── Login ────────────────────────────────────────────────────────────────────

async function handleLogin(e) {
  e.preventDefault();
  clearErrors();

  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn      = document.getElementById("submit-btn");

  if (!email || !password) { showError("form", "Email and password are required."); return; }

  setLoading(btn, true);
  const { data, error } = await api.login({ email, password });
  setLoading(btn, false);

  if (error) { showError("form", error); return; }

  localStorage.setItem("mf_token", data.token);
  localStorage.setItem("mf_user",  JSON.stringify(data.user));

  animateAvatarToCorner(data.user.name);
  setTimeout(() => { window.location.href = "/dashboard.html"; }, 1200);
}

// ─── Forgot Password: send OTP ────────────────────────────────────────────────

async function handleForgotSend(e) {
  e.preventDefault();
  clearErrors();

  const email = document.getElementById("forgot-email").value.trim();
  const btn   = document.getElementById("forgot-btn");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError("forgot-email", "Enter a valid email."); return;
  }

  setLoading(btn, true);
  const { data, error } = await api.sendOtp({ email, purpose: "reset" });
  setLoading(btn, false);

  if (error) { showError("forgot-form", error); return; }

  sessionStorage.setItem("mf_reset_email", email);
  document.getElementById("reset-email-display").textContent = email;

  // Go to reset step (step 4 in login)
  loginGoStep(4);
}

// ─── Reset Password: verify OTP + set new password ───────────────────────────

async function handleReset(e) {
  e.preventDefault();
  clearErrors();

  const otp      = document.getElementById("reset-otp").value.trim();
  const password = document.getElementById("reset-password").value;
  const confirm  = document.getElementById("reset-confirm").value;
  const btn      = document.getElementById("reset-btn");
  const email    = sessionStorage.getItem("mf_reset_email") || "";

  let valid = true;
  if (!otp || otp.length !== 6)  { showError("reset-otp",      "Enter the 6-digit code.");   valid = false; }
  if (password.length < 6)       { showError("reset-password", "Min 6 characters.");          valid = false; }
  if (password !== confirm)      { showError("reset-confirm",  "Passwords do not match.");    valid = false; }
  if (!valid) return;

  setLoading(btn, true);
  const { data, error } = await api.resetPassword({ email, otp, password });
  setLoading(btn, false);

  if (error) { showError("reset-form", error); return; }

  sessionStorage.removeItem("mf_reset_email");
  // Show success, go back to login step
  loginGoStep(2);
  showError("form", ""); // clear
  const flash = document.getElementById("reset-success");
  if (flash) { flash.classList.remove("hidden"); setTimeout(() => flash.classList.add("hidden"), 4000); }
}

// ─── Login page step navigation ───────────────────────────────────────────────

function loginGoStep(n) {
  document.querySelectorAll(".step").forEach((s, i) => s.classList.toggle("active", i + 1 === n));
  const total = document.querySelectorAll("[id^='dot-']").length;
  for (let i = 1; i <= total; i++) {
    const d = document.getElementById(`dot-${i}`);
    if (d) d.classList.toggle("active", i === n);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  const otpForm    = document.getElementById("otp-form");
  const loginForm  = document.getElementById("login-form");
  const forgotForm = document.getElementById("forgot-form");
  const resetForm  = document.getElementById("reset-form");

  if (signupForm) signupForm.addEventListener("submit", handleSignup);
  if (otpForm)    otpForm.addEventListener("submit", handleOtpSubmit);
  if (loginForm)  loginForm.addEventListener("submit", handleLogin);
  if (forgotForm) forgotForm.addEventListener("submit", handleForgotSend);
  if (resetForm)  resetForm.addEventListener("submit", handleReset);

  if (new URLSearchParams(location.search).get("registered")) {
    const flash = document.getElementById("flash-msg");
    if (flash) flash.classList.remove("hidden");
  }
});
