import requests
import os
from dotenv import load_dotenv


class MailClassifier:
    def __init__(self, hf_token):
        self.api_url = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
        self.headers = {"Authorization": f"Bearer {hf_token}"}
        self.labels = [
            "Pazarlama ve Reklam (Tanıtımlar)",
            "Sosyal",
            "İş ve Profesyonel İletişim",
            "Abonelik Bildirimleri",
            "Fatura ve Finansal Bildirimler",
            "Şüpheli veya Güvenlik İçerikli",
            "Diğer"
        ]
        
    
    def classify_mail(self, mail_content):
        payload = {
            "inputs": mail_content,
            "parameters": {
                "candidate_labels": self.labels,
                "multi_label": False
            }
        }
        response = requests.post(self.api_url, headers=self.headers, json=payload)
        result = response.json()
        predicted_class = result['labels'][0]
        confidence_score = result['scores'][0]
        
        return {
            'predicted_class': predicted_class,
            'confidence_score': confidence_score,
            'all_scores': dict(zip(result['labels'], result['scores']))
        }

