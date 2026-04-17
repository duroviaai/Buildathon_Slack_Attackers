import random
import smtplib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# In-memory store: { email: { otp, expires_at, purpose } }
_otp_store: dict = {}

OTP_TTL = 600  # 10 minutes


def _send_email(to: str, subject: str, html: str):
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    port = int(os.environ.get("SMTP_PORT", 587))
    user = os.environ.get("SMTP_USER", "")
    pwd  = os.environ.get("SMTP_PASS", "")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"MindForge <{user}>"
    msg["To"]      = to
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(host, port) as s:
        s.ehlo()
        s.starttls()
        s.login(user, pwd)
        s.sendmail(user, to, msg.as_string())


def send_otp(email: str, purpose: str) -> tuple[bool, str]:
    """Generate and email a 6-digit OTP. purpose: 'register' | 'reset'"""
    otp = str(random.randint(100000, 999999))
    _otp_store[email] = {"otp": otp, "expires_at": time.time() + OTP_TTL, "purpose": purpose}

    action = "verify your email" if purpose == "register" else "reset your password"
    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;padding:32px;
                background:#f6f7fb;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:24px;font-weight:800;color:#111;">Mind<span style="color:#4255ff;">Forge</span></span>
      </div>
      <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
        <p style="color:#374151;font-size:15px;margin:0 0 16px;">
          Use the code below to {action}:
        </p>
        <div style="text-align:center;margin:24px 0;">
          <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#4255ff;">{otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px;margin:0;">
          This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
        </p>
      </div>
    </div>
    """
    try:
        _send_email(email, "Your MindForge verification code", html)
        return True, ""
    except Exception as e:
        return False, str(e)


def verify_otp(email: str, otp: str, purpose: str) -> tuple[bool, str]:
    """Verify OTP. Returns (valid, error_message)."""
    record = _otp_store.get(email)
    if not record:
        return False, "No OTP requested for this email."
    if record["purpose"] != purpose:
        return False, "Invalid OTP purpose."
    if time.time() > record["expires_at"]:
        _otp_store.pop(email, None)
        return False, "OTP has expired. Please request a new one."
    if record["otp"] != otp:
        return False, "Incorrect OTP."
    _otp_store.pop(email, None)
    return True, ""
