(() => {
  'use strict';

  const root = document.querySelector('[data-magazine]');
  if (!root) return;

  const pages = Array.from(root.querySelectorAll('.magazine-page'));
  const previous = root.querySelector('[data-magazine-prev]');
  const next = root.querySelector('[data-magazine-next]');
  const status = root.querySelector('[data-magazine-status]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const rtl = document.documentElement.dir === 'rtl';
  const pageTemplate = root.dataset.pageTemplate || 'Page {current} of {total}';
  let current = 0;
  let turning = false;
  let pointerStart = null;

  const pageFromHash = () => {
    const match = window.location.hash.match(/^#p=(\d+)$/);
    if (!match) return 0;
    return Math.min(pages.length - 1, Math.max(0, Number(match[1]) - 1));
  };

  const updateState = () => {
    pages.forEach((page, index) => {
      const active = index === current;
      page.setAttribute('aria-hidden', String(!active));
      page.inert = !active;
    });
    previous.disabled = current === 0;
    next.disabled = current === pages.length - 1;
    status.textContent = pageTemplate
      .replace('{current}', String(current + 1))
      .replace('{total}', String(pages.length));
    const pageName = root.dataset.pageName || 'page';
    pages[current].setAttribute('aria-label', `${pageName} ${current + 1}`);
  };

  const clearTurnClasses = (page) => {
    page.classList.remove(
      'is-leaving-next', 'is-leaving-prev',
      'is-entering-next', 'is-entering-prev'
    );
  };

  const goTo = (target, immediate = false) => {
    const destination = Math.min(pages.length - 1, Math.max(0, target));
    if (destination === current || turning) return;

    const direction = destination > current ? 'next' : 'prev';
    const outgoing = pages[current];
    const incoming = pages[destination];
    clearTurnClasses(outgoing);
    clearTurnClasses(incoming);
    turning = !immediate && !reduceMotion.matches;

    outgoing.classList.remove('is-active');
    if (turning) outgoing.classList.add(`is-leaving-${direction}`);
    incoming.classList.add('is-active');
    if (turning) incoming.classList.add(`is-entering-${direction}`);

    current = destination;
    updateState();
    window.history.replaceState(null, '', `#p=${current + 1}`);

    if (!turning) return;
    window.setTimeout(() => {
      clearTurnClasses(outgoing);
      clearTurnClasses(incoming);
      turning = false;
    }, 560);
  };

  const turnNext = () => goTo(current + 1);
  const turnPrevious = () => goTo(current - 1);

  previous.addEventListener('click', turnPrevious);
  next.addEventListener('click', turnNext);

  root.querySelectorAll('a[href^="#p="]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      goTo(Number(link.getAttribute('href').slice(3)) - 1);
    });
  });

  root.addEventListener('keydown', (event) => {
    if (event.target.closest('input, select, textarea')) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      rtl ? turnPrevious() : turnNext();
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      rtl ? turnNext() : turnPrevious();
    }
    if (event.key === 'Home') {
      event.preventDefault();
      goTo(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      goTo(pages.length - 1);
    }
  });

  pages.forEach((page) => {
    page.addEventListener('click', (event) => {
      if (event.target.closest('a, button, input, select, textarea')) return;
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) return;
      const bounds = page.getBoundingClientRect();
      const fromLeft = event.clientX - bounds.left;
      const atStartEdge = rtl ? fromLeft > bounds.width * .78 : fromLeft < bounds.width * .22;
      const atEndEdge = rtl ? fromLeft < bounds.width * .22 : fromLeft > bounds.width * .78;
      if (atEndEdge) turnNext();
      if (atStartEdge) turnPrevious();
    });

    page.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse') return;
      pointerStart = { x: event.clientX, y: event.clientY };
    });

    page.addEventListener('pointerup', (event) => {
      if (!pointerStart) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      const forwardSwipe = rtl ? dx > 0 : dx < 0;
      forwardSwipe ? turnNext() : turnPrevious();
    });

    page.addEventListener('pointercancel', () => { pointerStart = null; });
  });

  window.addEventListener('hashchange', () => goTo(pageFromHash()));

  root.classList.add('magazine--enhanced');
  root.setAttribute('tabindex', '0');
  current = pageFromHash();
  pages.forEach((page, index) => page.classList.toggle('is-active', index === current));
  updateState();
})();
