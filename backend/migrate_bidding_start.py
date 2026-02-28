"""
=============================================================
 Migration: bidding_setup — Add bidding_start, widen bidding_end
=============================================================
 What this does:
   1. Adds a new column  bidding_start VARCHAR(40)  to the
      bidding_setup table (stores ISO datetime for scheduled start).
   2. Widens bidding_end from VARCHAR(20) to VARCHAR(40) so it
      can store a full ISO datetime string (e.g. 2026-03-01T14:30:00.000Z).

 Run ONCE from the backend/ directory:
   python migrate_bidding_start.py

 Safe to run multiple times — it checks before altering.
=============================================================
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import engine
from sqlalchemy import text

SEPARATOR = "=" * 55

def run():
    print(SEPARATOR)
    print(" Smart Land Management — DB Migration")
    print(SEPARATOR)

    with engine.connect() as conn:

        # ── 1. Add bidding_start column ──────────────────────────
        result = conn.execute(text(
            "SELECT COUNT(*) FROM information_schema.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() "
            "AND TABLE_NAME   = 'bidding_setup' "
            "AND COLUMN_NAME  = 'bidding_start'"
        ))
        already_exists = result.scalar()

        if already_exists:
            print("[SKIP]  bidding_start column already exists.")
        else:
            print("[RUN ]  Adding bidding_start column ...")
            conn.execute(text(
                "ALTER TABLE bidding_setup "
                "ADD COLUMN bidding_start VARCHAR(40) NULL "
                "AFTER starting_bid"
            ))
            conn.commit()
            print("[OK  ]  bidding_start column added.")

        # ── 2. Widen bidding_end to VARCHAR(40) ──────────────────
        print("[RUN ]  Ensuring bidding_end is VARCHAR(40) ...")
        conn.execute(text(
            "ALTER TABLE bidding_setup "
            "MODIFY COLUMN bidding_end VARCHAR(40) NULL"
        ))
        conn.commit()
        print("[OK  ]  bidding_end column confirmed VARCHAR(40).")

    print(SEPARATOR)
    print(" Migration complete! You can now start the server.")
    print(SEPARATOR)

if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        print(f"\n[ERROR] Migration failed: {e}")
        print("Make sure your .env file is configured and MySQL is running.")
        sys.exit(1)
