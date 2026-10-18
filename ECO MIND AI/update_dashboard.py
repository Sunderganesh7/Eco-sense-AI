import os

filepath = 'frontend/src/pages/DashboardOverview.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Remove the button
button_html = """<button className="btn-outline-primary" style={{ width: 'auto', padding: '8px 16px', borderRadius: '24px', fontSize: '0.9rem' }}>
            <CalendarIcon size={16} /> Last 30 Days <ChevronRight size={16} />
          </button>"""
content = content.replace(button_html, '')

# 2. Change grid-cols-4 to grid-cols-3
content = content.replace('<div className="grid-cols-4" style={{ marginBottom: \'48px\' }}>', '<div className="grid-cols-3" style={{ marginBottom: \'48px\' }}>')

with open(filepath, 'w') as f:
    f.write(content)
print("Updated DashboardOverview.tsx")
