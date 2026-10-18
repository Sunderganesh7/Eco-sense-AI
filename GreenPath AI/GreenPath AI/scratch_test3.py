import requests
import re

s = requests.Session()
s.post('http://127.0.0.1:5000/register', data={'name': 'test', 'email': 'test@test.com', 'password': 'password123'})
s.post('http://127.0.0.1:5000/login', data={'email': 'test@test.com', 'password': 'password123'})

r = s.get('http://127.0.0.1:5000/')
print('After login, requested /')
print('Redirects:', r.history)
print('Final URL:', r.url)

active_menus = re.findall(r'<li class="menu-item[^"]*active[^"]*" id="menu-([^"]+)">', r.text)
print('Active menus for /:', active_menus)

r2 = s.post('http://127.0.0.1:5000/login', data={'email': 'test@test.com', 'password': 'password123'})
print('\nLogin redirect behavior:')
print('Redirects:', r2.history)
print('Final URL:', r2.url)
active_menus2 = re.findall(r'<li class="menu-item[^"]*active[^"]*" id="menu-([^"]+)">', r2.text)
print('Active menus after login post:', active_menus2)
