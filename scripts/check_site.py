"""Validate the actual Next.js export, CMS content, local links, and legacy URLs."""
import json
import os
import posixpath
import subprocess
import re
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'out'
BASE = os.environ.get('NEXT_PUBLIC_BASE_PATH', '').rstrip('/')


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids, self.links, self.text = set(), [], []
        self.metadata, self.canonicals, self.icons = {}, [], []
        self.h1s = 0
        self.skip = 0
        self.feed(source)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'meta':
            self.metadata[attrs.get('name') or attrs.get('property')] = attrs.get('content')
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonicals.append(attrs['href'])
        if tag == 'link' and attrs.get('rel') == 'icon':
            self.icons.append(attrs)
        if tag in ('script', 'style'):
            self.skip += 1
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'Duplicate ID: {attrs["id"]}'
            self.ids.add(attrs['id'])
        self.h1s += tag == 'h1'
        for attribute in ('href', 'src'):
            if attribute in attrs:
                self.links.append(attrs[attribute])

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip:
            self.text.append(data)

    def contains(self, value):
        return ' '.join(value.split()) in ' '.join(''.join(self.text).split())


catalog = json.loads(subprocess.check_output(
    ['node', '-e', "console.log(JSON.stringify(require('./lib/page-catalog.cjs').pageCatalog()))"],
    cwd=ROOT, encoding='utf-8',
))
pages = {}
for entry in catalog:
    file = entry['file']
    route = 'index.html' if file == 'index.html' else file[:-5] + '/index.html'
    generated = OUTPUT / route
    assert generated.is_file(), f'Missing exported page: {route}'
    assert (OUTPUT / file).read_bytes() == generated.read_bytes(), f'Legacy URL differs: {file}'
    pages[route] = Page(generated.read_text(encoding='utf-8'))
    pages[file] = pages[route]
pages['admin/index.html'] = Page((OUTPUT / 'admin/index.html').read_text(encoding='utf-8'))


def local_target(name, link):
    url = urlsplit(link)
    if url.scheme or url.netloc:
        return None, url.fragment
    pathname = unquote(url.path)
    if pathname.startswith('/'):
        assert not BASE or pathname == BASE or pathname.startswith(BASE + '/'), f'Missing base path: {link}'
        pathname = pathname[len(BASE):].lstrip('/')
    elif pathname:
        pathname = posixpath.join(posixpath.dirname(name), pathname)
    else:
        pathname = name
    pathname = posixpath.normpath(pathname)
    if (OUTPUT / pathname).is_dir():
        pathname = posixpath.join(pathname, 'index.html')
    return pathname, url.fragment


for name, page in pages.items():
    assert page.h1s == 1, f'{name}: expected one main heading'
    for link in page.links:
        target, fragment = local_target(name, link)
        if target is None:
            continue
        assert (OUTPUT / target).is_file(), f'{name}: missing {target}'
        if fragment and target in pages:
            assert fragment in pages[target].ids, f'{name}: missing anchor {link}'

for entry in catalog:
    page = pages[entry['file']]
    person = entry.get('person')
    if person:
        assert page.contains(person['name']), f'Missing profile name: {entry["file"]}'
        if person.get('introduction'):
            assert page.contains(person['introduction']), f'Outdated CMS biography: {entry["file"]}'
        assert {'intro-heading', 'social-heading'} <= page.ids
        image = person.get('image') or 'assets/uploads/profile-placeholder.svg'
        image = image if image.startswith('https://') else BASE + '/' + image.lstrip('/')
        assert image in page.links, f'Missing profile photo: {entry["file"]}'
        for social in person.get('socials', []):
            assert social['url'] in page.links, f'Missing profile social: {entry["file"]}'
    if entry['kind'] == 'team':
        for player in entry['team']['players']:
            assert BASE + f'/players/player-{player["id"]}/' in page.links
            assert page.contains(player['name'])

site = json.loads((ROOT / 'data/site.json').read_text(encoding='utf-8'))
assert pages['index.html'].contains(site['homeIntroduction'])
announcement = json.loads((ROOT / 'data/announcement.json').read_text(encoding='utf-8'))
assert pages['index.html'].contains(announcement['message'])
assert {'products', 'checkout', 'cart-lines', 'store-status'} <= pages['store.html'].ids
assert {'account-login', 'member-panel', 'stars-redeem', 'account-status'} <= pages['account.html'].ids
for file in ('config.yml', 'editor.js', 'index.html'):
    assert (OUTPUT / 'admin' / file).read_bytes() == (ROOT / 'admin' / file).read_bytes()
assert not (OUTPUT / 'backend').exists()
origin = 'https://www.zodiacgg.com'
expected_urls = set()
for entry in catalog:
    page = pages[entry['file']]
    route = '/' if entry['file'] == 'index.html' else '/' + entry['file'][:-5] + '/'
    canonical = origin + route
    expected_urls.add(canonical)
    assert page.canonicals == [canonical], f'Incorrect canonical: {entry["file"]}'
    assert page.metadata.get('description'), f'Missing description: {entry["file"]}'
    assert page.metadata.get('og:url') == canonical
    assert page.metadata.get('twitter:card') == 'summary'
    assert len(page.icons) == 1 and page.icons[0].get('sizes') == '1000x1000'
sitemap = ET.parse(OUTPUT / 'sitemap.xml')
urls = [node.text for node in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(urls) == len(expected_urls) and set(urls) == expected_urls
assert f'Sitemap: {origin}/sitemap.xml' in (OUTPUT / 'robots.txt').read_text()
homepage = (OUTPUT / 'index.html').read_text(encoding='utf-8')
structured = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', homepage, re.S)[1])
organization = next(item for item in structured['@graph'] if item['@type'] == 'Organization')
assert organization['url'] == origin + '/'
assert organization['logo'] == origin + BASE + '/assets/uploads/zodiac-logo.png'
print(f'Checked {len(catalog)} React pages and legacy URLs, all local links/assets, CMS biographies, commerce controls, and the unchanged Decap editor.')
print('SEO checks passed: canonical URLs, descriptions, social metadata, favicon, sitemap, robots, and organization data.')
