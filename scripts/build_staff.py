"""Generate staff cards and standalone profiles: python scripts/build_staff.py."""
import json
import re
from html import escape
from urllib.parse import urlsplit

from build_players import ROOT, asset_url


def build():
    members = json.loads((ROOT / 'data/staff.json').read_text(encoding='utf-8'))
    source = ROOT / 'staff.html'
    document = source.read_text(encoding='utf-8')
    header = re.search(r'<header\b.*?</header>', document, re.S)[0]
    header = re.sub(r'(href|src)="(?![a-z]+:|/|#)([^"]+)"', r'\1="../\2"', header)
    footer = re.search(r'<footer\b.*?</footer>', document, re.S)[0]
    cards, profiles, ids = [], {}, set()
    for member in members:
        slug = member['id']
        if not re.fullmatch(r'[a-z0-9-]+', slug) or slug in ids:
            raise ValueError(f'Invalid or duplicate staff ID: {slug}')
        ids.add(slug)
        name, role = escape(member['name']), escape(member['role'])
        portrait = member.get('image') or 'assets/profile-placeholder.svg'
        page = f'staff/staff-{slug}.html'
        cards.append(f'''<a class="staff-card" href="{page}">
        <img src="{escape(portrait, quote=True)}" alt="" width="120" height="120" loading="lazy">
        <h2>{name}</h2><p>{role}</p><span class="profile-link">View profile →</span>
      </a>''')
        introduction = escape(member['introduction']) if member['introduction'] else 'A personal introduction is coming soon.'
        socials = []
        for social in member['socials']:
            url = social['url']
            if urlsplit(url).scheme != 'https' or not urlsplit(url).netloc:
                raise ValueError(f'Social links must be absolute HTTPS URLs: {url}')
            socials.append(f'<a class="social-card" href="{escape(url, quote=True)}" target="_blank" rel="noopener noreferrer">{escape(social["label"])} <span class="sr-only">(opens in a new tab)</span>↗</a>')
        social_content = ''.join(socials) or '<p class="empty-state">Social links haven’t been shared yet.</p>'
        profiles[page] = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{name} — Staff | Zodiac Esports</title>
  <meta name="description" content="Meet {name}, {role} at Zodiac Esports. Read their introduction and explore their social links.">
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  {header}
  <main class="container" id="main-content" tabindex="-1">
    <a class="back-link" href="../staff.html">← Back to Staff</a>
    <section class="team-header player-header" aria-labelledby="staff-name">
      <img src="{asset_url(portrait)}" alt="" width="112" height="112">
      <div><p class="eyebrow">Zodiac Esports · Staff</p><h1 id="staff-name">{name}</h1><p class="role">{role}</p></div>
    </section>
    <div class="profile-sections">
      <section class="profile-section" aria-labelledby="intro-heading"><h2 id="intro-heading">Introduction</h2><p>{introduction}</p></section>
      <section class="profile-section" aria-labelledby="social-heading"><h2 id="social-heading">Social links</h2><div class="player-socials">{social_content}</div></section>
    </div>
  </main>
  {footer}
</body>
</html>
'''
    document, count = re.subn(r'<div class="staff-grid">.*?\n    </div>', lambda _: '<div class="staff-grid">\n      ' + '\n      '.join(cards) + '\n    </div>', document, flags=re.S)
    if count != 1:
        raise ValueError('Expected exactly one staff grid in staff.html')
    (ROOT / 'staff').mkdir(exist_ok=True)
    for page, content in profiles.items():
        (ROOT / page).write_text(content, encoding='utf-8')
    source.write_text(document, encoding='utf-8')


if __name__ == '__main__':
    build()
