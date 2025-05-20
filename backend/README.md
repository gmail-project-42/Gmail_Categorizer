# Gmail Projesi

## Proje Hakkında

Bu proje, Gmail API kullanarak e-postaları çeken, kategorize eden ve MongoDB'de saklayan bir Python uygulamasıdır. Proje, e-postaları otomatik olarak sınıflandırır ve REST API üzerinden erişilebilir hale getirir.

## Özellikler

- Gmail API entegrasyonu
- E-posta otomatik kategorizasyonu
- MongoDB veritabanı entegrasyonu
- E-posta gönderme özelliği
- Makine öğrenmesi tabanlı metin sınıflandırma
- FastAPI ile REST API

## Klasör Yapısı

```

## Kurulum

1. Python sanal ortamı oluşturun ve aktifleştirin:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac için
# veya
.\venv\Scripts\activate  # Windows için
```

2. Gerekli paketleri yükleyin:
```bash
pip install -r requirements.txt
```

3. `.env` dosyasını oluşturun ve gerekli ortam değişkenlerini ekleyin:
```
MONGODB_PASSWORD=your_mongodb_password
GEMINI_API_KEY = your_gemini_api_key

```

## Kullanım

1. Gmail API kimlik bilgilerini ayarlayın:
   - Google Cloud Console'dan bir proje oluşturun
   - Gmail API'yi etkinleştirin
   - OAuth 2.0 kimlik bilgilerini oluşturun
   - `token.json` dosyasını proje dizinine ekleyin

2. Uygulamayı başlatın:
```bash
uvicorn api:app --reload
```

## API Endpointleri

- `POST /mails/connect_mail`: Gmail hesabı ile bağlantı kurar
- `POST /mails/import_data_into_mongodb`: E-postaları çeker ve MongoDB'ye kaydeder
- `GET /mails/{category}`: Belirli bir kategorideki e-postaları getirir
- `POST /mails/send_mail`: Yeni e-posta gönderir

## Geliştirme

Projeyi geliştirmek için:

1. Yeni özellikler eklemek için bir branch oluşturun
2. Değişikliklerinizi commit edin
3. Pull request oluşturun

## Gereksinimler

- Python 3.8+
- MongoDB Atlas hesabı
- Gmail hesabı
- Google Cloud Console projesi

## İletişim

Sorularınız veya önerileriniz için:
[khrmn8375@gmail.com](mailto:khrmn8375@gmail.com)

## Lisans

MIT