import requests
import re

session = requests.Session()
r = session.post('http://127.0.0.1:5000/login', data={'email':'admin@greenpath.ai', 'password':'admin_password'})

print('Redirects:', r.history)
print('Final URL:', r.url)

active_panels = re.findall(r'<section class="dashboard-panel\s*active\s*" id="panel-([^"]+)">', r.text)
active_menus = re.findall(r'<li class="menu-item\s*active\s*" id="menu-([^"]+)">', r.text)

print('Active panels:', active_panels)
print('Active menus:', active_menus)
