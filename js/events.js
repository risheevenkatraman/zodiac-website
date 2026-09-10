// Parse calendar dates once in local time and reject impossible dates.
function parseEvents(data) {
  if (!Array.isArray(data)) throw new TypeError('Events must be a JSON array');
  return data.flatMap(event => {
    if (!event || typeof event !== 'object') return [];
    if (!['name', 'description', 'date'].every(key => typeof event[key] === 'string')) return [];
    const { name, description, date } = Object.fromEntries(
      ['name', 'description', 'date'].map(key => [key, event[key].trim()])
    );
    if (!name || !description || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
    const value = new Date(`${date}T12:00:00`);
    if (Number.isNaN(value.getTime())) return [];
    const [year, month, day] = date.split('-').map(Number);
    if (value.getFullYear() !== year || value.getMonth() + 1 !== month || value.getDate() !== day) return [];
    return [{ name, description, date, value }];
  }).sort((a, b) => a.value - b.value);
}

function renderEvents(events) {
  const timeline = document.querySelector('#event-timeline');
  if (!timeline) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = events.filter(event => event.value >= today);
  if (!upcoming.length) {
    timeline.textContent = 'No upcoming events. Check back soon for our next matches and community nights.';
    return;
  }
  const monthFormat = new Intl.DateTimeFormat(undefined, { month: 'short' });
  const dayFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric' });
  const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  const fragment = document.createDocumentFragment();
  for (const event of upcoming) {
    const article = document.createElement('article');
    article.className = 'event-item';
    const badge = document.createElement('div');
    badge.className = 'event-date';
    badge.setAttribute('aria-hidden', 'true');
    const month = document.createElement('span');
    month.textContent = monthFormat.format(event.value).toLocaleUpperCase();
    const day = document.createElement('strong');
    day.textContent = dayFormat.format(event.value);
    badge.append(month, day);
    const details = document.createElement('div');
    details.className = 'event-details';
    const date = document.createElement('time');
    date.className = 'event-readable-date';
    date.dateTime = event.date;
    date.textContent = dateFormat.format(event.value);
    const name = document.createElement('h4');
    name.textContent = event.name;
    const description = document.createElement('p');
    description.textContent = event.description;
    details.append(date, name, description);
    article.append(badge, details);
    fragment.append(article);
  }
  timeline.replaceChildren(fragment);
}

fetch('data/events.json')
  .then(response => {
    if (!response.ok) throw new Error('Unable to load events');
    return response.json();
  })
  .then(data => renderEvents(parseEvents(data)))
  .catch(() => {
    const timeline = document.querySelector('#event-timeline');
    if (timeline) timeline.textContent = 'Events are temporarily unavailable. Please try again later.';
  });
