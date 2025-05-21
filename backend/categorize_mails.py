from take_mails import take_daily_mails
from mail_classifier import MailClassifier
from pymongo import MongoClient
import os

categorized_mails = []

collection = None

def categorizer_mails():
    classifier = MailClassifier()
    global categorized_mails 
    categorized_mails = []
    list_of_daily_mails, snippet = take_daily_mails()
    
    for item in list_of_daily_mails:
        # İçerik kontrolü - text alanını kaldırıyoruz
        content_to_classify = item.get('content', '') or item.get('body', '') or item.get('snippet', '')
        
        result = classifier.classify_mail(content_to_classify)
        mail_data = {
            "id": item['id'],
            "content": item.get('content', ''),
            "body": item.get('content', ''),  # Eski uyumluluk için
            "snippet": item.get('snippet', ''),
            "date": item['date'].strftime("%Y-%m-%d"),
            "predicted_class": result['predicted_class'],
            "confidence_score": result['confidence_score'],
            "all_scores": result['all_scores'],
            "sender": item.get('sender', 'Bilinmeyen Gönderici'),
            "subject": item.get('subject', '') or item.get('snippet', 'Konu yok')
        }
        categorized_mails.append(mail_data)
    
    return categorized_mails


if __name__ == "__main__" :
    categorizer_mails()
    if categorized_mails:
        print(categorized_mails[0])     