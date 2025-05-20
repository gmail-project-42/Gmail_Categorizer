# cleanup_db.py adında yeni bir dosya oluşturun
from pymongo import MongoClient
from dotenv import load_dotenv
import os

def connect_to_mongodb():
    load_dotenv()
    password = os.getenv("mongodb_collection_password")
    uri = f"mongodb+srv://kayailhan128:{password}@cluster0.mkigdkx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    client = MongoClient(uri)
    db = client["Mail_Database"]
    collection = db["Mail"]
    return collection

def cleanup_database():
    collection = connect_to_mongodb()
    result = collection.delete_many({})
    print(f"Silinen döküman sayısı: {result.deleted_count}")

if __name__ == "__main__":
    cleanup_database()