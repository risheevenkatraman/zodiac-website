"""Compatibility entry point: build the Next.js static export in out/."""
import os
from pathlib import Path
import subprocess

subprocess.run(['npm.cmd' if os.name == 'nt' else 'npm', 'run', 'build'],
               cwd=Path(__file__).resolve().parents[1], check=True)
