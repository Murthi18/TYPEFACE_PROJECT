// ============================================================================
// utils.js — Shared helper functions for DOM, formatting, requests, UI helpers
// ============================================================================

// ----------------- API base -----------------
/**
 * Base URL for API requests.
 * - Typically set in `index.html` as `window.API_BASE`.
 * - Defaults to '' so relative URLs still work (good for local dev).
 */
const API_BASE = window.API_BASE || '';

// ----------------- DOM helpers -----------------
/**
 * Shortcut for querySelector
 * @param {string} q - CSS selector
 * @param {Element|Document} [root=document] - optional root
 */
export const $ = (q, root=document) => root.querySelector(q);

/**
 * Shortcut for querySelectorAll → Array
 * @param {string} q - CSS selector
 * @param {Element|Document} [root=document]
 * @returns {Element[]} array of matched elements
 */
export const $$ = (q, root=document) => Array.from(root.querySelectorAll(q));

// ----------------- Formatting helpers -----------------
/**
 * Format number into a localized currency string.
 * Defaults to INR with 2 decimal places.
 */
export const fmtCurrency = (n, c="INR") =>
  new Intl.NumberFormat(undefined, {
    style:'currency',
    currency:c,
    maximumFractionDigits:2
  }).format(Number(n||0));

/**
 * Format a date into local date string (user’s locale).
 * Accepts Date, ISO string, or timestamp.
 */
export const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return ''; // invalid date fallback
  }
};

// ----------------- Async helpers -----------------
/** Sleep helper: pause for ms milliseconds */
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Fetch wrapper that:
 *  - Prefixes with API_BASE
 *  - Automatically attaches JWT (if in localStorage as `pf.jwt`)
 *  - Returns JSON if content-type is JSON
 *  - Throws on HTTP errors (with toast + Error)
 */
export const fetchJSON = async (url, opts={}) => {
  const token = localStorage.getItem('pf.jwt');

  try {
    const res = await fetch(API_BASE+url, {
      headers: {
        'Content-Type':'application/json',
        ...(token ? { Authorization:'Bearer '+token } : {})
      },
      ...opts
    });

    if (!res.ok) {
      const msg = await res.text().catch(()=>res.statusText);
      toast(msg || 'Request failed', 'error');
      throw new Error(`${res.status} ${msg}`);
    }

    // Return JSON or plain text depending on content-type
    const isJSON = res.headers.get('content-type')?.includes('json');
    return isJSON ? res.json() : res.text();
  } catch (err) {
    console.error('fetchJSON error:', err);
    toast('Network error — please try again.', 'error');
    throw err;
  }
};

// ----------------- UI helpers -----------------
/**
 * Show a small toast message (auto disappears in 3s).
 * @param {string} msg - Message to display
 * @param {'success'|'error'} [type='success']
 */
export function toast(msg, type='success'){
  let wrap = $('.toast-wrap');
  if(!wrap){
    wrap = document.createElement('div');
    wrap.className='toast-wrap';
    document.body.append(wrap);
  }

  const el = document.createElement('div');
  el.className = 'toast '+type;
  el.textContent = msg;
  wrap.append(el);

  // Fade out + remove after 3s
  setTimeout(()=>{
    el.style.opacity = 0;
    setTimeout(()=>el.remove(), 300);
  }, 3000);
}

/**
 * Simple modal creator.
 * @param {string} html - inner HTML for modal content
 * @returns {object} { close(), el, back }
 */
export function modal(html){
  const back = document.createElement('div');
  back.className='modal-backdrop';

  const m = document.createElement('div');
  m.className='modal';
  m.innerHTML = html;

  back.append(m);
  document.body.append(back);

  // Allow click outside to close
  back.addEventListener('click', e => {
    if(e.target === back) back.remove();
  });

  return { close: ()=>back.remove(), el:m, back };
}

// ----------------- Misc helpers -----------------
/**
 * Debounce wrapper: runs fn after ms delay,
 * resets timer if called again before delay ends.
 */
export const debounce = (fn, ms=400) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(()=>fn(...a), ms);
  };
};

/**
 * Animate `.reveal` elements into view when they
 * become visible on screen.
 */
export function observeReveal(){
  const io = new IntersectionObserver(ents => {
    ents.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('show');
        io.unobserve(e.target);
      }
    });
  }, { threshold:.15 });

  $$('.reveal').forEach(el => io.observe(el));
}
