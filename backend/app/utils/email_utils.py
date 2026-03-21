import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_otp_email(to_email: str, otp: str):
    if not settings.EMAIL_USER or not settings.EMAIL_PASSWORD:
        print(f"\n--- [DEVELOPMENT MODE: NO EMAIL CREDENTIALS] ---")
        print(f"To: {to_email}")
        print(f"OTP: {otp}")
        print(f"-----------------------------------------------\n")
        # Return True in dev mode to allow the flow to continue
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = settings.EMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = "Smart Land Management - Password Reset OTP"

        body = f"Your OTP for password reset is {otp}.\nIt is valid for 5 minutes.\nIf you did not request a password reset, please ignore this email."
        msg.attach(MIMEText(body, 'plain'))

        print(f"DEBUG: Attempting SMTP (STARTTLS) to {settings.EMAIL_HOST}:{settings.EMAIL_PORT}...")
        server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=10)
        server.set_debuglevel(0) # Set to 1 for detailed SMTP logs in console
        server.starttls()
        server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Success: OTP email sent to {to_email}")
        return True
    except smtplib.SMTPAuthenticationError:
        print(f"ERROR: SMTP Authentication failed. Check your EMAIL_USER and EMAIL_PASSWORD.")
        print(f"TIP: If using Gmail, you MUST use an 'App Password', not your regular login password.")
        print(f"DEBUG FALLBACK: OTP for {to_email} is: {otp}")
        return False
    except Exception as e:
        print(f"ERROR: Failed to send email to {to_email}: {e}")
        print(f"DEBUG FALLBACK: OTP for {to_email} is: {otp}")
        return False
