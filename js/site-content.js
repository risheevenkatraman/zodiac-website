// Keep the HTML fallback if editable content cannot be loaded.
(async () => {
  try {
    const response = await fetch('data/site.json', { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return;
    const content = await response.json();
    const title = document.querySelector('.home-page .hero h1');
    const intro = document.querySelector('.home-page .hero-intro');
    if (title && typeof content.homeTitle === 'string' && content.homeTitle.trim())
      title.textContent = content.homeTitle;
    if (intro && typeof content.homeIntroduction === 'string' && content.homeIntroduction.trim())
      intro.textContent = content.homeIntroduction;
    const grid = document.querySelector('.social-grid');
    if (!grid || !Array.isArray(content.socials)) return;
    const cards = [];
    for (const social of content.socials) {
      if (!social || typeof social.label !== 'string') continue;
      const url = new URL(social.url);
      if (url.protocol !== 'https:') continue;
      const link = document.createElement('a');
      link.className = 'social-card';
      link.href = url.href;
      const text = document.createElement('span');
      const label = document.createElement('strong');
      label.textContent = social.label;
      const description = document.createElement('small');
      description.textContent = social.description || '';
      if (social.image) {
        const source = new URL(social.image, document.baseURI);
        if (source.protocol === 'https:' || source.origin === location.origin) {
          const icon = document.createElement('span');
          icon.className = 'social-icon';
          const image = document.createElement('img');
          image.src = source.href;
          image.alt = '';
          icon.append(image);
          link.append(icon);
        }
      }
      text.append(label, description);
      link.append(text);
      cards.push(link);
    }
    if (cards.length) grid.replaceChildren(...cards);
  } catch {
    /* Existing content remains available. */
  }
})();
