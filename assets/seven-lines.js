/* DRMOHAMED.NET — Seven Lines magazine reader behaviour.
   Progressive enhancement: without script the pages read as a flat stack.
   With script, one page shows at a time and turns in 3D (RTL-aware). */
(function () {
  'use strict';

  /* Graceful image fallback: replace a missing magazine image with a branded
     olive/gold placeholder so the layout never breaks. */
  var FALLBACK =
    'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">' +
      '<rect width="800" height="500" fill="#2D4030"/>' +
      '<rect x="24" y="24" width="752" height="452" fill="none" stroke="#B8956A" stroke-width="2"/>' +
      '<rect x="40" y="40" width="720" height="420" fill="none" stroke="#B8956A" stroke-width="1" opacity="0.6"/>' +
      '<g transform="translate(400,235)"><rect x="-14" y="-14" width="28" height="28" transform="rotate(45)" fill="#B8956A"/></g>' +
      '<text x="400" y="300" font-family="serif" font-size="26" fill="#F7F5F0" text-anchor="middle" opacity="0.85">Seven Lines</text>' +
      '</svg>'
    );

  function armFallbacks(root) {
    var imgs = root.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      (function (img) {
        function swap() { if (img.src !== FALLBACK) img.src = FALLBACK; }
        img.addEventListener('error', swap);
        if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) swap();
      })(imgs[i]);
    }
  }

  function initBook(book) {
    var pages = Array.prototype.slice.call(book.querySelectorAll('[data-sl-page]'));
    if (!pages.length) return;
    var total = pages.length;
    var prevBtn = book.querySelector('[data-sl-prev]');
    var nextBtn = book.querySelector('[data-sl-next]');
    var progress = book.querySelector('[data-sl-progress]');
    var current = 0;
    var animating = false;

    book.classList.add('sl-book--enhanced');

    function resetAllScroll() { pages.forEach(function (p) { p.scrollTop = 0; }); }

    // Measure a page's natural content height. Filling pages (cover, openers,
    // breakers, back cover) use block-size:100%, which resolves against the
    // stage — so temporarily take the page out of absolute positioning, where
    // 100% resolves to auto and the content sizes itself.
    function naturalHeight(p) {
      var pos = p.style.position, vis = p.style.visibility, ins = p.style.inset;
      p.style.position = 'static';
      p.style.visibility = 'hidden';
      p.style.inset = 'auto';
      var h = p.offsetHeight;
      p.style.position = pos;
      p.style.visibility = vis;
      p.style.inset = ins;
      return h;
    }

    // Size the stage to the tallest page so no page has to scroll, then pin
    // every page to the top (browsers restore scroll on reflow).
    function sizeStage() {
      var stage = book.querySelector('.sl-book__stage');
      var sizer = book.querySelector('.sl-book__sizer');
      if (!stage) return;
      var max = 0;
      pages.forEach(function (p) { max = Math.max(max, naturalHeight(p)); });
      var cap = Math.max(480, window.innerHeight - 40);
      var h = Math.min(max, cap);
      stage.style.blockSize = h + 'px';
      if (sizer) sizer.style.blockSize = h + 'px';
      resetAllScroll();
    }

    function setProgress() {
      if (progress) progress.textContent = (current + 1) + ' / ' + total;
      if (prevBtn) prevBtn.disabled = current === 0;
      if (nextBtn) nextBtn.disabled = current === total - 1;
    }

    function show(idx) {
      pages.forEach(function (p, i) {
        p.classList.toggle('is-active', i === idx);
        p.classList.remove('is-over', 'is-under', 'is-turn-out-next', 'is-turn-in-prev');
        p.scrollTop = 0;
      });
      current = idx;
      setProgress();
    }

    function goto(idx) {
      idx = Math.max(0, Math.min(total - 1, idx));
      if (idx === current || animating) return;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { show(idx); return; }

      var from = pages[current];
      var to = pages[idx];
      animating = true;

      if (idx > current) {
        to.classList.add('is-active', 'is-under');
        from.classList.add('is-over', 'is-turn-out-next');
        from.addEventListener('animationend', function done() {
          from.removeEventListener('animationend', done);
          from.classList.remove('is-active', 'is-over', 'is-turn-out-next');
          to.classList.remove('is-under');
          animating = false;
        });
      } else {
        from.classList.add('is-under');
        to.classList.add('is-active', 'is-over', 'is-turn-in-prev');
        to.addEventListener('animationend', function done() {
          to.removeEventListener('animationend', done);
          from.classList.remove('is-active', 'is-under');
          to.classList.remove('is-over', 'is-turn-in-prev');
          animating = false;
        });
      }
      current = idx;
      pages[idx].scrollTop = 0;
      setProgress();
      if (book.scrollIntoView) book.scrollIntoView({ block: 'nearest' });
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goto(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goto(current + 1); });

    book.addEventListener('click', function (ev) {
      var jump = ev.target.closest && ev.target.closest('[data-sl-goto]');
      if (jump) { goto(parseInt(jump.getAttribute('data-sl-goto'), 10)); }
    });

    document.addEventListener('keydown', function (ev) {
      if (!book.contains(document.activeElement) && document.activeElement !== document.body) return;
      var rtl = document.documentElement.getAttribute('dir') === 'rtl';
      if (ev.key === 'ArrowRight') { rtl ? goto(current - 1) : goto(current + 1); }
      else if (ev.key === 'ArrowLeft') { rtl ? goto(current + 1) : goto(current - 1); }
    });

    sizeStage();
    show(0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { sizeStage(); });
    window.addEventListener('load', function () { sizeStage(); });
  }

  function init() {
    armFallbacks(document);
    var books = document.querySelectorAll('[data-sl-book]');
    for (var i = 0; i < books.length; i++) initBook(books[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
