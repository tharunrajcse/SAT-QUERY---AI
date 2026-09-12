import os
import hashlib
import binascii
import datetime
from dotenv import load_dotenv

load_dotenv()

# In-memory user fallback storage if MongoDB Atlas is not yet connected
in_memory_users = {}

class DBManager:
    """
    Manages MongoDB Atlas connection and User Authentication (Signup & Login).
    Falls back gracefully if MONGODB_URL is not yet configured.
    """

    def __init__(self):
        self.mongodb_url = os.getenv("MONGODB_URL", "").strip()
        self.client = None
        self.db = None
        self.users_col = None
        self._connect()

    def _connect(self):
        if not self.mongodb_url or self.mongodb_url == "your_mongodb_connection_url_here":
            print("INFO: MONGODB_URL not configured in .env. Using in-memory authentication storage.")
            return

        try:
            import pymongo
            self.client = pymongo.MongoClient(self.mongodb_url, serverSelectionTimeoutMS=5000)
            # Test connection
            self.client.admin.command('ping')
            self.db = self.client["geochange_db"]
            self.users_col = self.db["users"]
            # Create unique indexes for email and username
            self.users_col.create_index("email", unique=True)
            self.users_col.create_index("username", unique=True)
            print("SUCCESS: Connected to MongoDB Atlas Cluster!")
        except Exception as e:
            print(f"WARNING: MongoDB Atlas connection failed ({e}). Falling back to in-memory auth storage.")
            self.client = None
            self.users_col = None

    @staticmethod
    def hash_password(password: str) -> str:
        """Securely hashes password using PBKDF2 HMAC SHA-256."""
        salt = b'geochange_salt_2026'
        pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return binascii.hexlify(pwd_hash).decode('ascii')

    def create_user(
        self,
        first_name: str,
        last_name: str,
        username: str,
        email: str,
        password: str,
        recheck_password: str
    ) -> dict:
        # 1. Validation checks
        first_name = first_name.strip()
        last_name = last_name.strip()
        username = username.strip().lower()
        email = email.strip().lower()

        if not first_name or not last_name or not username or not email or not password:
            raise ValueError("All fields are required.")

        if password != recheck_password:
            raise ValueError("Passwords do not match. Please verify Recheck Password.")

        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long.")

        hashed_pwd = self.hash_password(password)

        user_doc = {
            "first_name": first_name,
            "last_name": last_name,
            "username": username,
            "email": email,
            "password_hash": hashed_pwd,
            "created_at": datetime.datetime.utcnow().isoformat()
        }

        # 2. Store in MongoDB if connected
        if self.users_col is not None:
            try:
                # Check duplicate email/username
                if self.users_col.find_one({"email": email}):
                    raise ValueError("An account with this Email ID already exists.")
                if self.users_col.find_one({"username": username}):
                    raise ValueError("This Username is already taken.")

                self.users_col.insert_one(user_doc)
            except ValueError as ve:
                raise ve
            except Exception as e:
                # Catch MongoDB unique index errors
                if "duplicate key" in str(e).lower() or "11000" in str(e):
                    raise ValueError("An account with this Email or Username already exists.")
                raise ValueError(f"Database error: {str(e)}")
        else:
            # In-Memory fallback
            if email in in_memory_users:
                raise ValueError("An account with this Email ID already exists.")
            for u in in_memory_users.values():
                if u["username"] == username:
                    raise ValueError("This Username is already taken.")
            in_memory_users[email] = user_doc

        return {
            "first_name": first_name,
            "last_name": last_name,
            "username": username,
            "email": email
        }

    def authenticate_user(self, email: str, password: str) -> dict:
        email = email.strip().lower()
        if not email or not password:
            raise ValueError("Email and Password are required.")

        hashed_pwd = self.hash_password(password)

        if self.users_col is not None:
            user = self.users_col.find_one({"email": email})
        else:
            user = in_memory_users.get(email)

        if not user:
            raise ValueError("Invalid Email ID or Password.")

        if user.get("password_hash") != hashed_pwd:
            raise ValueError("Invalid Email ID or Password.")

        return {
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "username": user["username"],
            "email": user["email"]
        }
