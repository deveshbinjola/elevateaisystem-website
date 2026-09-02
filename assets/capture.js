/* Operations lead capture.
   Posts to /api/ops-subscribe, then reveals the checklist.

   Design rule: the checklist is NEVER withheld. If the subscribe call fails,
   is unconfigured, or the network dies, the visitor still gets the thing they
   were promised and the wording just stops claiming an email was sent. A
   capture that holds a deliverable hostage to our own config is a broken
   promise, not a funnel.

   Markup contract:
     <div class="capture" data-source="five-leaks">
       <form class="capture-form"><input type="email" required><button>...</button></form>
       <p class="capture-msg"></p>
     </div> */
(function () {
  var CHECKLIST = '/leak-checklist';

  /* Built with DOM nodes rather than innerHTML. Nothing user-supplied is
     interpolated today, and this keeps it that way if anyone later wants to
     echo the address back into the confirmation. */
  function reveal(box, msg, emailed) {
    var el = box.querySelector('.capture-msg');
    box.classList.add('done');
    el.classList.add('show');
    el.classList.remove('err');

    while (el.firstChild) el.removeChild(el.firstChild);

    el.appendChild(document.createTextNode(msg + ' '));

    var a = document.createElement('a');
    a.href = CHECKLIST;
    a.textContent = 'Open the checklist';
    el.appendChild(a);

    if (!emailed) {
      el.appendChild(document.createTextNode(' (it is on this site, no email needed).'));
    }
  }

  function wire(box) {
    var form = box.querySelector('.capture-form');
    if (!form) return;
    var input = form.querySelector('input[type="email"]');
    var btn = form.querySelector('button');
    var msg = box.querySelector('.capture-msg');
    var source = box.getAttribute('data-source') || 'home';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.textContent = 'That email does not look right.';
        msg.classList.add('show', 'err');
        return;
      }

      btn.disabled = true;
      var original = btn.textContent;
      btn.textContent = 'Sending...';

      fetch('/api/ops-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, source: source })
      })
        .then(function (r) { return r.json(); })
        .catch(function () { return { ok: true, subscribed: false }; })
        .then(function (data) {
          btn.disabled = false;
          btn.textContent = original;
          if (data && data.subscribed) {
            reveal(box, 'Sent. Check your inbox.', true);
          } else {
            // Captured nothing, but the visitor still gets the checklist.
            reveal(box, 'Here it is.', false);
          }
        });
    });
  }

  var boxes = document.querySelectorAll('.capture');
  for (var i = 0; i < boxes.length; i++) wire(boxes[i]);
})();
