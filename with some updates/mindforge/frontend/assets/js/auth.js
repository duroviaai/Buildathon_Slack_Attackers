import { api } from "./api.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── Avatar animation (login success) ───────────────────────────────────────

function animateAvatarToCorner(name) {
  const initial = name.charAt(0).toUpperCase();
  const avatar = document.getElementById("avatar-anim");
  const letter = document.getElementById("avatar-letter");
  if (!avatar || !letter) return;

  letter.textContent = initial;
  avatar.classList.remove("hidden");

  // Start centered → animate to top-left
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      avatar.classList.add("avatar-fly");
    });
  });
}

// ─── Signup ──────────────────────────────────────────────────────────────────

async function handleSignup(e) {
  e.preventDefault();
  clearErrors();

  const name     = document.getElementById("name").value.trim();
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirm  = document.getElementById("confirm").value;
  const role     = document.getElementById("role").value;
  const btn      = document.getElementById("submit-btn");

  // Client-side validation
  let valid = true;
  if (!name)                              { showError("name", "Full name is required.");          valid = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError("email", "Enter a valid email.");  valid = false; }
  if (password.length < 6)               { showError("password", "Min 6 characters.");           valid = false; }
  if (password !== confirm)              { showError("confirm", "Passwords do not match.");       valid = false; }
  if (!valid) return;

  setLoading(btn, true);
  const { data, error } = await api.register({ name, email, password, role });
  setLoading(btn, false);

  if (error) { showError("form", error); return; }

  // Success → redirect to login with flash param
  window.location.href = `login.html?registered=1`;
}

// ─── Login ───────────────────────────────────────────────────────────────────

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

  // Persist token + user info
  localStorage.setItem("mf_token", data.token);
  localStorage.setItem("mf_user",  JSON.stringify(data.user));

  // Animate avatar then redirect
  animateAvatarToCorner(data.user.name);
  setTimeout(() => { window.location.href = "dashboard.html"; }, 1200);
}

// ─── Init ────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  const loginForm  = document.getElementById("login-form");

  if (signupForm) signupForm.addEventListener("submit", handleSignup);
  if (loginForm)  loginForm.addEventListener("submit", handleLogin);

  // Show "registered" flash on login page
  if (new URLSearchParams(location.search).get("registered")) {
    const flash = document.getElementById("flash-msg");
    if (flash) flash.classList.remove("hidden");
  }
});
