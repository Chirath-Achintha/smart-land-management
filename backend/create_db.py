import pymysql

try:
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='1234'
    )
    with connection.cursor() as cursor:
        cursor.execute("CREATE DATABASE IF NOT EXISTS land_management_sys")
        print("Database 'land_management_sys' created or already exists.")
    connection.close()
except Exception as e:
    print(f"Error: {e}")
