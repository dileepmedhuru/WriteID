import os

mask_html = '<div id="nav-top-mask" style="position:fixed;top:0;left:0;right:0;height:16px;background:#080c14;z-index:999;pointer-events:none;"></div>\n'

pages = [
    'd:/Projects/WriteID/frontend/upload.html',
    'd:/Projects/WriteID/frontend/home.html',
    'd:/Projects/WriteID/frontend/signature.html',
    'd:/Projects/WriteID/frontend/index.html',
    'd:/Projects/WriteID/frontend/login.html',
    'd:/Projects/WriteID/frontend/signup.html',
    'd:/Projects/WriteID/frontend/profile.html',
]

for p in pages:
    if not os.path.exists(p):
        print(f'Not found: {p}')
        continue
    c = open(p, 'r', encoding='utf-8').read()
    if 'nav-top-mask' in c:
        print(f'Already patched: {p}')
        continue
    if '<body>' in c:
        c = c.replace('<body>\n', '<body>\n' + mask_html, 1)
        open(p, 'w', encoding='utf-8').write(c)
        print(f'Patched: {p}')
    elif '<body>\r\n' in c:
        c = c.replace('<body>\r\n', '<body>\r\n' + mask_html, 1)
        open(p, 'w', encoding='utf-8').write(c)
        print(f'Patched (CRLF): {p}')
    else:
        print(f'No body tag found: {p}')

print('All done.')
