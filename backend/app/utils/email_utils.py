import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_otp_email(to_email: str, otp: str):
    if not settings.EMAIL_USER or not settings.EMAIL_PASSWORD:
        print(f"SMTP credentials not configured. OTP for {to_email} is: {otp}")
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = settings.EMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = "Smart Land Management - Password Reset OTP"

        body = f"Your OTP for password reset is {otp}.\nIt is valid for 5 minutes.\nIf you did not request a password reset, please ignore this email."
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
        server.starttls()
        server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        # Print OTP to console as fallback during development if email fails
        print(f"Fallback. OTP for {to_email} is: {otp}")
        return False
