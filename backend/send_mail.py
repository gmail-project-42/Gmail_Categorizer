# Gerekli kütüphaneleri içe aktar
import os
import base64
import json
import google.auth
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials

# Gmail API'sine erişim için gerekli izinler
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def authenticate_gmail():
    """Gmail API'sine kimlik doğrulaması yapar ve bir hizmet nesnesi döndürür."""
    creds = None
    # Token dosyasını kontrol et
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    # Eğer kimlik bilgileri yoksa, kullanıcıdan giriş yapmasını iste
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Kimlik bilgilerini kaydet
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return build('gmail', 'v1', credentials=creds)

def send_email(service, to, subject, body):
    """E-posta gönderir."""
    message = MIMEText(body)
    message['to'] = to
    message['subject'] = subject
    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    message = {'raw': raw_message}
    service.users().messages().send(userId='me', body=message).execute()

if __name__ == '__main__':
    # Gmail API'sine bağlan
    service = authenticate_gmail()
    # Kullanıcıdan e-posta bilgilerini al
    to = input("Alıcı e-posta adresini giriniz: ")
    subject = input("E-posta konusunu giriniz: ")
    body = input("E-posta içeriğini giriniz: ")
    send_email(service, to, subject, body)
    print("E-posta başarıyla gönderildi.")
