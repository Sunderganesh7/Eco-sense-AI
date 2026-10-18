import requests
import re

s = requests.Session()

# TEST 1: Login -> Platform Overview
r = s.post('http://127.0.0.1:5000/login', data={'email': 'test@test.com', 'password': 'password123'})
print('TEST 1 - Login:')
print('Final URL:', r.url)
print('Active menu:', re.findall(r'<li class="menu-item\s*active\s*" id="menu-([^"]+)">', r.text) or re.findall(r'<li class="menu-item[^"]*active[^"]*" id="menu-([^"]+)">', r.text))

# TEST 2: Login -> Vision Analytics -> Sign Out -> Login again -> Platform Overview
s.get('http://127.0.0.1:5000/vision')
s.get('http://127.0.0.1:5000/logout')
r = s.post('http://127.0.0.1:5000/login', data={'email': 'test@test.com', 'password': 'password123'})
print('TEST 2 - Logout then Login:')
print('Final URL:', r.url)
print('Active menu:', re.findall(r'<li class="menu-item[^"]*active[^"]*" id="menu-([^"]+)">', r.text))

# TEST 3: Login -> Recommended Plantation -> Sign Out -> Login again -> Platform Overview
s.get('http://127.0.0.1:5000/plantation')
s.get('http://127.0.0.1:5000/logout')
r = s.post('http://127.0.0.1:5000/login', data={'email': 'test@test.com', 'password': 'password123'})
print('TEST 3 - Logout then Login (from Plantation):')
print('Final URL:', r.url)
print('Active menu:', re.findall(r'<li class="menu-item[^"]*active[^"]*" id="menu-([^"]+)">', r.text))

# TEST 4: Open application root URL while authenticated
r = s.get('http://127.0.0.1:5000/')
print('TEST 4 - Root URL:')
print('Final URL:', r.url)
print('Active menu:', re.findall(r'<li class="menu-item[^"]*active[^"]*" id="menu-([^"]+)">', r.text))

# TEST 5: Click sidebar items
r = s.get('http://127.0.0.1:5000/workflow')
print('TEST 5 - Workflow Tab:')
print('Final URL:', r.url)
print('Active menu:', re.findall(r'<li class="menu-item[^"]*active[^"]*" id="menu-([^"]+)">', r.text))
