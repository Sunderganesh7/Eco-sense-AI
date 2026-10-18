import re
for i, line in enumerate(open('app.py', encoding='utf-8')):
    if 'url_for("home")' in line or "url_for('home')" in line:
        print(f"{i+1}: {line.strip()}")
