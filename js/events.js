const fallbackEvents = [
  {
    name: "Season kickoff",
    description: "Follow our opening matches and roster updates.",
    date: "2026-10-01"
  },
  {
    name: "Community night",
    description: "Join the Zodiac community for games and announcements.",
    date: "2026-10-15"
  }
];

function parseEvents(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [name, description, date] = line.split("|").map((part) => part.trim());
      return { name, description, date };
    })
    .filter((event) => event.name && event.description && event.date && !Number.isNaN(Date.parse(event.date)))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

function renderEvents(events) {
  const timeline = document.querySelector("#event-timeline");
  if (!events.length) {
    timeline.innerHTML = '<p class="event-status">No events are scheduled yet. Add one to events.txt to get started.</p>';
    return;
  }

  timeline.innerHTML = events.map((event) => {
    const date = new Date(`${event.date}T12:00:00`);
    const month = date.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
    const day = date.toLocaleDateString(undefined, { day: "numeric" });
    const readableDate = date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    return `
      <article class="event-item">
        <div class="event-date" aria-label="${readableDate}">
          <span>${month}</span>
          <strong>${day}</strong>
        </div>
        <div class="event-details">
          <p class="event-readable-date">${readableDate}</p>
          <h4>${event.name}</h4>
          <p>${event.description}</p>
        </div>
      </article>
    `;
  }).join("");
}

fetch("events.txt")
  .then((response) => {
    if (!response.ok) throw new Error("Unable to load events.txt");
    return response.text();
  })
  .then((text) => renderEvents(parseEvents(text)))
  .catch(() => renderEvents(fallbackEvents));
