import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

def initialize_firebase():
    """
    Initializes the Firebase Admin SDK using credentials from environment variables.

    Returns:
        firestore.client or None: An initialized Firestore client, or None if credentials are missing/invalid.

    Side Effects:
        Loads Firebase certificate credentials, registers a new Firebase Admin app instance, and establishes connection to Firestore.
    """
    if not firebase_admin._apps:
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        if cred_path and os.path.exists(cred_path):
            try:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print("Firebase Admin initialized successfully.")
            except Exception as e:
                print(f"Failed to initialize Firebase Admin: {e}")
        else:
            print("Warning: FIREBASE_CREDENTIALS_PATH missing or invalid. Firestore writes will be skipped.")
            return None
            
    try:
        return firestore.client()
    except Exception as e:
        print(f"Firestore client init failed: {e}")
        return None

db = initialize_firebase()
