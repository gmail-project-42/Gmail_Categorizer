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



def get_text_from_payload(payload):
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                data = part['body']['data']
                return base64.urlsafe_b64decode(data).decode('utf-8')
    elif payload['mimeType'] == 'text/plain':
        data = payload['body']['data']
        return base64.urlsafe_b64decode(data).decode('utf-8')
    return None




def strip_html_tags(html):
    """
    HTML etiketlerini temizler ve düz metin döndürür.
    """
    if not html:
        return ""
        
    # JavaScript kodlarını tamamen kaldır
    html = re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    
    # CSS kodlarını kaldır
    html = re.sub(r'<style\b[^>]*>.*?</style>', '', html, flags=re.DOTALL)
    
    # HTML yorumlarını kaldır
    html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)
    
    # Diğer tüm HTML etiketlerini kaldır
    html = re.sub(r'<[^>]+>', ' ', html)
    
    # Yeni satırları koru
    html = html.replace('&nbsp;', ' ')
    html = html.replace('&amp;', '&')
    html = html.replace('&lt;', '<')
    html = html.replace('&gt;', '>')
    
    # Ardışık boşlukları tek boşluğa indir
    html = re.sub(r'\s+', ' ', html)
    
    return html.strip()



def get_body_from_payload(payload):
    """
    Mesajın payload bilgisinden mail içeriğini recursive olarak çıkarır.
    
    Öncelikle text/plain içeriğini arar, bulamazsa text/html içeriğini temizleyerek kullanır.
    İç içe multipart yapılar için recursive olarak arama yapar.
    """
    if not payload:
        return "İçerik alınamadı."
    
    def extract_text_from_part(part, depth=0, max_depth=10):
        if depth > max_depth:  # Sonsuz döngüye girmemek için derinlik kontrolü
            return None
            
        mime_type = part.get('mimeType', '')
        
        # Eğer MIME tipi multipart ise alt parçalara git
        if mime_type.startswith('multipart/'):
            parts = part.get('parts', [])
            plain_text = None
            html_text = None
            
            # Önce düz metin ara
            for sub_part in parts:
                text = extract_text_from_part(sub_part, depth + 1)
                sub_mime = sub_part.get('mimeType', '')
                if text:
                    if sub_mime == 'text/plain':
                        plain_text = text
                    elif sub_mime == 'text/html' and not html_text:
                        html_text = text
            
            # Düz metin varsa onu, yoksa HTML'i kullan
            return plain_text or html_text
            
        elif mime_type == 'text/plain':
            body_data = part.get('body', {}).get('data')
            if body_data:
                try:
                    return base64.urlsafe_b64decode(body_data).decode('utf-8')
                except Exception as e:
                    print(f"Decode hatası: {str(e)}")
                    return "İçerik decode edilemedi."
            return None
            
        elif mime_type == 'text/html':
            body_data = part.get('body', {}).get('data')
            if body_data:
                try:
                    html_content = base64.urlsafe_b64decode(body_data).decode('utf-8')
                    return strip_html_tags(html_content)
                except Exception as e:
                    print(f"HTML decode hatası: {str(e)}")
                    return "HTML içerik decode edilemedi."
            return None
            
        # Alt parçalar varsa onları da kontrol et
        elif 'parts' in part:
            for sub_part in part.get('parts', []):
                text = extract_text_from_part(sub_part, depth + 1)
                if text:
                    return text
        
        # Herhangi bir içerik bulunamadı
        return None
    
    # Recursive fonksiyonu çağır
    content = extract_text_from_part(payload)
    
    if content:
        # Fazla boşlukları ve satır başlarını temizle 
        content = re.sub(r'\n\s*\n', '\n\n', content)  # Ardışık boş satırları tek boş satıra indir
        return content.strip()
    else:
        return "İçerik alınamadı."


def take_daily_mails(service):
    
    global list_of_daily_mails
    global list_of_snippets
    
    list_of_daily_mails = []  # Listeyi temizle
    list_of_snippets = []     # Listeyi temizle
    
    service = authenticate_gmail()
    
    today = datetime.now()
    # Son 7 günlük e-postaları almak için
    week_ago = today - timedelta(days=7)
    
    # Zaman dilimlerini UTC'ye çevir
    week_ago_utc = week_ago.astimezone(timezone.utc)
    
    # Timestamp değerlerini al
    after_ts = int(week_ago_utc.timestamp())
    
    # Query'yi değiştir - sadece son X günün maillerini al
    query = f'after:{after_ts}'
    print(f"Mail sorgusu: {query}")
    
    results = service.users().messages().list(userId='me', q=query, maxResults=100).execute()
    mails = results.get('messages', [])
    
    if not mails:
        print("Son 7 gün için e-posta bulunamadı.")
    else:
        print(f"Son günlerin e-postaları: {len(mails)} adet")
        for mail in mails:
            msg_id = mail['id']   
            try:
                mail = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
                snippet = mail.get('snippet', '')
                payload = mail.get('payload', {})
                
                # Yeni get_body_from_payload fonksiyonunu kullan, artık detaylı içerik alabiliyoruz
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
                        
                # Mail nesnesini oluştur
                mail_data = {
                    'id': msg_id,
                    'content': content,  # Artık content adı altında içerik ekleniyor
                    'snippet': snippet,
                    'date': received_date,
                    'sender': sender,
                    'subject': subject if subject and subject != 'Konu yok' else snippet
                }
                
                list_of_snippets.append(snippet)
                list_of_daily_mails.append(mail_data)
            except Exception as e:
                print(f"Mail {msg_id} alınırken hata: {str(e)}")
            
    return list_of_daily_mails, list_of_snippets, today



def return_mails_and_service():
    service = authenticate_gmail()
    list_of_daily_mails, list_of_snippets, today = take_daily_mails(service)
    return list_of_daily_mails, service, list_of_snippets, today



if __name__ == "__main__":
    list_of_daily_mails, service, list_of_snippets, today = return_mails_and_service()
    print(today)