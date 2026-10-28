/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923435347417 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */
// page-side form filler, loaded into every page as a playwright init script (window.__jaFill)
// fills only EMPTY standard fields, returns what is left for the agent
window.__jaFill = (V = {}) => {
  const norm = s => String(s || '').toLowerCase().replace(/[\s_\-[\]().:*?/]+/g, ' ').trim();
  const text = n => (n ? n.textContent : '').replace(/\s+/g, ' ').trim();
  const shown = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && getComputedStyle(el).visibility !== 'hidden';
  const labelOf = el => {
    const by = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean).map(i => text(document.getElementById(i))).join(' ');
    const lab = el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    const wrap = el.closest('label');
    const box = el.closest('.field, .form-group, .application-question, [data-automation-id*="formField"], fieldset, div');
    const near = box && box.querySelector('label, legend, .label, [class*="label"], [class*="question"]');
    return (el.getAttribute('aria-label') || by || text(lab) || text(wrap) || text(near) || el.placeholder || '').slice(0, 200);
  };
  const attrs = el => norm([el.name, el.id, el.getAttribute('autocomplete'), el.getAttribute('data-automation-id')].join(' '));
  const key = el => `${norm(labelOf(el))} ${attrs(el)}`;
  const set = (el, v) => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    ['input', 'change', 'blur'].forEach(t => el.dispatchEvent(new Event(t, { bubbles: true })));
  };
  // first match wins, order matters
  const RULES = [
    ['first_name', k => /first ?name|given ?name|firstname/.test(k)],
    ['last_name', k => /last ?name|family ?name|surname|lastname/.test(k)],
    ['email', k => /e ?mail/.test(k)],
    ['phone', k => /phone|mobile|telephone|\btel\b/.test(k) && !/country|code|type|extension/.test(k)],
    ['linkedin', k => /linkedin/.test(k)],
    ['github', k => /github/.test(k)],
    ['portfolio', k => /portfolio|website|personal site|\bblog\b/.test(k)],
    ['current_company', k => /current (company|employer)|\borg\b|organi[sz]ation/.test(k)],
    ['current_title', k => /current (job )?title|current (role|position)/.test(k)],
    ['location', (k, el) => /^(current )?location( city)?$|where are you (currently )?(based|located)/.test(norm(labelOf(el))) || /(^| )location$|systemfield location|candidate location/.test(attrs(el))],
    ['city', k => /\bcity\b/.test(k)],
    ['full_name', (k, el) => /^(full |your |legal |full legal )?name$/.test(norm(labelOf(el))) || /^(name|full name|fullname|systemfield name|candidate name)$/.test(norm(el.name || el.id))],
  ];

  const fields = [...document.querySelectorAll('input, textarea, select')]
    .filter(el => shown(el) && !el.disabled && !el.readOnly && !['hidden', 'submit', 'button', 'reset', 'image', 'search', 'file', 'password'].includes(el.type));
  const filled = [];
  for (const el of fields) {
    if (['radio', 'checkbox'].includes(el.type) || el.tagName === 'TEXTAREA' || el.value) continue;
    if (el.tagName === 'SELECT') {
      if (!/country/.test(key(el)) || /code|phone/.test(key(el))) continue;
      const o = [...el.options].find(o => [V.country, V.country_code].filter(Boolean).some(c => norm(o.text) === norm(c) || o.value.toUpperCase() === String(c).toUpperCase()));
      if (o && o.value) { set(el, o.value); filled.push({ field: 'country', label: labelOf(el) }); }
      continue;
    }
    const k = key(el), hit = RULES.find(([f, t]) => V[f] && t(k, el));
    if (hit) { set(el, String(V[hit[0]])); filled.push({ field: hit[0], label: labelOf(el) }); }
  }

  const req = el => el.required || el.getAttribute('aria-required') === 'true' || /\*/.test(labelOf(el));
  const sel = el => el.id ? `#${CSS.escape(el.id)}` : el.name ? `${el.tagName.toLowerCase()}[name="${el.name}"]` : '';
  const remaining = [], groups = new Set();
  for (const el of fields) {
    if (el.type === 'radio') {
      if (groups.has(el.name)) continue;
      groups.add(el.name);
      const group = fields.filter(r => r.type === 'radio' && r.name === el.name);
      if (group.some(r => r.checked)) continue;
      const box = el.closest('fieldset, [role=radiogroup], .field, .form-group, .application-question');
      const q = box && box.querySelector('legend, label:not(:has(input)), .label, [class*="question"]');
      remaining.push({ type: 'radio', label: text(q) || el.name, required: group.some(req) || /\*/.test(text(q)), options: group.map(labelOf), sel: `input[name="${el.name}"]` });
      continue;
    }
    if (el.type === 'checkbox') { if (!el.checked) remaining.push({ type: 'checkbox', label: labelOf(el), required: req(el), sel: sel(el) }); continue; }
    if (el.value) continue;
    const t = el.tagName === 'SELECT' ? 'select' : el.tagName === 'TEXTAREA' ? 'textarea' : el.type || 'text';
    remaining.push({ type: t, label: labelOf(el), required: req(el), sel: sel(el), ...(t === 'select' ? { options: [...el.options].map(o => o.text.trim()).filter(Boolean).slice(0, 25) } : {}) });
  }
  // yes / no button pairs (ashby style)
  const seen = new Set();
  document.querySelectorAll('button').forEach(b => {
    if (!/^(yes|no)$/i.test(text(b)) || !shown(b) || seen.has(b.parentElement)) return;
    const box = b.parentElement;
    seen.add(box);
    const pair = [...box.querySelectorAll('button')].filter(x => /^(yes|no)$/i.test(text(x)));
    if (pair.length !== 2 || pair.some(x => x.getAttribute('aria-pressed') === 'true' || /\b(selected|active|checked)\b/i.test(x.className))) return;
    let w = box.parentElement;
    for (let i = 0; i < 3 && w && !w.querySelector('label, legend, .label'); i++) w = w.parentElement;
    const q = w && w.querySelector('label, legend, .label');
    remaining.push({ type: 'yes-no buttons', label: text(q), required: /\*/.test(text(q)), options: ['Yes', 'No'] });
  });
  const uploads = [...document.querySelectorAll('input[type=file]')].filter(el => !el.disabled)
    .map(el => ({ label: labelOf(el), accept: el.accept, required: req(el), has_file: el.files.length > 0, sel: sel(el) }));
  return { url: location.href, filled, remaining, uploads };
};
