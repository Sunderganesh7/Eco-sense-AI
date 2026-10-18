import requests
import re

r = requests.get('http://127.0.0.1:5000/')
active_menus = re.findall(r'<li class="menu-item\s+active\s*" id="menu-([^"]+)">', r.text)
if not active_menus:
    active_menus = re.findall(r'<li class="menu-item[^"]*active[^"]*" id="menu-([^"]+)">', r.text)

print('Redirects:', r.history)
print('Final URL:', r.url)
print('Active menus:', active_menus)
