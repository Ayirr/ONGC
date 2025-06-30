#!/usr/bin/env python3
"""
Script to create an initial admin user for the ONGC RAG Assistant.
Run this script after setting up the database to create the first admin account.
"""

from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User
from auth import get_password_hash

def create_admin_user():
    """Create an initial admin user."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            print("Admin user already exists!")
            return
        
        # Create admin user
        admin_user = User(
            username="admin",
            email="admin@ongc.com",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("Admin user created successfully!")
        print("Username: admin")
        print("Password: admin123")
        print("Email: admin@ongc.com")
        print("\nPlease change the password after first login!")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()