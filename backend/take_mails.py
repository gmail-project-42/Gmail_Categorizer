# Gerekli kütüphaneleri içe aktar
import os
import base64
import re
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from datetime import datetime, timedelta, timezone


SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send'
]



list_of_daily_mails = []
list_of_snippets = []



def authenticate_gmail():
    creds = None
    token_file = f'token.json'
    if os.path.exists(token_file):
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)
        if not set(SCOPES).issubset(set(creds.scopes)):
            creds = None
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print("Token yenileme sırasında hata oluştu:", str(e))
                creds = None
        if not creds:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_file, 'w') as token:
            token.write(creds.to_json())
    return build('gmail', 'v1', credentials=creds)




def test():
    global list_of_daily_mails
    global list_of_snippets

    list_of_daily_mails = []
    list_of_snippets = []     

    service = authenticate_gmail()

    today = datetime.now()
    week_ago = today - timedelta(days=7)
    week_ago_utc = week_ago.astimezone(timezone.utc)
    after_ts = int(week_ago_utc.timestamp())

    query = f'after:{after_ts}'

    results = service.users().messages().list(userId='me', q=query, maxResults=100).execute()
    mails = results.get('messages', [])
    
    for mail in mails:
        msg_id = mail['id']
        mail_data = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
        payload = mail_data.get('payload', {})
        
        # Başlıkları al
        headers = payload.get('headers', [])
        subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), 'Konu yok')
        sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), 'Bilinmeyen Gönderici')
        
        print(f"\nE-posta ID: {msg_id}")
        print(f"Konu: {subject}")
        print(f"Gönderen: {sender}")
        
        def get_content_from_parts(parts):
            html_content = None
            plain_content = None
            
            for part in parts:
                mime_type = part.get('mimeType', '')
                
                # Multipart içerik kontrolü
                if mime_type.startswith('multipart/'):
                    sub_parts = part.get('parts', [])
                    sub_content = get_content_from_parts(sub_parts)
                    if sub_content:
                        if isinstance(sub_content, tuple):
                            html_content = html_content or sub_content[0]
                            plain_content = plain_content or sub_content[1]
                        else:
                            html_content = html_content or sub_content
                
                # HTML içerik kontrolü
                elif mime_type == 'text/html':
                    data = part.get('body', {}).get('data')
                    if data:
                        try:
                            content = base64.urlsafe_b64decode(data).decode('utf-8')
                            html_content = content
                        except Exception as e:
                            print(f"HTML decode hatası: {str(e)}")
                
                # Düz metin kontrolü
                elif mime_type == 'text/plain':
                    data = part.get('body', {}).get('data')
                    if data:
                        try:
                            content = base64.urlsafe_b64decode(data).decode('utf-8')
                            plain_content = content
                        except Exception as e:
                            print(f"Text decode hatası: {str(e)}")
            
            # Eğer hem HTML hem düz metin varsa, ikisini de döndür
            if html_content and plain_content:
                return (html_content, plain_content)
            # Sadece HTML varsa
            elif html_content:
                return html_content
            # Sadece düz metin varsa
            elif plain_content:
                return plain_content
            
            return None
        
        # İçeriği al
        content = get_content_from_parts(payload.get('parts', []))
        
        if content:
            if isinstance(content, tuple):
                html_content, plain_content = content
                print("\nHTML İçerik:")
                print(html_content)
                print("\nDüz Metin İçerik:")
                print(plain_content)
            else:
                print("\nİçerik:")
                print(content)
        else:
            # Eğer parts yoksa, doğrudan body'den içeriği al
            body_data = payload.get('body', {}).get('data')
            if body_data:
                try:
                    content = base64.urlsafe_b64decode(body_data).decode('utf-8')
                    print("\nİçerik (Body):")
                    print(content)
                except Exception as e:
                    print(f"Body decode hatası: {str(e)}")



