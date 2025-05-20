from transformers import pipeline


class MailClassifier:
    def __init__(self):
        self.classifier = pipeline("zero-shot-classification",
                                 model="facebook/bart-large-mnli",
                                 device=0)
        
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
        result = self.classifier(mail_content, 
                               candidate_labels=self.labels,
                               multi_label=False)
        predicted_class = result['labels'][0]
        confidence_score = result['scores'][0]
        
        return {
            'predicted_class': predicted_class,
            'confidence_score': confidence_score,
            'all_scores': dict(zip(result['labels'], result['scores']))
        }

