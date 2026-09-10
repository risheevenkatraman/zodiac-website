const fallbackAnnouncement = {
  title: "Welcome to Zodiac Esports",
  message: "Our Overwatch and VALORANT rosters are ready. Follow our teams and join the community for the latest updates.",
  image: "assets/announcement-placeholder.svg"
};

function parseAnnouncement(announcement) {
  if (!announcement || typeof announcement !== 'object' || Array.isArray(announcement)) {
    return { ...fallbackAnnouncement };
  }
  const field = key => typeof announcement[key] === 'string' && announcement[key].trim()
    ? announcement[key].trim() : fallbackAnnouncement[key];
  return {
    title: field('title'),
    message: field('message'),
    image: field('image')
  };
}

function renderAnnouncement(announcement) {
  const container = document.querySelector("#pinned-announcement");
  if (!container) return;
  const image = document.createElement('img');
  image.alt = '';
  image.decoding = 'async';
  image.loading = 'lazy';
  image.addEventListener('error', () => {
    image.src = fallbackAnnouncement.image;
  }, { once: true });
  try {
    const url = new URL(announcement.image, document.baseURI);
    image.src = ['https:', 'http:', 'file:'].includes(url.protocol) ? url.href : fallbackAnnouncement.image;
  } catch {
    image.src = fallbackAnnouncement.image;
  }
  const content = document.createElement('div');
  const label = document.createElement('p');
  label.className = 'eyebrow';
  label.textContent = 'Pinned update';
  const title = document.createElement('h4');
  title.textContent = announcement.title;
  const message = document.createElement('p');
  message.textContent = announcement.message;
  content.append(label, title, message);
  container.replaceChildren(image, content);
}

fetch("data/announcement.json")
  .then((response) => {
    if (!response.ok) throw new Error("Unable to load announcement JSON");
    return response.json();
  })
  .then((data) => renderAnnouncement(parseAnnouncement(data)))
  .catch(() => renderAnnouncement(fallbackAnnouncement));
