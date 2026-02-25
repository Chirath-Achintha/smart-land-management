import pymysql

def verify_tables():
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='1234',
        database='land_management_sys'
    )
    try:
        with connection.cursor() as cursor:
            tables = ["users", "lands", "bids", "site_visits", "inquiries", "service_bookings", "availability"]
            for table in tables:
                print(f"\n--- Columns in {table} ---")
                cursor.execute(f"DESCRIBE {table}")
                for row in cursor.fetchall():
                    print(row[0])
    finally:
        connection.close()

if __name__ == "__main__":
    verify_tables()
