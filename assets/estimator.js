/* Leak estimator.
   Pure arithmetic on operator-entered figures. Nothing is sent anywhere.

   Model:
     threshold days  lose ~90% of full rate (they reimburse at roughly a tenth)
     unbilled days   lose 100% of full rate
     dead denials    = billed days x rate x denial rate x never-reworked rate

   Clawback exposure (billing above documentation) is deliberately excluded:
   it follows audit risk, not volume, so putting a number on it here would be
   guessing. The page says so. */
(function () {
  var IDS = ['cd', 'rate', 'thr', 'unb', 'den', 'norw'];
  var out = ['o1', 'o2', 'o3', 'o4'];

  // Bail quietly on pages without the estimator.
  for (var i = 0; i < IDS.length; i++) {
    if (!document.getElementById(IDS[i])) return;
  }
  for (var j = 0; j < out.length; j++) {
    if (!document.getElementById(out[j])) return;
  }

  function money(n) {
    if (!isFinite(n) || n < 0) n = 0;
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function val(id) {
    var n = parseFloat(document.getElementById(id).value);
    return isFinite(n) && n > 0 ? n : 0;
  }

  function pct(id) {
    var n = val(id);
    return Math.min(n, 100) / 100;
  }

  function calc() {
    var days = val('cd');
    var rate = val('rate');

    var threshold = days * pct('thr') * rate * 0.9;
    var unbilled  = days * pct('unb') * rate;
    var billed    = days * (1 - pct('unb'));
    var deadDenials = billed * rate * pct('den') * pct('norw');

    document.getElementById('o1').textContent = money(threshold);
    document.getElementById('o2').textContent = money(unbilled);
    document.getElementById('o3').textContent = money(deadDenials);
    document.getElementById('o4').textContent = money((threshold + unbilled + deadDenials) * 12);
  }

  IDS.forEach(function (id) {
    document.getElementById(id).addEventListener('input', calc);
  });

  calc();
})();