def get_body_from_payload(payload):
    """
    Mesajın payload bilgisinden mail içeriğini recursive olarak çıkarır.
    HTML içeriğini korur ve düzgün şekilde işler.
    """
    if not payload:
        return "İçerik alınamadı."
    
    def extract_content_from_part(part, depth=0, max_depth=10):
        if depth > max_depth:
            return None
            
        mime_type = part.get('mimeType', '')
        
        # Multipart içerik kontrolü
        if mime_type.startswith('multipart/'):
            parts = part.get('parts', [])
            html_content = None
            plain_text = None
            
            for sub_part in parts:
                content = extract_content_from_part(sub_part, depth + 1)
                sub_mime = sub_part.get('mimeType', '')
                if content:
                    if sub_mime == 'text/html':
                        html_content = content
                    elif sub_mime == 'text/plain' and not plain_text:
                        plain_text = content
            
            return html_content or plain_text
            
        # HTML içerik kontrolü
        elif mime_type == 'text/html':
            body_data = part.get('body', {}).get('data')
            if body_data:
                try:
                    return base64.urlsafe_b64decode(body_data).decode('utf-8')
                except Exception as e:
                    print(f"HTML decode hatası: {str(e)}")
                    return None
                    
        # Düz metin kontrolü
        elif mime_type == 'text/plain':
            body_data = part.get('body', {}).get('data')
            if body_data:
                try:
                    return base64.urlsafe_b64decode(body_data).decode('utf-8')
                except Exception as e:
                    print(f"Text decode hatası: {str(e)}")
                    return None
        
        # Alt parçaları kontrol et
        elif 'parts' in part:
            for sub_part in part.get('parts', []):
                content = extract_content_from_part(sub_part, depth + 1)
                if content:
                    return content
        
        return None
    
    content = extract_content_from_part(payload)
    return content if content else "İçerik alınamadı."


def take_daily_mails():
    global list_of_daily_mails
    global list_of_snippets
    
    list_of_daily_mails = []
    list_of_snippets = []
    
    service = authenticate_gmail()
    
    today = datetime.now()
    week_ago = today - timedelta(days=7)
    week_ago_utc = week_ago.astimezone(timezone.utc)
    after_ts = int(week_ago_utc.timestamp())
    
    query = f'after:{after_ts}'
    
    results = service.users().messages().list(userId='me', q=query, maxResults=100).execute()
    mails = results.get('messages', [])
    
    if not mails:
        print("Son 7 gün için e-posta bulunamadı.")
    else:
        print(f"Son günlerin e-postaları: {len(mails)} adet")
        for mail in mails:
            msg_id = mail['id']
            try:
                mail_data = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
                snippet = mail_data.get('snippet', '')
                payload = mail_data.get('payload', {})
                
                # İçeriği al
                content = get_body_from_payload(payload)
                
                headers = payload.get('headers', [])
                sender = 'Bilinmeyen Gönderici'
                subject = 'Konu yok'
                date_str = ''
                
                for header in headers:
                    name = header.get('name', '').lower()
                    if name == 'from':
                        sender = header.get('value', 'Bilinmeyen Gönderici')
                    elif name == 'subject':
                        subject = header.get('value', 'Konu yok')
                    elif name == 'date':
                        date_str = header.get('value', '')
                
                received_date = today
                if date_str:
                    try:
                        from email.utils import parsedate_to_datetime
                        received_date = parsedate_to_datetime(date_str)
                    except Exception as e:
                        print(f"Tarih ayrıştırma hatası: {str(e)}")
                
                mail_info = {
                    'id': msg_id,
                    'content': content,  # HTML içeriği
                    'snippet': snippet,
                    'date': received_date,
                    'sender': sender,
                    'subject': subject if subject and subject != 'Konu yok' else snippet,
                    'body': content  # Eski uyumluluk için body alanını da ekle
                }
                
                list_of_snippets.append(snippet)
                list_of_daily_mails.append(mail_info)
                
            except Exception as e:
                print(f"Mail {msg_id} alınırken hata: {str(e)}")
    
    return list_of_daily_mails, list_of_snippets



if __name__ == "__main__":
    test()