/* Seven Lines: the HTML is the publication. This script progressively adds
   page turning without hiding content from no-JS readers or printed copies. */
(function () {
  'use strict';

  function initBook(book) {
    var pages = Array.prototype.slice.call(book.querySelectorAll('[data-sl-page]'));
    if (!pages.length || book.dataset.slReady) return;
    book.dataset.slReady = 'true';
    var stage = book.querySelector('.sl-book__stage');
    if (!stage) return;
    var total = pages.length;
    var current = 0;
    var linear = false;
    var turning = false;
    var pending = null;
    var turnTimer = null;
    var turnEnd = null;
    var animatedPage = null;
    var size = 1;
    var savedOverflow = '';
    var rtl = document.documentElement.dir === 'rtl';
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var previous = book.querySelector('[data-sl-prev]');
    var next = book.querySelector('[data-sl-next]');
    var progress = book.querySelector('[data-sl-progress]');
    var selector = book.querySelector('[data-sl-pages]');
    var viewButton = book.querySelector('[data-sl-view]');
    var fullscreenButton = book.querySelector('[data-sl-fullscreen]');
    var zoomIn = book.querySelector('[data-sl-zoom-in]');
    var zoomOut = book.querySelector('[data-sl-zoom-out]');
    var pageWord = book.dataset.labelPage || '';
    var ofWord = book.dataset.labelOf || '/';
    var turnClasses = ['is-over', 'is-under', 'is-turn-out-next', 'is-turn-in-prev'];

    pages.forEach(function (page, i) {
      if (!page.hasAttribute('tabindex')) page.setAttribute('tabindex', '-1');
      if (!page.id) page.id = 'sl-page-' + (i + 1);
      page.setAttribute('role', 'group');
      if (!page.hasAttribute('aria-label')) page.setAttribute('aria-label', label(i));
    });
    if (!stage.hasAttribute('tabindex')) stage.setAttribute('tabindex', '-1');
    if (progress) {
      progress.setAttribute('role', 'status');
      progress.setAttribute('aria-live', 'polite');
      progress.setAttribute('aria-atomic', 'true');
    }
    if (selector && !selector.options.length) {
      pages.forEach(function (page, i) {
        var option = document.createElement('option');
        option.value = String(i);
        option.textContent = (i + 1) + ' · ' + (page.dataset.slLabel || pageWord);
        selector.appendChild(option);
      });
    }
    book.classList.add('sl-book--enhanced');

    function label(index) {
      return [pageWord, index + 1, ofWord, total].filter(Boolean).join(' ');
    }
    function hashPage() {
      var match = /^#page-(\d+)$/.exec(location.hash);
      return match ? Math.max(0, Math.min(total - 1, Number(match[1]) - 1)) : null;
    }
    function updateHash() {
      var hash = '#page-' + (current + 1);
      if (location.hash === hash) return;
      try { history.replaceState(history.state, '', location.pathname + location.search + hash); } catch (_) { /* Reader remains usable if history is unavailable. */ }
    }
    function updateControls() {
      if (previous) previous.disabled = current === 0;
      if (next) next.disabled = current === total - 1;
      if (progress) progress.textContent = label(current);
      if (selector) selector.value = String(current);
      book.dataset.currentPage = String(current + 1);
      book.querySelectorAll('.sl-thumbnails [data-sl-goto]').forEach(function (button) {
        if (Number(button.dataset.slGoto) === current) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      });
    }
    function setAccessiblePages() {
      pages.forEach(function (page, i) {
        var hidden = !linear && i !== current;
        page.inert = hidden;
        if (hidden) page.setAttribute('aria-hidden', 'true');
        else page.removeAttribute('aria-hidden');
      });
    }
    function cleanTurn() {
      if (turnTimer) window.clearTimeout(turnTimer);
      if (animatedPage && turnEnd) animatedPage.removeEventListener('animationend', turnEnd);
      turnTimer = null;
      turnEnd = null;
      animatedPage = null;
      pages.forEach(function (page, i) {
        page.classList.remove.apply(page.classList, turnClasses);
        page.classList.toggle('is-active', i === current);
      });
      turning = false;
    }
    function show(index, writeHash, focusPage) {
      current = index;
      cleanTurn();
      setAccessiblePages();
      if (focusPage) pages[index].focus({ preventScroll: true });
      updateControls();
      if (writeHash) updateHash();
    }
    function gotoPage(index, options) {
      options = options || {};
      if (!Number.isFinite(index)) return;
      index = Math.max(0, Math.min(total - 1, Math.floor(index)));
      if (turning) {
        pending = { index: index, options: options };
        return;
      }
      if (linear) {
        current = index;
        updateControls();
        if (options.hash !== false) updateHash();
        pages[index].scrollIntoView({ block: 'start', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        if (options.focus) pages[index].focus({ preventScroll: true });
        return;
      }
      if (index === current) {
        if (options.focus) pages[index].focus({ preventScroll: true });
        return;
      }
      var from = pages[current];
      var to = pages[index];
      var forward = index > current;
      var moveFocus = options.focus || from.contains(document.activeElement);
      to.scrollTop = 0;
      if (reduceMotion.matches || options.animate === false) {
        show(index, options.hash !== false, moveFocus);
        return;
      }
      current = index;
      turning = true;
      to.classList.add('is-active');
      if (forward) {
        to.classList.add('is-under');
        from.classList.add('is-over', 'is-turn-out-next');
        animatedPage = from;
      } else {
        from.classList.add('is-under');
        to.classList.add('is-over', 'is-turn-in-prev');
        animatedPage = to;
      }
      /* The destination must be operable before it can receive keyboard focus. */
      setAccessiblePages();
      if (moveFocus) to.focus({ preventScroll: true });
      updateControls();
      if (options.hash !== false) updateHash();
      function finish(event) {
        if (event && event.target !== animatedPage) return;
        cleanTurn();
        var queued = pending;
        pending = null;
        if (queued) gotoPage(queued.index, queued.options);
      }
      turnEnd = finish;
      animatedPage.addEventListener('animationend', finish);
      /* An interrupted animation must never leave navigation locked. */
      turnTimer = window.setTimeout(finish, 700);
    }

    if (previous) previous.addEventListener('click', function () { gotoPage(current - 1); });
    if (next) next.addEventListener('click', function () { gotoPage(current + 1); });
    if (selector) selector.addEventListener('change', function () { gotoPage(Number(selector.value), { focus: true }); });
    book.addEventListener('click', function (event) {
      var target = event.target.closest && event.target.closest('[data-sl-goto], [data-sl-contents]');
      if (!target || !book.contains(target)) return;
      event.preventDefault();
      gotoPage(target.hasAttribute('data-sl-contents') ? 1 : Number(target.dataset.slGoto), { focus: true });
    });
    book.addEventListener('keydown', function (event) {
      if (event.key === 'Tab' && book.classList.contains('sl-book--immersive')) {
        var focusables = Array.prototype.slice.call(book.querySelectorAll('a[href], button:not(:disabled), select, input, textarea, summary, [tabindex="0"]')).filter(function (element) {
          return !element.closest('[inert]') && element.getClientRects().length;
        });
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (event.shiftKey && (document.activeElement === first || !focusables.includes(document.activeElement))) {
          event.preventDefault(); if (last) last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); if (first) first.focus();
        }
      }
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === 'Escape' && book.classList.contains('sl-book--immersive')) {
        event.preventDefault(); exitImmersive(); return;
      }
      if (event.target.closest('input, textarea, select, [contenteditable="true"], summary')) return;
      if (linear) return;
      var destination = null;
      if (event.key === 'ArrowRight') destination = current + (rtl ? -1 : 1);
      if (event.key === 'ArrowLeft') destination = current + (rtl ? 1 : -1);
      if (event.key === 'Home') destination = 0;
      if (event.key === 'End') destination = total - 1;
      if (destination !== null) { event.preventDefault(); gotoPage(destination); }
    });
    window.addEventListener('hashchange', function () {
      var index = hashPage();
      if (index !== null) gotoPage(index, { hash: false, animate: false });
    });

    /* Only horizontal touch gestures turn pages; text selection, links,
       multi-touch zoom and ordinary vertical reading remain native. */
    var touch = null;
    stage.addEventListener('touchstart', function (event) {
      touch = null;
      if (linear || event.touches.length !== 1 || event.target.closest('button, a, input, select, textarea')) return;
      touch = { x: event.touches[0].clientX, y: event.touches[0].clientY, time: Date.now() };
    }, { passive: true });
    stage.addEventListener('touchend', function (event) {
      if (!touch || event.changedTouches.length !== 1) { touch = null; return; }
      var dx = event.changedTouches[0].clientX - touch.x;
      var dy = event.changedTouches[0].clientY - touch.y;
      var elapsed = Date.now() - touch.time;
      touch = null;
      if (elapsed > 900 || Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.7) return;
      if (window.getSelection && String(window.getSelection()).length) return;
      gotoPage(current + ((dx < 0) !== rtl ? 1 : -1));
    }, { passive: true });
    stage.addEventListener('touchcancel', function () { touch = null; }, { passive: true });

    function setZoom(value) {
      size = Math.max(1, Math.min(1.6, Math.round(value * 100) / 100));
      book.style.setProperty('--sl-text-scale', String(size));
      if (zoomOut) zoomOut.disabled = size <= 1;
      if (zoomIn) zoomIn.disabled = size >= 1.6;
    }
    if (zoomIn) zoomIn.addEventListener('click', function () { setZoom(size + .15); });
    if (zoomOut) zoomOut.addEventListener('click', function () { setZoom(size - .15); });
    setZoom(1);

    if (viewButton) {
      viewButton.setAttribute('aria-pressed', 'false');
      viewButton.addEventListener('click', function () {
        pending = null;
        cleanTurn();
        if (linear) {
          var closest = current;
          var distance = Infinity;
          pages.forEach(function (page, i) {
            var rect = page.getBoundingClientRect();
            var value = Math.abs(rect.top - Math.min(120, window.innerHeight / 4));
            if (rect.bottom > 0 && value < distance) { closest = i; distance = value; }
          });
          current = closest;
        }
        linear = !linear;
        book.classList.toggle('sl-book--linear', linear);
        viewButton.setAttribute('aria-pressed', String(linear));
        var text = linear ? book.dataset.labelMagazine : book.dataset.labelReading;
        if (text) viewButton.textContent = text;
        show(current, true);
        if (linear) pages[current].scrollIntoView({ block: 'start', behavior: 'auto' });
        else stage.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      });
    }

    function fullScreenState() {
      var active = document.fullscreenElement === book || book.classList.contains('sl-book--immersive');
      if (fullscreenButton) {
        fullscreenButton.setAttribute('aria-pressed', String(active));
        var text = active ? book.dataset.labelExitFullscreen : book.dataset.labelFullscreen;
        if (text) fullscreenButton.textContent = text;
      }
    }
    function enterImmersive() {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      book.classList.add('sl-book--immersive');
      fullScreenState();
      if (fullscreenButton) fullscreenButton.focus({ preventScroll: true });
    }
    function exitImmersive() {
      book.classList.remove('sl-book--immersive');
      document.body.style.overflow = savedOverflow;
      fullScreenState();
      if (fullscreenButton) fullscreenButton.focus({ preventScroll: true });
    }
    if (fullscreenButton) fullscreenButton.addEventListener('click', function () {
      if (book.classList.contains('sl-book--immersive')) { exitImmersive(); return; }
      if (document.fullscreenElement === book) {
        if (document.exitFullscreen) document.exitFullscreen().catch(function () {});
        return;
      }
      if (book.requestFullscreen && document.fullscreenEnabled) {
        try {
          var promise = book.requestFullscreen();
          if (promise && promise.catch) promise.catch(enterImmersive);
        } catch (_) { enterImmersive(); }
      } else { enterImmersive(); }
    });
    document.addEventListener('fullscreenchange', fullScreenState);
    fullScreenState();

    window.addEventListener('beforeprint', function () {
      pages.forEach(function (page) { page.inert = false; page.removeAttribute('aria-hidden'); });
    });
    window.addEventListener('afterprint', setAccessiblePages);
    show(hashPage() === null ? 0 : hashPage(), false);
  }

  function init() {
    document.querySelectorAll('[data-sl-book]').forEach(initBook);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
