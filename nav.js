(function () {
  var NAV_KEY = 'palladium-nav-expanded';
  var nav = document.getElementById('nav');
  var DISCORD_HREF = 'discord.html';
  var btn = document.getElementById('nav-toggle');
  var SETTINGS_HREF = 'settings.html';

  function getExpanded() {
    if (typeof sessionStorage === 'undefined') return false;
    var stored = sessionStorage.getItem(NAV_KEY);
    if (stored === null) return false;
    return stored === '1';
  }

  function setExpanded(expanded) {
    if (!nav) return;
    nav.classList.toggle('nav--collapsed', !expanded);
    nav.classList.toggle('nav--expanded', expanded);
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(NAV_KEY, expanded ? '1' : '0');
  }

  function toggle() {
    setExpanded(!getExpanded());
  }

  function discordLinkMarkup() {
    return (
      '<svg class="nav__link-icon nav__link-icon--discord" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
      '<path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-.407c-.056.1-.122.233-.167.337a12.19 12.19 0 0 0-3.677 0 3.596 3.596 0 0 0-.168-.337 13.14 13.14 0 0 0-3.257.407C.943 6.375-.32 9.793.099 13.166a13.344 13.344 0 0 0 4.005 2.03c.322-.445.61-.92.85-1.42a8.266 8.266 0 0 1-1.253-.6c.105-.078.207-.157.305-.24 2.418 1.134 5.043 1.134 7.431 0 .099.083.201.162.306.24a8.14 8.14 0 0 1-1.255.6c.24.5.529.975.85 1.42a13.342 13.342 0 0 0 4.006-2.03c.5-3.95-.838-7.329-2.799-10.259zM5.19 11.733c-.728 0-1.323-.67-1.323-1.492 0-.822.58-1.49 1.323-1.49.744 0 1.337.668 1.324 1.49 0 .822-.58 1.492-1.324 1.492zm5.62 0c-.728 0-1.323-.67-1.323-1.492 0-.822.58-1.49 1.323-1.49.744 0 1.337.668 1.324 1.49 0 .822-.58 1.492-1.324 1.492z"></path>' +
      '</svg>' +
      '<span class="nav__link-text">Discord</span>'
    );
  }

  function settingsLinkMarkup() {
    return (
      '<svg class="nav__link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="3"></circle>' +
      '<path d="M19.4 15a1.6 1.6 0 0 0 .33 1.76l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.76-.33 1.6 1.6 0 0 0-.94 1.46V21a2 2 0 0 1-4 0v-.09a1.6 1.6 0 0 0-.94-1.46 1.6 1.6 0 0 0-1.76.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-1.46-.94H3a2 2 0 0 1 0-4h.09a1.6 1.6 0 0 0 1.46-.94 1.6 1.6 0 0 0-.33-1.76l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.76.33h.02a1.6 1.6 0 0 0 .92-1.45V3a2 2 0 0 1 4 0v.09a1.6 1.6 0 0 0 .94 1.46h.02a1.6 1.6 0 0 0 1.76-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.33 1.76v.02a1.6 1.6 0 0 0 1.45.92H21a2 2 0 0 1 0 4h-.09a1.6 1.6 0 0 0-1.46.94z"></path>' +
      '</svg>' +
      '<span class="nav__link-text">Settings</span>'
    );
  }

  function ensureNavLink(href, markup, insertBeforeHref) {
    if (!nav) return;
    var links = nav.querySelector('.nav__links');
    if (!links) return;

    if (links.querySelector('a[href="' + href + '"]')) return;

    var link = document.createElement('a');
    link.href = href;
    link.className = 'nav__link';
    link.innerHTML = markup;

    if (insertBeforeHref) {
      var before = links.querySelector('a[href="' + insertBeforeHref + '"]');
      if (before) {
        links.insertBefore(link, before);
        return;
      }
    }

    links.appendChild(link);
  }

  function syncActiveLink() {
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll('.nav__link[href]'));
    if (!links.length) return;

    var current = String(window.location.pathname || '').split('/').pop().toLowerCase();
    if (!current) current = 'index.html';

    var match = null;
    for (var i = 0; i < links.length; i += 1) {
      var href = String(links[i].getAttribute('href') || '').split('?')[0].split('#')[0].toLowerCase();
      if (href === current) {
        match = links[i];
        break;
      }
    }

    if (!match) return;

    for (var j = 0; j < links.length; j += 1) {
      links[j].classList.remove('nav__link--active');
    }
    match.classList.add('nav__link--active');
  }

  if (nav && btn) {
    ensureNavLink(SETTINGS_HREF, settingsLinkMarkup());
    ensureNavLink(DISCORD_HREF, discordLinkMarkup(), SETTINGS_HREF);
    syncActiveLink();
    setExpanded(getExpanded());
    document.documentElement.classList.remove('nav-initial-collapsed', 'nav-initial-expanded');
    btn.addEventListener('click', toggle);
  }
})();
