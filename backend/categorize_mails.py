from take_mails import return_mails_and_service
from mail_classifier import MailClassifier
from pymongo import MongoClient
import os

today = None
categorized_mails = []

# Collection değişkeni dışarıdan (api.py'den) atanacak
collection = None

def categorizer_mails():
    classifier = MailClassifier()
    global categorized_mails 
    global today
    categorized_mails = []  # Listeyi her seferinde temizle
    list_of_daily_mails, service, snippet, today = return_mails_and_service()
    
    for i, item in enumerate(list_of_daily_mails):
        result = classifier.classify_mail(item['body'])
        mail_data = {
            "id": item['id'],
            "text": item['text'],
            "body": item['body'],
            "snippet": item['snippet'],
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