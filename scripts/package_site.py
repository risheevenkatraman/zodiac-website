"""Stage only public website files; never publish backend code or configuration."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / 'dist'
if target.exists():
    shutil.rmtree(target)
target.mkdir()
for source in ROOT.glob('*.html'):
    shutil.copy2(source, target / source.name)
for name in ('assets', 'css', 'data', 'js', 'players', 'staff', 'teams', 'admin'):
    shutil.copytree(ROOT / name, target / name)
print('Public site staged in dist/')
