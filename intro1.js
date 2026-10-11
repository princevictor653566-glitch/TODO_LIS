


(function () {
  'use strict';

  const BREAKPOINT = 768; // px: at or below this width the burger menu is used

  const header    = document.querySelector('.header');
  const hamburger = document.getElementById('hamburger');
  if (!header || !hamburger) return;

  const navLinks      = header.querySelectorAll('nav a');
  const actionButtons = header.querySelectorAll('.actions button');

  /* ---------- 1. Styles for the burger + dropdown (injected by JS) ---------- */
  const style = document.createElement('style');
  style.textContent = `
    .header .hamburger { display: none !important; cursor: pointer; }
    .header.is-mobile .hamburger {
      display: flex !important; align-items: center; justify-content: center;
      width: 44px; height: 44px; position: relative; z-index: 1001;
    }
    .header.is-mobile nav,
    .header.is-mobile .actions { display: none !important; }

    .hamburger img { width: 28px; height: 28px; display: block; }
    .hamburger.bars { flex-direction: column; gap: 5px; }
    .hamburger.bars span {
      display: block; width: 24px; height: 3px; border-radius: 2px;
      background: #111827; transition: transform .25s, opacity .25s;
    }
    .hamburger.bars.active span:nth-child(1) { transform: translateY(8px) rotate(45deg); }
    .hamburger.bars.active span:nth-child(2) { opacity: 0; }
    .hamburger.bars.active span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

    .mobile-menu {
      display: none; position: absolute; top: 100%; left: 0; right: 0;
      flex-direction: column; background: #fff;
      border-bottom: 1px solid #e5e7eb; box-shadow: 0 10px 20px rgba(0,0,0,.08);
      max-height: 0; overflow: hidden; visibility: hidden;
      transition: max-height .3s ease, visibility .3s; z-index: 1000;
    }
    .header.is-mobile .mobile-menu { display: flex; }
    .mobile-menu.open { visibility: visible; }
    .mobile-menu > a {
      padding: 16px 24px; color: #374151; text-decoration: none;
      font-size: 18px; border-top: 1px solid #f3f4f6;
    }
    .mobile-menu > a:hover { background: #f9fafb; }
    .mobile-menu > a.active { color: #3b82f6; font-weight: 700; }
    .mobile-menu .mobile-actions {
      display: flex; gap: 12px; padding: 16px 24px; border-top: 1px solid #f3f4f6;
    }
    .mobile-menu .mobile-actions .btn { flex: 1; }
  `;
  document.head.appendChild(style);

  // The dropdown is positioned relative to the header
  if (getComputedStyle(header).position === 'static') header.style.position = 'relative';

  /* ---------- 2. Icon: use your menu-icon.png, fall back to 3 bars ---------- */
  function useBars() {
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    hamburger.classList.add('bars');
  }
  const img = hamburger.querySelector('img');
  if (!img) {
    useBars();
  } else {
    img.addEventListener('error', useBars);
    if (img.complete && img.naturalWidth === 0) useBars();
  }

  /* ---------- 3. Build the dropdown from your existing nav links + buttons ---------- */
  const menu = document.createElement('div');
  menu.className = 'mobile-menu';
  menu.id = 'mobile-menu';

  const currentFile = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  let matched = false;

  navLinks.forEach((a) => {
    const link = a.cloneNode(true);
    link.classList.remove('active');
    link.removeAttribute('aria-current');
    const target = (a.getAttribute('href') || '').split('#')[0].split('?')[0].toLowerCase();
    if (target && target === currentFile) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
      matched = true;
    }
    menu.appendChild(link);
  });

  // If the URL didn't match any link, keep whichever link was marked active in the HTML
  if (!matched) {
    navLinks.forEach((a, i) => {
      if (a.classList.contains('active')) menu.children[i].classList.add('active');
    });
  }

  if (actionButtons.length) {
    const box = document.createElement('div');
    box.className = 'mobile-actions';
    actionButtons.forEach((orig) => {
      const copy = orig.cloneNode(true);
      copy.addEventListener('click', () => orig.click()); // same behaviour as the original
      box.appendChild(copy);
    });
    menu.appendChild(box);
  }

  header.appendChild(menu);

  hamburger.setAttribute('role', 'button');
  hamburger.setAttribute('tabindex', '0');
  hamburger.setAttribute('aria-label', 'Toggle menu');
  hamburger.setAttribute('aria-controls', 'mobile-menu');
  hamburger.setAttribute('aria-expanded', 'false');

  function setMenu(open) {
    menu.classList.toggle('open', open);
    menu.style.maxHeight = open ? menu.scrollHeight + 'px' : '0px';
    hamburger.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', String(open));
  }

  hamburger.addEventListener('click', () => {
    setMenu(!menu.classList.contains('open'));
  });

  hamburger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      hamburger.click();
    }
  });


  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !hamburger.contains(e.target)) setMenu(false);
  });

  const mq = window.matchMedia('(max-width: ' + BREAKPOINT + 'px)');

  function applyLayout() {
    header.classList.toggle('is-mobile', mq.matches);
    if (!mq.matches) setMenu(false);
  }

  applyLayout();
  mq.addEventListener('change', applyLayout);
})();