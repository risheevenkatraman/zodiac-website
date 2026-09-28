// Parse calendar dates once in local time and reject impossible dates.
function parseEvents(data) {
  if (!Array.isArray(data)) throw new TypeError('Events must be a JSON array');
  return data
    .flatMap((event) => {
      if (!event || typeof event !== 'object') return [];
      if (!['name', 'description', 'date'].every((key) => typeof event[key] === 'string'))
        return [];
      const { name, description, date } = Object.fromEntries(
        ['name', 'description', 'date'].map((key) => [key, event[key].trim()]),
      );
      if (!name || !description || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
      const value = new Date(`${date}T12:00:00`);
      if (Number.isNaN(value.getTime())) return [];
      const [year, month, day] = date.split('-').map(Number);
      if (value.getFullYear() !== year || value.getMonth() + 1 !== month || value.getDate() !== day)
        return [];
      return [{ name, description, date, value }];
    })
    .sort((a, b) => a.value - b.value);
}

function currentMonthEvents(events, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return events.filter((event) => event.value >= today && event.value < nextMonth);
}

module.exports = { parseEvents, currentMonthEvents };
