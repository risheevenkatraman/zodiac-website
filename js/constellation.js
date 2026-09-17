// Links and star maps remain available without JavaScript.
(() => {
  const map = document.querySelector('.constellation-map');
  if (!map) return;
  const labels = [...map.querySelectorAll('.star-label')];
  const stars = [...map.querySelectorAll('.player-star')];
  const cards = [...document.querySelectorAll('.roster-card')];
  let hovered = null;
  let focused = null;

  function highlight() {
    const id = hovered || focused;
    for (const element of [...labels, ...stars]) {
      element.classList.toggle('is-active', element.dataset.player === id);
    }
    for (const card of cards) {
      card.classList.toggle(
        'constellation-active',
        Boolean(id) && card.getAttribute('href') === `../players/player-${id}.html`,
      );
    }
  }

  for (const element of [...labels, ...cards]) {
    const id =
      element.dataset.player || element.getAttribute('href').match(/player-(.+)\.html$/)?.[1];
    if (!id) continue;
    element.addEventListener('pointerenter', () => {
      hovered = id;
      highlight();
    });
    element.addEventListener('pointerleave', () => {
      hovered = null;
      highlight();
    });
    element.addEventListener('focus', () => {
      focused = id;
      highlight();
    });
    element.addEventListener('blur', () => {
      focused = null;
      highlight();
    });
  }
})();
