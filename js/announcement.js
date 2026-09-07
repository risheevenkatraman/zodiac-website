const fallbackAnnouncement = {
  title: "Welcome to Zodiac Esports",
  message: "Our Overwatch and VALORANT rosters are ready. Follow our teams and join the community for the latest updates.",
  image: "assets/announcement-placeholder.svg"
};

function parseAnnouncement(text) {
  const announcement = {};
  text.split(/\r?\n/).forEach((line) => {
    const separator = line.indexOf("=");
    if (separator > 0 && !line.trim().startsWith("#")) {
      const key = line.slice(0, separator).trim();
      announcement[key] = line.slice(separator + 1).trim();
    }
  });
  return {
    title: announcement.title || fallbackAnnouncement.title,
    message: announcement.message || fallbackAnnouncement.message,
    image: announcement.image || fallbackAnnouncement.image
  };
}

function renderAnnouncement(announcement) {
  const container = document.querySelector("#pinned-announcement");
  container.innerHTML = `
    <img src="${announcement.image}" alt="">
    <div>
      <p class="eyebrow">Pinned update</p>
      <h4>${announcement.title}</h4>
      <p>${announcement.message}</p>
    </div>
  `;
}

fetch("announcement.txt")
  .then((response) => {
    if (!response.ok) throw new Error("Unable to load announcement.txt");
    return response.text();
  })
  .then((text) => renderAnnouncement(parseAnnouncement(text)))
  .catch(() => renderAnnouncement(fallbackAnnouncement));
