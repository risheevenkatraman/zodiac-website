# Zodiac Esports — Static Site

Lightweight static site scaffold for Zodiac Esports. Pages included:

- `index.html` — Home with updates and gallery
- `teams.html` and team subpages — Overwatch and VALORANT teams
- `staff.html` — Staff bios
- `store.html` — Store placeholder

Preview locally with any static file server. Example using Python 3:

```bash
cd c:\Users\Rishe\Desktop\Projects\zodiac-website
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

Next steps: add real logos, team photos, rosters, and content. I can integrate a CMS or deploy to GitHub Pages on request.

## Deploying to GitHub Pages

A GitHub Actions workflow has been added at `.github/workflows/deploy.yml` which will deploy the repository root to the `gh-pages` branch whenever you push to `main`.

Notes:
- The action uses the built-in `GITHUB_TOKEN` so no extra secrets are required.
- If your default branch is named `master` instead of `main`, update the workflow trigger.
- After the first deployment, enable GitHub Pages in your repository settings (Source: `gh-pages` branch) if it isn't enabled automatically.
- Your site URL will be `https://<your-github-username>.github.io/<repo-name>/` or the custom domain you configure.

To test locally before pushing, preview with Python's simple server:

```bash
cd c:\Users\Rishe\Desktop\Projects\zodiac-website
python -m http.server 8000
# open http://localhost:8000
```

