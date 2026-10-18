import glob

files = glob.glob('frontend/src/pages/*.tsx')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace("{(r.status || \\'unknown\\').toUpperCase()}", "{(r.status || 'unknown').toUpperCase()}")
    content = content.replace("{(claim.support_status || \\'unknown\\').toUpperCase()}", "{(claim.support_status || 'unknown').toUpperCase()}")
    content = content.replace("{(r.evidence_status || \\'unknown\\').replace(/_/g, ' ').toUpperCase()}", "{(r.evidence_status || 'unknown').replace(/_/g, ' ').toUpperCase()}")
    
    content = content.replace("{r.status.toUpperCase()}", "{(r.status || 'unknown').toUpperCase()}")
    content = content.replace("{claim.support_status.toUpperCase()}", "{(claim.support_status || 'unknown').toUpperCase()}")

    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
