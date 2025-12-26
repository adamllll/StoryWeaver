import sqlite3

conn = sqlite3.connect('data/story.db')
cursor = conn.cursor()

print("=== Users ===")
cursor.execute('SELECT id, username FROM users')
for row in cursor.fetchall():
    print(f'ID={row[0]}, username={row[1]}')

print("\n=== Novels ===")
cursor.execute('SELECT id, title, status, user_id FROM novels')
for row in cursor.fetchall():
    print(f'ID={row[0]}, title={row[1]}, status={row[2]}, user_id={row[3]}')

conn.close()
