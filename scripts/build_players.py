"""Generate roster cards and standalone player pages: python scripts/build_players.py."""
import json
import re
from html import escape
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]


def asset_url(path):
    """Data stores site-root paths; generated pages live one folder below it."""
    return escape(path if urlsplit(path).scheme or path.startswith('/') else '../' + path, quote=True)


def build():
    (ROOT / 'players').mkdir(exist_ok=True)
    teams = json.loads((ROOT / 'data/players.json').read_text(encoding='utf-8'))
    for team in teams:
        source = ROOT / team['page']
        document = source.read_text(encoding='utf-8')
        cards = []
        for player in team['players']:
            name, role = escape(player['name']), escape(player['role'])
            slug = player['id']
            if not re.fullmatch(r'[a-z0-9-]+', slug):
                raise ValueError(f'Invalid player ID: {slug}')
            page = f'players/player-{slug}.html'
            pool_label = 'Hero' if team['game'] == 'Overwatch' else 'Agent'
            signature = player['pool'][0]
            portrait = asset_url(signature['image'])
            cards.append(f'''<a class="roster-card" href="../{page}">
        <img class="hero-image" src="{portrait}" alt="" width="88" height="88" loading="lazy" decoding="async">
        <div><h4>{name}</h4><p class="role">{role}</p><p>Signature {pool_label.lower()}: {escape(signature['name'])}</p><span class="profile-link">View profile →</span></div>
      </a>''')
            pool = ''.join(f'<li class="pool-card"><img src="{asset_url(hero["image"])}" alt="" width="88" height="88" loading="lazy"><div><strong>{escape(hero["name"])}</strong>{"<small>Signature pick</small>" if i == 0 else ""}</div></li>' for i, hero in enumerate(player['pool']))
            socials = []
            for social in player['socials']:
                url = social['url']
                if urlsplit(url).scheme != 'https' or not urlsplit(url).netloc:
                    raise ValueError(f'Social links must be absolute HTTPS URLs: {url}')
                socials.append(f'<a class="social-card" href="{escape(url, quote=True)}" target="_blank" rel="noopener noreferrer">{escape(social["label"])} <span class="sr-only">(opens in a new tab)</span>↗</a>')
            social_content = ''.join(socials) or '<p class="empty-state">Social links haven’t been shared yet.</p>'
            introduction = escape(player['introduction']) if player['introduction'] else f'{name} plays {role.lower()} for {escape(team["name"])} in {escape(team["game"])}. A personal introduction is coming soon.'
            header = re.search(r'<header\b.*?</header>', document, re.S)[0]
            footer = re.search(r'<footer\b.*?</footer>', document, re.S)[0]
            output = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{name} — {escape(team['name'])} {escape(team['game'])} | Zodiac Esports</title>
  <meta name="description" content="Meet {name}, {role} for {escape(team['name'])} in {escape(team['game'])}. Explore their {pool_label.lower()} pool and social links.">
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  {header}
  <main class="container" id="main-content" tabindex="-1">
    <a class="back-link" href="../{team['page']}">← Back to {escape(team['name'])} · {escape(team['game'])}</a>
    <section class="team-header player-header" aria-labelledby="player-name">
      <img src="../assets/profile-placeholder.svg" alt="" width="112" height="112">
      <div><p class="eyebrow">{escape(team['game'])} · {escape(team['name'])}</p><h1 id="player-name">{name}</h1><p class="role">{role}</p></div>
    </section>
    <div class="profile-sections">
      <section class="profile-section" aria-labelledby="intro-heading"><h2 id="intro-heading">Introduction</h2><p>{introduction}</p></section>
      <section class="profile-section" aria-labelledby="pool-heading"><h2 id="pool-heading">{pool_label} pool</h2><ul class="pool-grid">{pool}</ul></section>
      <section class="profile-section" aria-labelledby="social-heading"><h2 id="social-heading">Social links</h2><div class="player-socials">{social_content}</div></section>
    </div>
  </main>
  {footer}
</body>
</html>
'''
            (ROOT / page).write_text(output, encoding='utf-8')
        document = re.sub(r'<div class="roster-grid">.*?\n    </div>', '<div class="roster-grid">\n      ' + '\n      '.join(cards) + '\n    </div>', document, flags=re.S)
        source.write_text(document, encoding='utf-8')


if __name__ == '__main__':
    build()
