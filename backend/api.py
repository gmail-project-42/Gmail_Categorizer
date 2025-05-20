from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from typing import List
from datetime import datetime

from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import logging
from categorize_mails import categorizer_mails, today

from send_mail import *
from take_mails import * 


logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)



app = FastAPI()



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

profile = None



class ConnectMailRequest(BaseModel):
    user_email: str


class MailSample(BaseModel):
    _id: str


class DeleteMailsRequest(BaseModel):
    mail_ids: List[str]

class DeleteResponse(BaseModel):
    message: str
    deleted_count: int
    failed_ids: List[str] = []




def connect_to_mongodb():
    load_dotenv()
    try:
        password = os.getenv("mongodb_collection_password")
        uri = f"mongodb+srv://kayailhan128:{password}@cluster0.mkigdkx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        client = MongoClient(uri)
        db_name = "Mail_Database"
        logger.info(f"MongoDB remote bağlantı başarılı. DB: {db_name}")
        db = client[db_name]
        return db
    except Exception as e:
        logger.error(f"Remote MongoDB bağlantı hatası: {str(e)}")
        raise e

try:
    db = connect_to_mongodb()
    mails_collection = db["mails"]
    deleted_mails_collection = db["deleted_mails"]
    session_collection = db["user_sessions"]  
    logger.info("Tüm koleksiyonlar başarıyla oluşturuldu")
except Exception as e:
    logger.error(f"MongoDB koleksiyon bağlantı hatası: {str(e)}")
    raise e

    
     


@app.post("/mails/connect_mail")
def connect_mail(request: ConnectMailRequest):
    global profile
    service = authenticate_gmail()
    profile = service.users().getProfile(userId='me').execute()
    return profile
        




@app.post("/mails/insert_mails_into_database")
def import_data():
    if profile is None:
        raise HTTPException(status_code=401, detail="Lütfen önce mail ile giriş yapınız.")
    
    try:
        mails_to_categorize = categorizer_mails()
        
        if mails_to_categorize:
            new_mail_count = 0
            updated_mail_count = 0
            skipped_count = 0  
            deleted_mail_ids = list(deleted_mails_collection.find({}, {"mail_id": 1, "_id": 0}))
            deleted_ids_set = {item["mail_id"] for item in deleted_mail_ids}
            
            logger.info(f"Toplam {len(mails_to_categorize)} adet mail işlenecek")
            
            for mail in mails_to_categorize:
                mail_id = mail["id"]
                if mail_id in deleted_ids_set:
                    logger.info(f"Mail ID: {mail_id} daha önce silinmiş, import edilmiyor")
                    skipped_count += 1
                    continue
                    
                existing_mail = mails_collection.find_one({"id": mail_id})
                
                if not existing_mail:
                    mails_collection.insert_one(mail)
                    new_mail_count += 1
                    logger.info(f"Yeni mail eklendi: {mail_id}")
                else:
                    mails_collection.update_one({"id": mail_id}, {"$set": mail})
                    updated_mail_count += 1
            
            logger.info(f"İşlem tamamlandı: {new_mail_count} yeni, {updated_mail_count} güncellendi, {skipped_count} atlandı")
            
            if skipped_count > 0:
                return f"{new_mail_count} yeni e-posta eklendi, {updated_mail_count} e-posta güncellendi. {skipped_count} e-posta daha önce silindiği için atlandı."
            else:
                return f"{new_mail_count} yeni e-posta eklendi, {updated_mail_count} e-posta güncellendi."
        else:
            logger.warning("Yüklenecek e-posta bulunamadı.")
            return "Yüklenecek e-posta bulunamadı. Lütfen sonra tekrar deneyin."
    except Exception as e:
        logger.error(f"E-posta import hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"E-posta alınırken hata oluştu: {str(e)}")




@app.get("/mails/{selectedCategory}")
def get_mails_by_category(selectedCategory: str):
    
    if profile is None:
        raise HTTPException(status_code=401, detail="Lütfen önce mail ile giriş yapınız.")
    
    query = {}  
    
    if selectedCategory.lower() != "all":
        query["predicted_class"] = selectedCategory
    
    mails = list(mails_collection.find(query, {"_id": 0}))
    
    if not mails:
        raise HTTPException(status_code=404, detail="Bu kategoriye ait mail bulunamadı.")
    
    return {"mails": mails}



@app.post("/mails/send_mail")
def send_mail_other_user(to: str, subject: str, body: str):
    global profile
    if profile is None:
        raise HTTPException(status_code=401, detail="Lütfen önce mail ile giriş yapınız.")
    service = authenticate_gmail()
    user_email = profile.get("emailAddress")
    send_email(service, to, subject, body)
    return "E-posta başarıyla gönderildi."




@app.delete("/mails/delete-selected", response_model=DeleteResponse)
async def delete_selected_mails(request: DeleteMailsRequest):
    try:
        deleted_count = 0
        failed_ids = []
        
        for mail_id in request.mail_ids:
            try:
                # Önce mail'in var olup olmadığını kontrol et
                mail_exists = mails_collection.find_one({"id": mail_id})
                
                if not mail_exists:
                    failed_ids.append(f"{mail_id} (bulunamadı)")
                    print(f"Mail ID: {mail_id} veritabanında bulunamadı")
                    continue
                
                # Mail'i sil
                result = mails_collection.delete_one({"id": mail_id})
                
                if result.deleted_count > 0:
                    # Silinenler listesine ekle (tekrar import edilmemesi için)
                    deleted_mails_collection.update_one(
                        {"mail_id": mail_id}, 
                        {"$set": {"mail_id": mail_id, "deleted_at": datetime.now()}},
                        upsert=True
                    )
                    
                    deleted_count += 1
                    print(f"Mail ID: {mail_id} başarıyla silindi ve kalıcı olarak silindi listesine eklendi")
                else:
                    failed_ids.append(f"{mail_id} (silinemedi)")
                    print(f"Mail ID: {mail_id} silme başarısız oldu: {result}")
            except Exception as e:
                failed_ids.append(f"{mail_id} (hata: {str(e)})")
                print(f"Mail silme hatası (ID: {mail_id}): {str(e)}")
        
        return DeleteResponse(
            message=f"{deleted_count} adet mail başarıyla silindi. {len(failed_ids)} adet mail silinemedi.",
            deleted_count=deleted_count,
            failed_ids=failed_ids
        )
        
    except Exception as e:
        print(f"Delete işlemi genel hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))




if __name__ == "__main__":
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True )