/* DRMOHAMED.NET — Founder's Edition Version 1.0
   Progressive enhancement only (FE-09 §10.1): every journey works without
   this script. Handles: mobile navigation, language preference, contact
   submission states, Yaqoot service availability.
   No form content or question text is ever sent to analytics (FE-06 §5.2). */
(function () {
  "use strict";

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.querySelector("[data-primary-nav]");
  function syncNavVisibility() {
    if (!nav) return;
    if (window.innerWidth > 896) {
      nav.hidden = false;
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    } else if (toggle) {
      nav.hidden = toggle.getAttribute("aria-expanded") !== "true";
    }
  }
  if (toggle && nav) {
    syncNavVisibility();
    window.addEventListener("resize", syncNavVisibility);
    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      nav.hidden = expanded;
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        toggle.setAttribute("aria-expanded", "false");
        nav.hidden = true;
        toggle.focus(); /* return focus to trigger (FE-03 §10.2) */
      }
    });
  }

  /* ---------- Language selector ----------
     Preference is stored locally in the visitor's browser only (FE-06 §5.3).
     Unpublished language editions lead to their truthful notice page. */
  var select = document.querySelector("[data-language-select]");
  if (select) {
    try {
      var saved = window.localStorage.getItem("drmohamed.locale");
      if (saved && saved !== select.getAttribute("data-current-locale")) {
        select.value = saved;
      }
    } catch (e) { /* storage unavailable; preference simply does not persist */ }
    select.addEventListener("change", function () {
      var locale = select.value;
      try { window.localStorage.setItem("drmohamed.locale", locale); } catch (e) {}
      /* Keep the visitor on the equivalent page in the chosen edition. */
      var path = window.location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "/" + locale);
      if (!/^\/[a-z]{2}(\/|$)/.test(path)) path = "/" + locale + "/";
      window.location.href = path + window.location.search + window.location.hash;
    });
  }

  /* ---------- Contact form (FE-09 §8) ----------
     Client validation improves usability; the server remains authoritative.
     A public success state is shown only after the service accepts the
     submission; failure states are truthful. */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var status = form.querySelector("[data-form-status]");
    var successText = (form.querySelector("[data-success-message]") || {}).textContent || "";
    var msg = {
      review: form.getAttribute("data-msg-review") || "Please review the highlighted fields.",
      sending: form.getAttribute("data-msg-sending") || "Sending…",
      unavailable: form.getAttribute("data-msg-unavailable") || "The submission service is not yet configured. Your message has not been sent; please try again later.",
      failed: form.getAttribute("data-msg-failed") || "Your message could not be sent. Please review and try again.",
      down: form.getAttribute("data-msg-down") || "The submission service is currently unavailable. Your message has not been sent; please try again later."
    };

    function showStatus(message, ok) {
      status.hidden = false;
      status.textContent = message;
      status.className = "form-status " + (ok ? "form-status--ok" : "form-status--error");
    }
    function validateField(field) {
      var valid = field.checkValidity();
      field.setAttribute("aria-invalid", String(!valid));
      return valid;
    }
    form.querySelectorAll("input, textarea").forEach(function (field) {
      field.addEventListener("blur", function () { validateField(field); });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") validateField(field);
      });
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var fields = Array.prototype.slice.call(form.querySelectorAll("input, textarea"));
      var allValid = fields.map(validateField).every(Boolean);
      if (!allValid) {
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        showStatus(msg.review, false);
        return;
      }
      var submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      showStatus(msg.sending, true);
      var payload = {
        purpose: "enquiry",
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        organisation: form.elements.organisation.value.trim(),
        subject: form.elements.subject.value.trim(),
        message: form.elements.message.value,
        locale: form.getAttribute("data-locale") || "en",
        consent: form.elements.consent.checked === true
      };
      fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
        .then(function (result) {
          if (result.ok && result.body.status === "received") {
            form.reset();
            showStatus(successText + (result.body.reference ? " Reference: " + result.body.reference : ""), true);
          } else if (result.body && result.body.status === "unavailable") {
            showStatus(result.body.message || msg.unavailable, false);
          } else {
            showStatus((result.body && result.body.message) || msg.failed, false);
          }
        })
        .catch(function () {
          showStatus(msg.down, false);
        })
        .finally(function () { submit.disabled = false; });
    });
  }

  /* ---------- Yaqoot availability (FE-04 §12, FE-09 §7) ----------
     The panel asks the service whether a grounded provider is configured.
     If not, the truthful unavailable state remains. No simulated answers. */
  var panel = document.querySelector("[data-yaqoot-panel]");
  if (panel) {
    fetch("/api/yaqoot/status", { headers: { "Accept": "application/json" } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (body) {
        if (!body || body.status !== "available") return; /* keep truthful unavailable state */
        var form2 = panel.querySelector("[data-yaqoot-form]");
        var input = form2.querySelector("input");
        var button = form2.querySelector("button");
        input.disabled = false;
        button.disabled = false;
        input.placeholder = panel.getAttribute("data-placeholder-enabled") || "Ask about the ideas on this platform";
        var unavailable = panel.querySelector("[data-yaqoot-unavailable]");
        if (unavailable) unavailable.remove();
      })
      .catch(function () { /* service absent: keep truthful unavailable state */ });
  }
})();
