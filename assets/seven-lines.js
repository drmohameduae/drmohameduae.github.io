/* Seven Lines: the HTML is the publication. This script progressively adds
   page turning without hiding content from no-JS readers or printed copies. */
(function () {
  'use strict';

  function createPagination(stage, sourcePages) {
    var flowGroups = '.sl-article__text, .sl-toc, .sl-toc__list, .sl-lab, .sl-lab__items';
    var added = [];
    var layouts = sourcePages.map(function (page) {
      var body = page.querySelector('.sl-page__body');
      var folio = body.querySelector('.sl-folio');
      var parts = [];
      var groups = [];
      function collect(container, parents) {
        Array.from(container.children).forEach(function (child, index) {
          if (child === folio) return;
          if (child.matches(flowGroups)) {
            groups.push(child);
            collect(child, parents.concat(child));
          } else {
            parts.push({ node: child, parents: parents, order: index + 1 });
          }
        });
      }
      collect(body, []);
      return { page: page, body: body, folio: folio, groups: groups, parts: parts };
    });

    function makeSheet(page, body, folio, original) {
      return { page: page, body: body, folio: folio, original: original, groups: new Map() };
    }
    function reset(layout) {
      layout.groups.forEach(function (group) { group.replaceChildren(); });
      layout.body.replaceChildren(layout.folio);
      layout.body.style.removeProperty('--sl-fit');
      return makeSheet(layout.page, layout.body, layout.folio, true);
    }
    function place(part, sheet) {
      var parent = sheet.body;
      part.parents.forEach(function (group) {
        var wrapper = sheet.groups.get(group);
        if (!wrapper) {
          wrapper = sheet.original ? group : group.cloneNode(false);
          if (group.matches('.sl-lab__items')) wrapper.start = part.order;
          parent.insertBefore(wrapper, parent === sheet.body ? sheet.folio : null);
          sheet.groups.set(group, wrapper);
        }
        parent = wrapper;
      });
      parent.insertBefore(part.node, parent === sheet.body ? sheet.folio : null);
    }
    function takeOut(part, sheet) {
      part.node.remove();
      for (var i = part.parents.length - 1; i >= 0; i--) {
        var group = part.parents[i];
        var wrapper = sheet.groups.get(group);
        if (wrapper.childElementCount) break;
        wrapper.remove();
        sheet.groups.delete(group);
      }
    }
    function continueOn(layout, after, number) {
      var page = layout.page.cloneNode(false);
      page.id = layout.page.id + '-' + number;
      page.classList.remove('is-active');
      var body = layout.body.cloneNode(false);
      body.style.removeProperty('--sl-fit');
      var folio = layout.folio.cloneNode(true);
      body.append(folio);
      page.append(body);
      after.after(page);
      added.push(page);
      return makeSheet(page, body, folio, false);
    }
    function fitRatio(sheet) {
      return Math.min(sheet.page.clientHeight / sheet.body.scrollHeight, sheet.page.clientWidth / sheet.body.scrollWidth);
    }
    function runsOffSheet(sheet) {
      // Fractional CSS pixels can differ by one pixel in the rounded client and scroll metrics.
      return sheet.body.scrollHeight > sheet.page.clientHeight + 1;
    }
    function fitIndivisible(sheet, scale = 1) {
      // Wide tables, covers and other indivisible blocks may need to scale on very short screens.
      for (var i = 0; i < 4; i++) {
        var ratio = fitRatio(sheet);
        if (ratio >= scale - .001) break;
        scale = ratio;
        sheet.body.style.setProperty('--sl-fit', String(scale));
      }
    }
    function removeContinuations() {
      added.forEach(function (page) { page.remove(); });
      added = [];
    }
    function restore() {
      removeContinuations();
      layouts.forEach(function (layout) {
        var sheet = reset(layout);
        layout.parts.forEach(function (part) { place(part, sheet); });
      });
      return sourcePages;
    }
    function correctOverflow(pages) {
      pages.forEach(function (page) {
        var body = page.querySelector('.sl-page__body');
        var scale = Number(body.style.getPropertyValue('--sl-fit')) || 1;
        if (body.scrollHeight * scale > page.clientHeight + 1 || body.scrollWidth * scale > page.clientWidth + 1) {
          fitIndivisible({ page: page, body: body }, scale);
        }
      });
    }
    function paginate() {
      if (!stage.clientWidth || !stage.clientHeight) return restore();
      removeContinuations();
      var pages = [];
      layouts.forEach(function (layout) {
        // Budget room for the answer guide while closed, so opening it can never clip the answers.
        var guide = layout.parts.find(function (part) { return part.node.matches('.sl-lab__guide'); })?.node;
        var wasOpen = guide?.open;
        if (guide) guide.open = true;
        var sheet = reset(layout);
        pages.push(sheet.page);
        layout.parts.forEach(function (part) { place(part, sheet); });
        if (runsOffSheet(sheet) && layout.parts.length > 1) {
          sheet = reset(layout);
          var number = 1;
          var count = 0;
          layout.parts.forEach(function (part) {
            place(part, sheet);
            if (count && runsOffSheet(sheet)) {
              takeOut(part, sheet);
              fitIndivisible(sheet);
              sheet = continueOn(layout, sheet.page, ++number);
              pages.push(sheet.page);
              place(part, sheet);
              count = 0;
            }
            count++;
          });
        }
        fitIndivisible(sheet);
        if (guide) guide.open = wasOpen;
      });
      return pages;
    }
    return { paginate: paginate, restore: restore, correctOverflow: correctOverflow };
  }

  function initBook(book) {
    var sourcePages = Array.from(book.querySelectorAll('[data-sl-page]'));
    var viewport = book.querySelector('.sl-book__viewport');
    var paper = book.querySelector('.sl-book__paper');
    var stage = book.querySelector('.sl-book__stage');
    var toolbar = book.querySelector('.sl-book__toolbar');
    var controls = book.querySelector('.sl-book__controls');
    if (!sourcePages.length || !viewport || !paper || !stage || !toolbar || !controls || book.dataset.slReady) return;
    book.dataset.slReady = 'true';
    var pagination = createPagination(stage, sourcePages);
    var pages = sourcePages;
    var pageIndexes = new Map();
    var folioPrefix = sourcePages[0].querySelector('.sl-folio').textContent.replace(/\d+ \/ \d+$/, '');
    var printAnchor = null;
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
    var readingOptions = book.querySelector('.sl-book__options');
    var optionsSummary = readingOptions?.querySelector('summary');
    var zoomIn = book.querySelector('[data-sl-zoom-in]');
    var zoomOut = book.querySelector('[data-sl-zoom-out]');
    var pageWord = book.dataset.labelPage || '';
    var ofWord = book.dataset.labelOf || '/';
    var turnClasses = ['is-over', 'is-under', 'is-turn-out-next', 'is-turn-in-prev'];

    if (!stage.hasAttribute('tabindex')) stage.setAttribute('tabindex', '-1');
    if (progress) {
      progress.setAttribute('role', 'status');
      progress.setAttribute('aria-live', 'polite');
      progress.setAttribute('aria-atomic', 'true');
    }
    book.classList.add('sl-book--enhanced');

    function label(index) {
      return [pageWord, index + 1, ofWord, pages.length].filter(Boolean).join(' ');
    }
    function pageIndex(id) {
      return pageIndexes.get(id) ?? pageIndexes.get(id.replace(/^(page-\d+)-\d+$/, '$1'));
    }
    function hashPage() {
      return pageIndex(location.hash.slice(1));
    }
    function updateHash() {
      var hash = '#' + pages[current].id;
      if (location.hash === hash) return;
      try { history.replaceState(history.state, '', location.pathname + location.search + hash); } catch (_) { /* Reader remains usable if history is unavailable. */ }
    }
    function updatePageList() {
      pageIndexes = new Map();
      var options = document.createDocumentFragment();
      pages.forEach(function (page, i) {
        pageIndexes.set(page.id, i);
        page.dataset.slPage = String(i);
        page.tabIndex = -1;
        page.setAttribute('role', 'group');
        page.setAttribute('aria-label', label(i));
        page.querySelector('.sl-folio').textContent = folioPrefix + (i + 1) + ' / ' + pages.length;
        if (!selector) return;
        var option = document.createElement('option');
        option.value = String(i);
        option.textContent = (i + 1) + ' · ' + (page.dataset.slLabel || pageWord);
        options.append(option);
      });
      book.dataset.total = String(pages.length);
      if (selector) selector.replaceChildren(options);
      book.querySelectorAll('.sl-toc__page, .sl-thumbnails [data-sl-goto] > :first-child').forEach(function (number) {
        var link = number.closest('[data-sl-goto]');
        var index = pageIndex(sourcePages[Number(link.dataset.slGoto)].id);
        number.textContent = String(index + 1);
      });
    }
    function updateControls() {
      if (previous) previous.disabled = current === 0;
      if (next) next.disabled = current === pages.length - 1;
      if (progress) progress.textContent = label(current);
      if (selector) selector.value = String(current);
      book.dataset.currentPage = String(current + 1);
      book.querySelectorAll('.sl-thumbnails [data-sl-goto]').forEach(function (button) {
        if (pageIndex(sourcePages[Number(button.dataset.slGoto)].id) === current) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      });
    }
    function closeOptions(restoreFocus) {
      if (!readingOptions?.open) return;
      readingOptions.open = false;
      if (restoreFocus) optionsSummary.focus({ preventScroll: true });
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
    function fitStage() {
      var style = window.getComputedStyle(paper);
      var gap = controls.getBoundingClientRect().top - toolbar.getBoundingClientRect().bottom;
      var availableHeight = gap - (parseFloat(style.paddingTop) || 0) - (parseFloat(style.paddingBottom) || 0);
      var width = Math.max(0, Math.min(paper.getBoundingClientRect().width, availableHeight * 210 / 297));
      var value = Math.floor(width * 100) / 100 + 'px';
      if (stage.style.getPropertyValue('--sl-sheet-width') === value) return false;
      stage.style.setProperty('--sl-sheet-width', value);
      return true;
    }
    function refreshLayout(anchor) {
      var active = document.activeElement;
      var restoreFocus = stage.contains(active);
      pending = null;
      cleanTurn();
      if (!linear) fitStage();
      pages = linear ? pagination.restore() : pagination.paginate();
      updatePageList();
      if (!linear && stage.clientHeight) pagination.correctOverflow(pages);
      show(pageIndex(anchor) ?? 0, false);
      if (restoreFocus) {
        var target = pages[current].contains(active) ? active : pages[current];
        target.focus({ preventScroll: true });
      }
    }
    function revealReader() {
      if (linear || document.fullscreenElement === book || book.classList.contains('sl-book--immersive')) return;
      var rect = viewport.getBoundingClientRect();
      if (rect.top < -1 || rect.bottom > window.innerHeight + 1) {
        viewport.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    }
    function gotoPage(index, options) {
      options = options || {};
      if (!Number.isFinite(index)) return;
      index = Math.max(0, Math.min(pages.length - 1, Math.floor(index)));
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
      revealReader();
      if (index === current) {
        if (options.focus) pages[index].focus({ preventScroll: true });
        return;
      }
      var from = pages[current];
      var to = pages[index];
      var forward = index > current;
      var moveFocus = options.focus || from.contains(document.activeElement);
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
      if (!readingOptions?.contains(event.target)) closeOptions(false);
      var target = event.target.closest && event.target.closest('[data-sl-goto], [data-sl-contents]');
      if (!target || !book.contains(target)) return;
      event.preventDefault();
      var index = target.hasAttribute('data-sl-contents') ? 1 : Number(target.dataset.slGoto);
      gotoPage(pageIndex(sourcePages[index].id), { focus: true });
    });
    book.addEventListener('keydown', function (event) {
      if (event.key === 'Tab' && book.classList.contains('sl-book--immersive')) {
        var focusables = Array.prototype.slice.call(book.querySelectorAll('a[href], button:not(:disabled), select, input, textarea, summary, [tabindex="0"]')).filter(function (element) {
          return !element.closest('[inert]') && element.getClientRects().length
            && (!element.closest('details:not([open])') || element.matches('summary'));
        });
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (event.shiftKey && (document.activeElement === first || !focusables.includes(document.activeElement))) {
          event.preventDefault(); if (last) last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); if (first) first.focus();
        }
      }
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === 'Escape' && readingOptions?.open) {
        event.preventDefault(); closeOptions(true); return;
      }
      if (event.key === 'Escape' && book.classList.contains('sl-book--immersive')) {
        event.preventDefault(); exitImmersive(); return;
      }
      if (event.target.closest('input, textarea, select, [contenteditable="true"], summary')) return;
      if (linear) return;
      var destination = null;
      if (event.key === 'ArrowRight') destination = current + (rtl ? -1 : 1);
      if (event.key === 'ArrowLeft') destination = current + (rtl ? 1 : -1);
      if (event.key === 'Home') destination = 0;
      if (event.key === 'End') destination = pages.length - 1;
      if (destination !== null) { event.preventDefault(); gotoPage(destination); }
    });
    window.addEventListener('hashchange', function () {
      var index = hashPage();
      if (index !== undefined) gotoPage(index, { hash: false, animate: false });
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
      var before = size;
      size = Math.max(1, Math.min(1.6, Math.round(value * 100) / 100));
      book.style.setProperty('--sl-text-scale', String(size));
      if (zoomOut) zoomOut.disabled = size <= 1;
      if (zoomIn) zoomIn.disabled = size >= 1.6;
      if (size !== before && !linear) refreshLayout(pages[current].id);
    }
    if (zoomIn) zoomIn.addEventListener('click', function () { setZoom(size + .15); });
    if (zoomOut) zoomOut.addEventListener('click', function () { setZoom(size - .15); });
    setZoom(1);

    if (viewButton) {
      viewButton.setAttribute('aria-pressed', 'false');
      viewButton.addEventListener('click', function () {
        closeOptions(true);
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
        var anchor = pages[current].id;
        linear = !linear;
        book.classList.toggle('sl-book--linear', linear);
        viewButton.setAttribute('aria-pressed', String(linear));
        var text = linear ? book.dataset.labelMagazine : book.dataset.labelReading;
        if (text) viewButton.textContent = text;
        refreshLayout(anchor);
        updateHash();
        if (linear) pages[current].scrollIntoView({ block: 'start', behavior: 'auto' });
        else revealReader();
      });
    }

    function fullScreenState() {
      closeOptions(true);
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
      if (optionsSummary) optionsSummary.focus({ preventScroll: true });
    }
    function exitImmersive() {
      book.classList.remove('sl-book--immersive');
      document.body.style.overflow = savedOverflow;
      fullScreenState();
      if (optionsSummary) optionsSummary.focus({ preventScroll: true });
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
      if (printAnchor) return;
      printAnchor = pages[current].id;
      pending = null;
      cleanTurn();
      pages = pagination.restore();
      updatePageList();
      pages.forEach(function (page) { page.inert = false; page.removeAttribute('aria-hidden'); });
    });
    window.addEventListener('afterprint', function () {
      if (!printAnchor) return;
      var anchor = printAnchor;
      printAnchor = null;
      refreshLayout(anchor);
    });
    function refit() {
      if (linear || printAnchor) return;
      var bounds = viewport.getBoundingClientRect();
      refreshLayout(pages[current].id);
      if (bounds.top <= 1 && bounds.bottom >= window.innerHeight / 2) revealReader();
    }
    var anchor = location.hash.slice(1);
    refreshLayout(anchor);
    if (!anchor || hashPage() !== undefined) {
      revealReader();
      if (anchor) window.addEventListener('pageshow', function () {
        if (location.hash.slice(1) === anchor) window.requestAnimationFrame(revealReader);
      }, { once: true });
    }
    if (window.ResizeObserver) {
      var resize = new ResizeObserver(function () {
        if (!linear && !printAnchor && fitStage()) refit();
      });
      [viewport, toolbar, controls].forEach(function (element) { resize.observe(element); });
    } else window.addEventListener('resize', refit);
    if (document.fonts) {
      var fontFrame = 0;
      function refitFonts() {
        if (fontFrame) return;
        fontFrame = window.requestAnimationFrame(function () {
          fontFrame = 0;
          refit();
        });
      }
      document.fonts.ready.then(refitFonts);
      document.fonts.addEventListener('loadingdone', refitFonts);
    }
  }

  function init() {
    document.querySelectorAll('[data-sl-book]').forEach(initBook);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
