import sqlite3
import os

db_path = "backend/nyaya_users.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Check for new columns
    c.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in c.fetchall()]
    
    new_columns = ["first_name", "last_name", "phone_number"]
    
    for col in new_columns:
        if col not in columns:
            print(f"Adding column {col} to users table...")
            c.execute(f"ALTER TABLE users ADD COLUMN {col} TEXT")
            conn.commit()
    
    conn.close()
    print("Migration complete.")
else:
    print("DB not found at", db_path)
