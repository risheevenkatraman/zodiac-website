(() => {
  const search = document.querySelector('#roster-search');
  if (!search) return;
  const cards = [...document.querySelectorAll('.roster-card')].map(card => ({
    element: card,
    text: card.textContent.toLocaleLowerCase()
  }));
  const status = document.querySelector('#roster-status');
  document.querySelector('.roster-tools').hidden = false;
  search.addEventListener('input', () => {
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    cards.forEach(({ element, text }) => {
      element.hidden = !text.includes(query);
      if (!element.hidden) count++;
    });
    status.textContent = count ? `${count} of ${cards.length} players` : 'No players found. Try another name, role, or pick.';
  });
})();
