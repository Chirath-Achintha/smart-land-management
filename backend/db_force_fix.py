from app.database.connection import engine
from sqlalchemy import text

# Force the columns to be large enough for the full ISO datetime string
with engine.connect() as conn:
    print("Fixing database columns...")
    conn.execute(text("ALTER TABLE bidding_setup MODIFY COLUMN bidding_start VARCHAR(255) NULL"))
    conn.execute(text("ALTER TABLE bidding_setup MODIFY COLUMN bidding_end VARCHAR(255) NULL"))
    conn.commit()
    print("✓ SUCCESS: Database columns widened to 255 characters.")
