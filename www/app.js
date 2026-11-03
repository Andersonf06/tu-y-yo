/* TU Y YO — presupuesto en pareja */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pesos = n => (n < 0 ? '-$' : '$') + Math.round(Math.abs(n || 0)).toLocaleString('es-CO');
  const corto = n => { const a = Math.abs(n); const s = n < 0 ? '-' : ''; if (a >= 1e6) return s + '$' + (a / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M'; if (a >= 1e3) return s + '$' + Math.round(a / 1e3) + ' mil'; return pesos(n); };
  const digitos = s => Number(String(s ?? '').replace(/[^\d]/g, '')) || 0;
  const pad = n => String(n).padStart(2, '0');
  const hoy = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const mesDe = f => String(f || '').slice(0, 7);
  const sumarMes = (k, n) => { const [y, m] = k.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
  const nombreMes = (k, opt = { month: 'long', year: 'numeric' }) => { const [y, m] = k.split('-').map(Number); const t = new Date(y, m - 1, 1).toLocaleDateString('es-CO', opt); return t.charAt(0).toUpperCase() + t.slice(1); };
  const nombreDia = f => { const [y, m, d] = f.split('-').map(Number); const t = new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' }); return t.charAt(0).toUpperCase() + t.slice(1); };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const sum = (arr, f = x => x.monto) => arr.reduce((a, x) => a + (Number(f(x)) || 0), 0);
  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* nada */ } }
  };
  const PREVIEW = !!window.TUYYO_PREVIEW;
  const CONFIG_APP = (window.TUYYO_FIREBASE && window.TUYYO_FIREBASE.apiKey && window.TUYYO_FIREBASE.projectId) ? window.TUYYO_FIREBASE : null;
  const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const codigoCorto = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => ALFABETO[b % ALFABETO.length]).join('');
  const nuevoToken = () => Array.from(crypto.getRandomValues(new Uint8Array(18)), b => b.toString(16).padStart(2, '0')).join('');
  const conGuion = c => c.slice(0, 3) + '-' + c.slice(3);
  const Cap = window.Capacitor;
  const nativo = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  const plugin = n => (Cap && Cap.Plugins && Cap.Plugins[n]) || null;
  const vibrar = () => { try { plugin('Haptics')?.impact({ style: 'LIGHT' }); } catch { /* opcional */ } };
  const vibrarP = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch { /* opcional */ } vibrar(); };
  const reduceMov = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Textos legales (constantes del paquete: se pueden poner con innerHTML) e ilustraciones.
  const L = window.LEGAL || { version: '0', politica: '', terminos: '', autorizacion: '', avisoVincular: '', eliminacion: '', noAsesoria: 'Cálculo orientativo con los datos que ustedes registraron. No es asesoría financiera.', contacto: '' };
  const RECS = window.RECURSOS || { ilus: {}, insignias: {} };
  const notaLegal = () => `<small class="aviso-legal">${esc(L.noAsesoria)}</small>`;
  const AVISO_ESTIMADO = 'Estimado. El saldo oficial es el del extracto de tu banco.';

  const CATS_BASE = [
    { id: 'mercado', n: 'Mercado', c: '#3552E8', g: 'nec' },
    { id: 'hogar', n: 'Hogar y servicios', c: '#5B7BE0', g: 'nec' },
    { id: 'transporte', n: 'Transporte', c: '#2F9FB3', g: 'nec' },
    { id: 'comida', n: 'Comida fuera', c: '#DD8436', g: 'gus' },
    { id: 'diversion', n: 'Diversión', c: '#E2603F', g: 'gus' },
    { id: 'salud', n: 'Salud', c: '#2B9468', g: 'nec' },
    { id: 'ropa', n: 'Ropa y cuidado', c: '#B07A86', g: 'gus' },
    { id: 'mascotas', n: 'Mascotas', c: '#9C7A3C', g: 'nec' },
    { id: 'educacion', n: 'Educación', c: '#6A6FD8', g: 'nec' },
    { id: 'regalos', n: 'Regalos', c: '#D9577A', g: 'gus' },
    { id: 'deudas', n: 'Deudas', c: '#7A5C99', g: 'deu' },
    { id: 'otros', n: 'Otros', c: '#8C8399', g: 'gus' }
  ];
  const PALETA = ['#3552E8', '#13B176', '#E39A00', '#E2603F', '#2F9FB3', '#6A6FD8', '#D9577A', '#9C7A3C', '#0FA3A3', '#C2410C', '#7C3AED', '#65A30D', '#5B7BE0', '#B07A86', '#2B9468', '#8C8399'];
  const GRUPOS = { nec: 'Necesidad', gus: 'Gusto', aho: 'Ahorro e inversión' };
  let CATS = CATS_BASE.map(x => ({ ...x }));
  let CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
  // Las categorías viven en la configuración compartida: los dos ven y editan las mismas.
  function refrescarCats() {
    const lista = S.cfg && Array.isArray(S.cfg.categorias) ? S.cfg.categorias : null;
    let out;
    if (lista && lista.length) {
      out = lista.filter(x => x && ID_RE.test(x.id) && typeof x.n === 'string' && x.n).map(x => {
        const b = CATS_BASE.find(y => y.id === x.id);
        return { ...(b || {}), ...x, c: COLOR_RE.test(x.c) ? x.c : (b?.c || '#8C8399'), g: (b && b.id === 'deudas') ? 'deu' : (GRUPOS[x.g] ? x.g : (b?.g || 'gus')), custom: !b };
      });
      for (const b of CATS_BASE) if (!out.find(x => x.id === b.id)) out.push({ ...b });
    } else out = CATS_BASE.map(x => ({ ...x }));
    const d = out.find(x => x.id === 'deudas'); if (d) d.oculta = false;
    CATS = out; CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
  }
  const catsVisibles = actual => CATS.filter(k => !k.oculta || k.id === actual);
  const ic = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const CAT_ICO = {
    mercado: ic('<circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.4 11h10.2l2-8H6.2"/>'),
    hogar: ic('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>'),
    transporte: ic('<rect x="4" y="3.5" width="16" height="14" rx="3"/><path d="M4 11h16M8 21v-3.5M16 21v-3.5"/><path d="M8 14.5h.01M16 14.5h.01"/>'),
    comida: ic('<path d="M7 3v18M4.5 3v5a2.5 2.5 0 0 0 5 0V3"/><path d="M17 21V3c-2 1-3.2 4-3.2 7s1.2 4 3.2 4"/>'),
    diversion: ic('<path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M14 6.5v2M14 11v2M14 15.5v2"/>'),
    salud: ic('<path d="M12 20s-7-4.4-8.6-8.6C2.2 8.2 4.2 5 7.3 5c1.9 0 3.3 1 4.7 2.8C13.4 6 14.8 5 16.7 5c3.1 0 5.1 3.2 3.9 6.4C19 15.6 12 20 12 20z"/><path d="M6.5 12h3l1.5-2.5 2 4.5 1.5-2h3"/>'),
    ropa: ic('<path d="M8 3L3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0z"/>'),
    mascotas: ic('<circle cx="5.5" cy="10" r="1.8"/><circle cx="9.5" cy="5.5" r="1.8"/><circle cx="14.5" cy="5.5" r="1.8"/><circle cx="18.5" cy="10" r="1.8"/><path d="M12 11c-3 0-5.5 4-5.5 6.2 0 1.6 1.3 2.3 2.8 2.3 1.2 0 1.8-.6 2.7-.6s1.5.6 2.7.6c1.5 0 2.8-.7 2.8-2.3C17.5 15 15 11 12 11z"/>'),
    educacion: ic('<path d="M4 19V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13"/>'),
    regalos: ic('<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8C10.5 5 7 4.5 7 6.8 7 8 9 8 12 8zm0 0c1.5-3 5-3.5 5-1.2C17 8 15 8 12 8z"/>'),
    deudas: ic('<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19M6.5 15h4"/>'),
    otros: ic('<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>'),
    ajuste: ic('<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>')
  };
  const icoCat = (k, extra = '') => `<span class="ico cat ${extra}" style="--c:${esc(k.c)}" aria-hidden="true">${CAT_ICO[k.id] || `<b>${esc((k.n || '?')[0])}</b>`}</span>`;
  const NECESIDADES = ['mercado', 'hogar', 'transporte', 'salud', 'educacion', 'mascotas'];
  const COLS = ['gastos', 'deudas', 'metas', 'aportes', 'ingresos', 'fijos', 'cuentas', 'citas'];

  /* ---------- Saneamiento de lo que llega de la nube (o del almacenamiento) ----------
     Nada que no sea texto libre se pinta sin validar: colores, ids, números y enumeraciones. */
  const COLOR_RE = /^#[0-9a-fA-F]{6}$/, ID_RE = /^[A-Za-z0-9_-]{1,60}$/, FECHA_RE = /^\d{4}-\d{2}-\d{2}$/, MES_RE = /^\d{4}-\d{2}$/;
  const numOk = (v, min = 0, max = 1e10) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 0; };
  const txtOk = (v, n = 60) => typeof v === 'string' ? v.slice(0, n) : '';
  const enumOk = (v, ops, def) => ops.includes(v) ? v : def;
  function limpiarCfg(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    const c = Object.assign(cfgBase(), r);
    c.nombres = { a: txtOk(r.nombres?.a, 20), b: txtOk(r.nombres?.b, 20) };
    c.ingresos = { a: numOk(r.ingresos?.a), b: numOk(r.ingresos?.b) };
    c.mesada = { a: numOk(r.mesada?.a), b: numOk(r.mesada?.b) };
    c.reparto = enumOk(r.reparto, ['proporcional', 'mitad', 'custom'], 'proporcional');
    c.pctA = r.pctA == null ? 50 : numOk(r.pctA, 0, 100);
    c.metaAhorroPct = r.metaAhorroPct == null ? 20 : numOk(r.metaAhorroPct, 0, 90);
    c.presupuestos = Object.fromEntries(Object.entries(r.presupuestos && typeof r.presupuestos === 'object' ? r.presupuestos : {}).filter(([k, v]) => ID_RE.test(k) && Number.isFinite(Number(v)) && Number(v) > 0).map(([k, v]) => [k, numOk(v)]));
    if (Array.isArray(r.categorias)) c.categorias = r.categorias.filter(x => x && ID_RE.test(x.id) && typeof x.n === 'string').slice(0, 60).map(x => {
      const o = { id: x.id, n: x.n.slice(0, 24), g: GRUPOS[x.g] || x.g === 'deu' ? x.g : 'gus', oculta: !!x.oculta };
      if (COLOR_RE.test(x.c)) o.c = x.c; return o;
    }); else delete c.categorias;
    if (r.recordatorios != null) c.recordatorios = r.recordatorios !== false;
    const lg = r.logros && typeof r.logros === 'object' ? r.logros : {};
    c.logros = Object.fromEntries(Object.entries(lg).filter(([k, v]) => /^[A-Za-z0-9_-]{1,90}$/.test(k) && v && typeof v === 'object').map(([k, v]) => [k, { en: numOk(v.en, 0, 1e13), por: enumOk(v.por, ['a', 'b', 'ambos'], 'ambos') }]));
    const cs = r.consentimientos && typeof r.consentimientos === 'object' ? r.consentimientos : {};
    c.consentimientos = Object.fromEntries(['a', 'b'].filter(p => cs[p] && typeof cs[p] === 'object').map(p => [p, { version: txtOk(cs[p].version, 20), fecha: txtOk(cs[p].fecha, 40), persona: p, mayorEdad: !!cs[p].mayorEdad, terceros: !!cs[p].terceros }]));
    const rt = r.reto;
    c.reto = rt && typeof rt === 'object' && ID_RE.test(rt.id) && MES_RE.test(rt.mes) && FECHA_RE.test(rt.inicio) ? { id: rt.id, mes: rt.mes, inicio: rt.inicio } : null;
    return c;
  }
  const CAMPOS_NUM = ['monto', 'interes', 'capital', 'cuota', 'saldoInicial', 'saldoActual', 'saldoActualizado', 'cupo', 'tasa', 'dia', 'plazo', 'cuotasPrevias', 'objetivo', 'saldo', 'creado', 'actualizado', 'habladoEn', 'archivadaEn', 'ratioA'];
  function limpiarDoc(id, raw) {
    const d = { ...(raw && typeof raw === 'object' ? raw : {}), id };
    for (const k of CAMPOS_NUM) if (k in d && d[k] != null) { const n = Number(d[k]); d[k] = Number.isFinite(n) ? n : (k === 'monto' ? 0 : null); }
    if ('monto' in d) d.monto = numOk(d.monto);
    if (d.ratioA != null) d.ratioA = numOk(d.ratioA, 0, 1);
    for (const k of ['fecha', 'fechaLimite']) if (d[k] != null && !FECHA_RE.test(d[k])) d[k] = k === 'fecha' ? hoy() : null;
    for (const k of ['pagadoPor', 'por', 'quien', 'editadoPor', 'revisarPor', 'habladoPor']) if (d[k] != null) d[k] = enumOk(d[k], ['a', 'b'], 'a');
    if (d.tipo != null && typeof d.tipo !== 'string') d.tipo = 'compartido';
    for (const k of ['responsable', 'dueno']) if (d[k] != null) d[k] = enumOk(d[k], ['a', 'b', 'ambos'], 'ambos');
    for (const k of ['categoria', 'fijoId', 'deudaId', 'metaId', 'mes']) if (d[k] != null && typeof d[k] !== 'string') d[k] = null;
    for (const k of ['desc', 'nombre', 'nota', 'banco', 'entidad', 'acuerdos', 'origen', 'estado', 'tasaTipo']) if (d[k] != null && typeof d[k] !== 'string') d[k] = '';
    if (d.montosMes != null) d.montosMes = Object.fromEntries(Object.entries(typeof d.montosMes === 'object' ? d.montosMes : {}).filter(([k, v]) => MES_RE.test(k) && Number.isFinite(Number(v))).map(([k, v]) => [k, numOk(v)]));
    if (d.saltos != null) d.saltos = Array.isArray(d.saltos) ? d.saltos.filter(m => MES_RE.test(m)) : [];
    if (d.items != null) d.items = Array.isArray(d.items) ? d.items.slice(0, 40).map(it => ({ descripcion: txtOk(it?.descripcion, 80), valor: numOk(it?.valor) })) : [];
    return d;
  }

  const LOGO = (cls = '') => `<span class="logo-tile ${cls}" aria-hidden="true"><svg viewBox="0 0 100 100"><g transform="translate(0 -4)"><circle class="cab a" cx="28" cy="26" r="11" fill="#5B76FF"/><circle class="cab b" cx="72" cy="26" r="11" fill="#2FD08E"/><path class="brazo a" d="M15 88 L15 62 C15 50 21 44 28 44 C34 44 38 47 40 52" fill="none" stroke="#5B76FF" stroke-width="12" stroke-linecap="round"/><path class="brazo b" d="M85 88 L85 62 C85 50 79 44 72 44 C66 44 62 47 60 52" fill="none" stroke="#2FD08E" stroke-width="12" stroke-linecap="round"/><g class="moneda"><circle cx="50" cy="66" r="17.5" fill="#0F1B3D"/><circle cx="50" cy="66" r="15" fill="#FFB21E"/><g class="signo"><g transform="translate(50 66) scale(1.26)" fill="none" stroke="#B86E00" stroke-width="2.8" stroke-linecap="round"><path d="M0 -8.5 V8.5"/><path d="M4.6 -4.2 C3.6 -6.4 -4.6 -6.6 -4.6 -2.4 C-4.6 1.6 4.6 -0.2 4.6 3.6 C4.6 7.4 -3.6 7.4 -5 4.8"/></g></g></g></g></svg></span>`;
  const ICON = {
    heart: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.3-9.2C1.4 8.4 3.6 5 7 5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8C19.5 16.4 12 21 12 21z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
    cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/></svg>',
    img: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19M6.5 15h4"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    piggy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 10c1 .3 2 1 2 2.5V14h-2l-1.5 2.5V20h-3v-2h-4v2h-3v-3.5C5 15 4 13.3 4 11.5 4 8 7.6 6 11.5 6c2 0 3.9.5 5.2 1.4L19 6v4z"/><circle cx="15.5" cy="10.5" r=".8" fill="currentColor"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
    trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
    snow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="14" r="6"/><circle cx="12" cy="6" r="3"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 14.6c2.6.2 4.4 1.9 5 5.4"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14h4"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
    bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    ojoNo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c5.5 0 9 5.5 9 7 0 .7-.8 2.2-2.2 3.6M6.2 6.3C4 7.8 3 10.6 3 12c0 1.5 3.5 7 9 7 1.7 0 3.2-.5 4.5-1.3"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    cup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 2.5c0 1.5 1 1.5 1 3M12 2.5c0 1.5 1 1.5 1 3"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    trofeo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9.5 18h5"/></svg>',
    escudo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    basura: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
    fuego: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21c4 0 7-2.8 7-6.8 0-3.6-2.6-6-4.2-8.2-.5 2.2-1.6 3.4-2.8 3.8C12 7 10.5 4.6 9 3c0 3.7-4 6-4 11.2C5 18.2 8 21 12 21z"/></svg>',
    carro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3z"/><path d="M5 11h14"/><circle cx="7.5" cy="13.5" r=".6"/><circle cx="16.5" cy="13.5" r=".6"/></svg>',
    casa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>',
    libro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13"/></svg>',
    receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>'
  };

  /* ---------- Estado ---------- */
  const S = {
    cfg: null, members: [], uidAuth: null, modo: 'cargando',
    gastos: [], deudas: [], metas: [], aportes: [], ingresos: [],
    mes: mesDe(hoy()), tab: 'inicio', filtro: 'todos', ultimos: {}, borradosPorMi: new Set()
  };
  const cfgBase = () => ({
    nombres: { a: '', b: '' }, ingresos: { a: 0, b: 0 }, mesada: { a: 0, b: 0 }, reparto: 'proporcional', pctA: 50,
    metaAhorroPct: 20, presupuestos: {}
  });
  const yo = () => {
    if (S.modo !== 'nube') return 'a';
    const i = S.members.indexOf(S.uidAuth);
    return i === 1 ? 'b' : 'a';
  };
  const nom = p => (p === 'ambos' || p === 'compartido') ? 'Los dos' : (S.cfg?.nombres?.[p] || (p === 'a' ? 'Persona 1' : 'Persona 2'));
  const ini = p => (nom(p).trim()[0] || '?').toUpperCase();
  const otro = p => p === 'a' ? 'b' : 'a';
  const ratioA = () => {
    const c = S.cfg; if (!c) return .5;
    if (c.reparto === 'mitad') return .5;
    if (c.reparto === 'custom') return Math.min(1, Math.max(0, (c.pctA || 50) / 100));
    const a = c.ingresos.a || 0, b = c.ingresos.b || 0;
    return a + b > 0 ? a / (a + b) : .5;
  };

  /* ---------- Almacenamiento: local o Firebase ---------- */
  const LOCAL = 'tuyyo:datos', CONEX = 'tuyyo:conexion';
  const Store = {
    fb: null, hogar: null, subs: [],
    leerLocal() { return ls.get(LOCAL) || { cfg: null, cols: {} }; },
    guardarLocal(d) { ls.set(LOCAL, d); },
    async iniciar() {
      const cx = ls.get(CONEX);
      if (cx && cx.config && cx.hid) {
        try { await this.conectar(cx.config, cx.hid); return; }
        catch (e) { console.error(e); toast('No pudimos conectar con la nube. Usando datos de este celular.'); }
      }
      this.iniciarLocal();
    },
    iniciarLocal() {
      S.modo = 'local';
      const d = this.leerLocal();
      S.cfg = d.cfg ? limpiarCfg(d.cfg) : null;
      for (const c of COLS) S[c] = Object.entries(d.cols[c] || {}).map(([id, v]) => limpiarDoc(id, v));
      render();
    },
    async app(config) {
      if (!window.firebase) throw new Error('Firebase no cargó');
      const nombre = 'tuyyo-' + (config.projectId || 'x');
      const app = firebase.apps.find(a => a.name === nombre) || firebase.initializeApp(config, nombre);
      const auth = app.auth(), db = app.firestore();
      try { await db.enablePersistence({ synchronizeTabs: true }); } catch { /* ya activa o no soportada */ }
      const cred = auth.currentUser || (await auth.signInAnonymously()).user;
      S.uidAuth = cred.uid;
      return { app, auth, db };
    },
    async conectar(config, hid) {
      this.fb = await this.app(config);
      this.hogar = this.fb.db.collection('hogares').doc(hid);
      S.modo = 'nube';
      this.subs.forEach(u => u()); this.subs = [];
      let primera = true, primeraVez = true;
      const timer = setTimeout(() => { if (primera) toast('Sin conexión: verás los datos guardados en el celular.'); }, 10000);
      this.subs.push(this.hogar.onSnapshot(s => {
        primera = false; clearTimeout(timer);
        const d = s.data();
        if (!s.exists || !d) { if (!s.metadata.fromCache) { toast('Este hogar ya no existe o no tienes acceso.'); } return; }
        const antes = S.members.length;
        S.members = d.members || []; S.cfg = limpiarCfg(d.cfg);
        if (antes === 1 && S.members.length === 2 && !primeraVez) { confeti(); vibrar(); toast(`¡${nom(yo() === 'a' ? 'b' : 'a')} se unió! Ya comparten todo.`); if (!sheet.hidden && sheetBody.querySelector('#codTxt')) cerrar(); }
        primeraVez = false;
        render();
      }, err => {
        console.error(err);
        if (S.members.length) { this.desconectar(); toast('Este celular ya no está vinculado. Pide a tu pareja un código nuevo.'); }
        else toast('No tienes acceso a este hogar. Pide a tu pareja un código nuevo.');
      }));
      const desde = ls.get('tuyyo:visto') || Date.now();
      let resumido = false;
      for (const c of COLS) {
        let primeraCol = true;
        this.subs.push(this.hogar.collection(c).onSnapshot(q => {
          S[c] = q.docs.map(d => limpiarDoc(d.id, d.data()));
          if (!primeraCol && !q.metadata.hasPendingWrites) avisarPareja(c, q.docChanges());
          if (primeraCol && c === 'gastos' && !q.metadata.fromCache && !resumido) { resumido = true; resumenAusencia(desde); }
          primeraCol = false;
          render();
        }, err => console.error(c, err)));
      }
    },
    async crearHogar(config) {
      const { db } = await this.app(config);
      const hid = db.collection('hogares').doc().id;
      const token = nuevoToken();
      const ref = db.collection('hogares').doc(hid);
      await ref.set({ members: [S.uidAuth], joinToken: token, cfg: S.cfg || cfgBase(), creado: Date.now() });
      // subir lo que había en este celular
      const d = this.leerLocal();
      let batch = db.batch(), n = 0;
      for (const c of COLS) for (const [id, v] of Object.entries(d.cols[c] || {})) {
        batch.set(ref.collection(c).doc(id), v); n++;
        if (n % 400 === 0) { await batch.commit(); batch = db.batch(); }
      }
      await batch.commit();
      ls.set(CONEX, { config, hid });
      await this.conectar(config, hid);
      return config === CONFIG_APP ? await this.crearInvitacion(token) : codigoInvitacion(config, hid, token);
    },
    async crearInvitacion(token) {
      const db = this.fb.db, hid = this.hogar.id;
      if (!token) token = (await this.hogar.get()).data().joinToken;
      for (let intento = 0; intento < 5; intento++) {
        const code = codigoCorto();
        try {
          await db.collection('invitaciones').doc(code).set({ hid, token, creador: S.uidAuth,
            expira: firebase.firestore.Timestamp.fromMillis(Date.now() + 48 * 3600e3) });
          ls.set('tuyyo:invitacion', { code, expira: Date.now() + 48 * 3600e3 });
          return code;
        } catch (e) { if (intento === 4) throw e; }
      }
    },
    async reinvitar() {
      const token = nuevoToken();
      await this.hogar.update({ members: [S.uidAuth], joinToken: token });
      return this.crearInvitacion(token);
    },
    async unirse(codigo) {
      const corto = String(codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (CONFIG_APP && corto.length === 6) {
        const { db } = await this.app(CONFIG_APP);
        const ref = db.collection('invitaciones').doc(corto);
        let inv;
        try { inv = await ref.get({ source: 'server' }); } catch (e) { console.error(e); throw new Error('codigo'); }
        if (!inv.exists) throw new Error('codigo');
        const d = inv.data();
        await db.collection('hogares').doc(d.hid).update({ members: firebase.firestore.FieldValue.arrayUnion(S.uidAuth), joinProof: d.token });
        try { await ref.delete(); } catch { /* ya no hace falta */ }
        ls.set(CONEX, { config: CONFIG_APP, hid: d.hid });
        await this.conectar(CONFIG_APP, d.hid);
        return;
      }
      const inv = leerCodigo(codigo);
      const { db } = await this.app(inv.c);
      const ref = db.collection('hogares').doc(inv.h);
      await ref.update({ members: firebase.firestore.FieldValue.arrayUnion(S.uidAuth), joinProof: inv.t });
      ls.set(CONEX, { config: inv.c, hid: inv.h });
      await this.conectar(inv.c, inv.h);
    },
    async invitacion() {
      const cx = ls.get(CONEX); if (!cx) return null;
      if (CONFIG_APP && cx.config.projectId === CONFIG_APP.projectId) {
        const g = ls.get('tuyyo:invitacion');
        if (g && g.expira > Date.now() + 3600e3) return g.code;
        return this.crearInvitacion();
      }
      const s = await this.hogar.get();
      return codigoInvitacion(cx.config, cx.hid, s.data().joinToken);
    },
    desconectar() { this.subs.forEach(u => u()); this.subs = []; ls.del(CONEX); this.iniciarLocal(); },
    async guardarCfg(cfg) {
      const antes = S.cfg || {};
      S.cfg = cfg;
      // En la nube solo se envían las claves que cambiaron: no se pisan cambios de la pareja en otras claves.
      if (S.modo === 'nube') { const upd = {}; for (const k of Object.keys(cfg)) if (cfg[k] !== undefined && JSON.stringify(cfg[k]) !== JSON.stringify(antes[k])) upd['cfg.' + k] = cfg[k]; if (Object.keys(upd).length) await this.hogar.update(upd); }
      else { const d = this.leerLocal(); d.cfg = cfg; this.guardarLocal(d); render(); }
    },
    // Cambia una sola clave de la configuración compartida sin pisar las demás.
    // Acepta rutas de un nivel más («logros.primer_paso», «consentimientos.b») para que
    // lo que escribe cada celular no pise lo que escribió el otro.
    async guardarCamposCfg(campos) {
      const cfg = { ...S.cfg }, upd = {};
      for (const [k, v] of Object.entries(campos)) {
        const [a, b] = k.split('.');
        if (b) cfg[a] = { ...(cfg[a] || {}), [b]: v }; else cfg[a] = v;
        upd['cfg.' + k] = v;
      }
      S.cfg = cfg;
      if (S.modo === 'nube') await this.hogar.update(upd);
      else { const d = this.leerLocal(); d.cfg = S.cfg; this.guardarLocal(d); render(); }
    },
    guardarCampoCfg(k, v) { return this.guardarCamposCfg({ [k]: v }); },
    // Eliminar mis datos: "todo el hogar" borra la nube para los dos; luego se limpia este celular.
    async eliminarHogar() {
      const db = this.fb.db, ref = this.hogar;
      // Dos pasadas: si la pareja escribió algo mientras se borraba, no queda huérfano.
      for (const pasada of [1, 2]) for (const c of COLS) {
        const q = await ref.collection(c).get();
        let b = db.batch(), n = 0;
        for (const d of q.docs) { b.delete(d.ref); n++; if (n % 400 === 0) { await b.commit(); b = db.batch(); } }
        if (n % 400) await b.commit();
      }
      const inv = ls.get('tuyyo:invitacion');
      if (inv?.code) { try { await db.collection('invitaciones').doc(inv.code).delete(); } catch { /* ya no existe */ } }
      this.subs.forEach(u => u()); this.subs = [];
      await ref.delete();
    },
    async borrarEsteCelular() {
      this.subs.forEach(u => u()); this.subs = [];
      const fb = this.fb; this.fb = null; this.hogar = null;
      if (fb) {
        try { if (fb.auth.currentUser) await fb.auth.currentUser.delete(); } catch (e) { console.error('auth', e); }
        try { await fb.app.delete(); } catch { /* sin app */ }
      }
      try { const dbs = indexedDB.databases ? await indexedDB.databases() : []; for (const d of dbs) if (/firestore|firebase/i.test(d.name || '')) indexedDB.deleteDatabase(d.name); } catch { /* sin IndexedDB */ }
      try { Object.keys(localStorage).filter(k => k.startsWith('tuyyo:')).forEach(k => ls.del(k)); } catch { /* sin almacenamiento */ }
      S.members = []; S.uidAuth = null; S.cfg = null; S.tab = 'inicio';
      for (const c of COLS) S[c] = [];
      this.iniciarLocal();
    },
    async poner(col, id, data) {
      id = id || uid();
      const previo = (S[col] || []).find(x => x.id === id);
      data = { ...data, por: previo?.por || data.por || yo() };
      delete data.id; delete data.editadoPor;
      if (previo && data.por !== yo()) data.editadoPor = yo();
      if (S.modo === 'nube') { await this.hogar.collection(col).doc(id).set(data); }
      else {
        const d = this.leerLocal(); (d.cols[col] = d.cols[col] || {})[id] = data; this.guardarLocal(d);
        const i = S[col].findIndex(x => x.id === id);
        if (i >= 0) S[col][i] = { id, ...data }; else S[col].push({ id, ...data });
        render();
      }
      return id;
    },
    async quitar(col, id) {
      if (S.modo === 'nube') await this.hogar.collection(col).doc(id).delete();
      else { const d = this.leerLocal(); if (d.cols[col]) delete d.cols[col][id]; this.guardarLocal(d); S[col] = S[col].filter(x => x.id !== id); render(); }
    }
  };
  /* Avisos cuando la pareja registra algo */
  const QUE = { gastos: 'registró', aportes: 'aportó a una meta', ingresos: 'anotó un ingreso', deudas: 'actualizó la deuda', fijos: 'actualizó un gasto fijo', metas: 'actualizó la meta', cuentas: 'actualizó una cuenta', citas: 'escribió acuerdos de la cita' };
  function avisarPareja(col, cambios) {
    const otroP = nom(yo() === 'a' ? 'b' : 'a');
    const quitados = cambios.filter(ch => ch.type === 'removed' && !S.borradosPorMi.has(ch.doc.id));
    if (quitados.length && col === 'gastos') {
      const x = quitados[0].doc.data();
      toast(`${otroP} eliminó: ${x.privado ? 'un gasto discreto' : (x.desc || CAT[x.categoria]?.n || 'un gasto')} · ${pesos(x.monto)}${quitados.length > 1 ? ` (y ${quitados.length - 1} más)` : ''}`); vibrar();
      return;
    }
    const autor = ch => { const d = ch.doc.data(); return ch.type === 'added' ? d.por : (d.editadoPor || d.por); };
    if (col === 'gastos') {
      const h = cambios.find(ch => ch.type !== 'removed' && ch.doc.data().habladoPor && ch.doc.data().habladoPor !== yo() && Date.now() - (ch.doc.data().habladoEn || 0) < 120000);
      if (h) { const x = h.doc.data(); toast(`${nom(x.habladoPor)} marcó como hablado: ${x.desc || CAT[x.categoria]?.n || 'un gasto'}`); vibrar(); return; }
      const r = cambios.find(ch => ch.type !== 'removed' && ch.doc.data().revisar && ch.doc.data().revisarPor && ch.doc.data().revisarPor !== yo() && autor(ch) === ch.doc.data().revisarPor);
      if (r) { const x = r.doc.data(); toast(`${nom(x.revisarPor)} quiere hablar de: ${x.desc || CAT[x.categoria]?.n || 'un gasto'} · ${pesos(x.monto)}`); vibrar(); return; }
    }
    const suyos = cambios.filter(ch => ch.type !== 'removed' && autor(ch) && autor(ch) !== yo());
    if (!suyos.length) return;
    const x = suyos[suyos.length - 1].doc.data(), quien = nom(autor(suyos[suyos.length - 1]));
    let txt;
    if (col === 'gastos') txt = `${quien} ${suyos[0].type === 'added' ? 'registró' : 'editó'}: ${x.privado ? 'un gasto discreto' : (x.desc || CAT[x.categoria]?.n || 'un gasto')} · ${pesos(x.monto)}`;
    else if (col === 'aportes' || col === 'ingresos') txt = `${quien} ${QUE[col]}: ${pesos(x.monto)}`;
    else txt = `${quien} ${QUE[col] || 'hizo un cambio'}${x.nombre ? ': ' + x.nombre : ''}`;
    if (suyos.length > 1) txt += ` (y ${suyos.length - 1} más)`;
    toast(txt); vibrar();
  }
  function resumenAusencia(desde) {
    ls.set('tuyyo:visto', Date.now());
    const otroP = yo() === 'a' ? 'b' : 'a';
    const nuevos = [...S.gastos, ...S.aportes, ...S.ingresos].filter(x => x.por === otroP && (x.creado || 0) > desde);
    if (nuevos.length) setTimeout(() => toast(`Mientras no estabas, ${nom(otroP)} registró ${nuevos.length} movimiento${nuevos.length === 1 ? '' : 's'}`), 900);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.modo === 'nube') ls.set('tuyyo:visto', Date.now()); });

  function codigoInvitacion(c, h, t) {
    return 'TUYYO-' + btoa(unescape(encodeURIComponent(JSON.stringify({ c, h, t }))));
  }
  function leerCodigo(s) {
    const limpio = String(s || '').trim().replace(/^TUYYO-/, '').replace(/\s+/g, '');
    let o; try { o = JSON.parse(decodeURIComponent(escape(atob(limpio)))); } catch { throw new Error('codigo'); }
    if (!o || !o.c || !o.c.projectId || !/^[A-Za-z0-9]{10,40}$/.test(o.h) || !/^[a-f0-9]{36}$/.test(o.t)) throw new Error('codigo');
    return o;
  }
  function leerConfigFirebase(txt) {
    const o = {}; const re = /(\w+)\s*["']?\s*:\s*["']([^"']+)["']/g; let m;
    while ((m = re.exec(txt))) o[m[1]] = m[2];
    if (!o.apiKey || !o.projectId || !o.appId) throw new Error('config');
    const ok = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    return Object.fromEntries(ok.filter(k => o[k]).map(k => [k, o[k]]));
  }

  /* ---------- Cálculos ---------- */
  const esAhorroCat = x => CAT[x.categoria]?.g === 'aho';
  function calcular(mes) {
    // Lo de categorías del grupo «Ahorro e inversión» cuenta como ahorro, nunca como gasto.
    const todos = S.gastos.filter(x => mesDe(x.fecha) === mes && x.categoria !== 'ajuste');
    const g = todos.filter(x => !esAhorroCat(x));
    const ahorroCat = sum(todos.filter(esAhorroCat));
    const extras = S.ingresos.filter(x => mesDe(x.fecha) === mes);
    const cfg = S.cfg || cfgBase();
    const ingresos = (cfg.ingresos.a || 0) + (cfg.ingresos.b || 0) + sum(extras);
    const porCat = {}; for (const x of g) porCat[x.categoria] = (porCat[x.categoria] || 0) + (x.monto || 0);
    const gastado = sum(g);
    const aportesMes = S.aportes.filter(x => mesDe(x.fecha) === mes);
    const ahorro = sum(aportesMes) + ahorroCat;
    const financiado = sum(g.filter(x => x.metaId));
    const esActual = mes === mesDe(hoy());
    const fijosPend = esActual ? S.fijos.filter(f => f.activo !== false).reduce((a, f) => a + estadoFijo(f, mes).pendiente, 0) : 0;
    const metaAhorro = ingresos * (cfg.metaAhorroPct || 0) / 100;
    const pagadoPor = { a: sum(g.filter(x => x.pagadoPor === 'a')), b: sum(g.filter(x => x.pagadoPor === 'b')) };
    const cuotasPend = S.deudas.reduce((a, d) => {
      const st = estadoDeuda(d); if (st.saldo <= 0 && !st.pagadoMes) return a;
      return st.alDia ? a : a + Math.max(0, st.cuotaMes - st.pagadoMes);
    }, 0);
    // Lo pagado con el ahorro de una meta no castiga el libre del mes.
    const libre = ingresos - (gastado - financiado) - ahorro;
    // Nada programado se descuenta hasta que alguno de los dos confirme el pago (o el aporte).
    // Lo programado se informa aparte: «si pagan todo, quedarían…».
    const metaPend = esActual ? Math.max(0, metaAhorro - ahorro) : 0;
    const programado = metaPend + (esActual ? cuotasPend : 0) + fijosPend;
    const libreReal = libre;
    const libreSiPagan = libre - programado;
    const presDiv = cfg.presupuestos.diversion || 0;
    const divGastado = porCat.diversion || 0;
    return { g, ingresos, porCat, gastado, ahorro, aportesMes, ahorroCat, financiado, fijosPend, metaAhorro, metaPend, programado, libreSiPagan, pagadoPor, cuotasPend, libre, libreReal, presDiv, divGastado, extras };
  }
  function balance() {
    let netA = 0;
    for (const x of S.gastos) {
      const m = x.monto || 0;
      const ra = x.tipo === 'compartido' ? (typeof x.ratioA === 'number' ? x.ratioA : ratioA()) : x.tipo === 'a' ? 1 : 0;
      netA += (x.pagadoPor === 'a' ? m : 0) - m * ra;
    }
    return Math.round(netA);
  }
  // Entidades del mercado colombiano (Superfinanciera y otras). El campo acepta texto libre.
  const BANCOS = ['Bancolombia', 'Davivienda', 'Banco de Bogotá', 'BBVA Colombia', 'Banco de Occidente', 'Banco Popular', 'Banco AV Villas', 'Banco Caja Social', 'Banco Agrario', 'Davibank (antes Scotiabank Colpatria)', 'Banco GNB Sudameris', 'Itaú', 'Citibank', 'Banco Santander', 'Banco Falabella', 'Bancoomeva', 'Banco Pichincha', 'Banco Finandina', 'Banco Serfinanza', 'Banco W', 'Bancamía', 'Banco Mundo Mujer', 'Mibanco', 'Bancien (antes Credifinanciera)', 'Lulo Bank', 'Banco Unión', 'Banco Contactar', 'Banco Coopcentral', 'BTG Pactual', 'J.P. Morgan', 'Nu Colombia', 'Nequi', 'Daviplata', 'dale!', 'Movii', 'RappiPay', 'Ualá', 'Bold', 'Coink', 'Powwi', 'Global66', 'Tuya (Éxito, Carulla)', 'Credifamilia', 'GM Financial', 'RCI Colombia', 'Coltefinanciera', 'La Hipotecaria', 'Financiera Juriscoop', 'Financiera Dann Regional', 'Iris', 'Confiar', 'Cotrafa', 'Cooperativa JFK', 'Coofinep', 'Cooperativa Financiera de Antioquia', 'Fondo Nacional del Ahorro', 'ICETEX', 'Bancóldex', 'Findeter', 'Finagro', 'Corficolombiana', 'Credicorp Capital', 'Addi', 'Sistecrédito', 'Crédito Fácil Codensa (Enel)', 'Brilla', 'Compensar', 'Cafam', 'Colsubsidio', 'Comfama', 'Comfenalco', 'Comfandi', 'Cajasan', 'Fincomercio', 'Coopetraban', 'Crediservir', 'Lineru', 'Rapicredit', 'Juancho te presta', 'Fondo de empleados', 'Cooperativa de ahorro y crédito', 'Caja de compensación', 'Familiar o amigo', 'Almacén o tienda', 'Otra entidad'];
  const ICON_DEUDA = t => ({ vehiculo: ICON.carro, vivienda: ICON.casa, educativo: ICON.libro, personal: ICON.users })[t] || ICON.card;
  const TIPOS_DEUDA = { tarjeta: 'Tarjeta de crédito', consumo: 'Crédito de libre inversión', vehiculo: 'Crédito de vehículo', vivienda: 'Crédito de vivienda', educativo: 'Crédito educativo', personal: 'Préstamo personal', otro: 'Otra deuda' };
  const tasaMensual = d => { const t = Number(d.tasa) || 0; if (!t) return 0; return d.tasaTipo === 'mv' ? t / 100 : Math.pow(1 + t / 100, 1 / 12) - 1; };
  function simular(saldo, i, cuota) {
    if (saldo <= 0) return { meses: 0, intereses: 0, total: 0 };
    if (!cuota) return null;
    if (i > 0 && cuota <= saldo * i) return { nunca: true };
    let s = saldo, m = 0, int = 0;
    while (s > 0.5 && m < 600) { const x = s * i; int += x; s = s + x - cuota; m++; }
    return { meses: m, intereses: Math.round(int), total: Math.round(saldo + int) };
  }
  const diaEn = (mes, dia) => { const [y, m] = mes.split('-').map(Number); return mes + '-' + pad(Math.min(dia, new Date(y, m, 0).getDate())); };
  const diasEntre = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
  const fechaCorta = f => { const [y, m, d] = f.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', ''); };
  const mesesTxt = n => n + ' mes' + (n === 1 ? '' : 'es');
  function estadoDeuda(d) {
    const pagos = S.gastos.filter(x => x.deudaId === d.id).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.creado || 0) - (b.creado || 0));
    const corte = d.saldoActualizado || 0;
    const base = corte && d.saldoActual != null ? d.saldoActual : (d.saldoInicial || 0);
    const posteriores = corte ? pagos.filter(x => (x.creado || 0) > corte) : pagos;
    const saldo = Math.max(0, Math.round(base - sum(posteriores, x => x.capital ?? x.monto)));
    const original = Math.max(d.saldoInicial || 0, base);
    const i = tasaMensual(d);
    const proy = simular(saldo, i, d.cuota || 0);
    const mesHoy = mesDe(hoy());
    const pagadoMes = sum(pagos.filter(x => mesDe(x.fecha) === mesHoy));
    const cuotaMes = Math.min(d.cuota || 0, saldo + pagadoMes);
    let alDia = !cuotaMes || pagadoMes >= cuotaMes * 0.98;
    // Si la deuda se registró después del día de pago de este mes, esa cuota ya estaba pagada.
    if (!alDia && d.dia && d.creado) { const c = new Date(d.creado); const fc = c.getFullYear() + '-' + pad(c.getMonth() + 1) + '-' + pad(c.getDate()); if (mesDe(fc) === mesHoy && diaEn(mesHoy, d.dia) < fc) alDia = true; }
    let proximo = null, dias = null;
    if (d.dia && saldo > 0) { proximo = diaEn(alDia ? sumarMes(mesHoy, 1) : mesHoy, d.dia); dias = diasEntre(hoy(), proximo); }
    return {
      pagos, saldo, original, i, proy, pagadoMes, cuotaMes, alDia, proximo, dias,
      pagado: sum(pagos), intereses: sum(pagos, x => x.interes || 0),
      pct: original ? Math.min(1, Math.max(0, 1 - saldo / original)) : 0,
      numCuota: (d.cuotasPrevias || 0) + pagos.filter(x => !x.abono).length,
      fin: proy && !proy.nunca && proy.meses ? sumarMes(mesHoy, proy.meses - (alDia ? 0 : 1)) : null,
      porA: sum(pagos.filter(x => x.pagadoPor === 'a')), porB: sum(pagos.filter(x => x.pagadoPor === 'b'))
    };
  }
  function parteCuota(d, quien) {
    const c = d.cuota || 0, r = d.responsable || 'ambos';
    if (r === 'ambos') return Math.round(c * (quien === 'a' ? ratioA() : 1 - ratioA()));
    return r === quien ? c : 0;
  }
  function chipVence(st) {
    if (st.saldo <= 0) return '<span class="pill ok">Pagada</span>';
    if (st.dias == null) return st.pagadoMes ? '<span class="pill ok">Pagada este mes</span>' : '';
    if (st.alDia) return `<span class="pill ok">Al día · próxima ${fechaCorta(st.proximo)}</span>`;
    if (st.dias < 0) return `<span class="pill bad">Vencida hace ${-st.dias} día${st.dias === -1 ? '' : 's'}</span>`;
    if (st.dias === 0) return '<span class="pill bad">Vence hoy</span>';
    if (st.dias <= 5) return `<span class="pill warn">Vence en ${st.dias} día${st.dias === 1 ? '' : 's'}</span>`;
    return `<span class="pill azul">Vence el ${fechaCorta(st.proximo)}</span>`;
  }
  const bancoDe = d => d.banco || d.entidad || '';
  function filaPago(d, st, i) {
    const falta = st.alDia ? Math.min(d.cuota || 0, st.saldo) : Math.max(0, st.cuotaMes - st.pagadoMes);
    return `<div class="pago-row" style="--i:${i}">
      <span class="ico" style="background:${st.dias != null && st.dias < 0 ? 'var(--bad)' : 'var(--deuda)'}" aria-hidden="true">${ICON_DEUDA(d.tipo)}</span>
      <div class="t"><b>${esc(d.nombre)}</b><small>${esc(bancoDe(d) || TIPOS_DEUDA[d.tipo] || '')} · ${pesos(falta)}</small><div>${chipVence(st)}</div></div>
      <button class="btn soft" data-act="pagarDeuda" data-id="${esc(d.id)}">Pagar</button></div>`;
  }
  function pagosPendientes(maxDias) {
    return S.deudas.map(d => ({ d, st: estadoDeuda(d) }))
      .filter(({ st }) => st.saldo > 0 && st.dias != null && st.dias <= maxDias)
      .sort((a, b) => a.st.dias - b.st.dias);
  }
  function estadoMeta(m) {
    const ap = S.aportes.filter(x => x.metaId === m.id);
    const aportado = sum(ap);
    const usado = sum(S.gastos.filter(x => x.metaId === m.id));
    const ahorrado = Math.max(0, aportado - usado);
    const meses = new Set(ap.map(x => mesDe(x.fecha))).size || 1;
    const ritmo = aportado / meses;
    const obj = m.objetivo || 0;
    const falta = Math.max(0, obj - ahorrado);
    const llego = obj > 0 && aportado >= obj;
    let eta = null;
    if (falta > 0 && ritmo > 0) eta = sumarMes(mesDe(hoy()), Math.ceil(falta / ritmo));
    const mesHoy = mesDe(hoy());
    let sugerido = 0, atrasado = 0, adelantado = false;
    if (falta > 0) {
      if (m.fechaLimite) {
        const rest = Math.max(1, mesesEntre(mesHoy, mesDe(m.fechaLimite)) + 1);
        sugerido = Math.ceil(falta / rest / 1000) * 1000;
        const inicio = ap.length ? ap.map(x => mesDe(x.fecha)).sort()[0] : mesHoy;
        const total = Math.max(1, mesesEntre(inicio, mesDe(m.fechaLimite)) + 1), pasados = Math.min(total, mesesEntre(inicio, mesHoy) + 1);
        const esperado = obj * pasados / total;
        if (ap.length && ahorrado < esperado * .9) atrasado = Math.ceil((esperado - ahorrado) / 1000) * 1000;
        else if (ap.length && ahorrado > esperado * 1.05) adelantado = true;
      } else sugerido = Math.max(20000, Math.round(Math.max(0, calcular(mesHoy).libreReal) * .3 / 1000) * 1000);
    }
    const estado = m.estado === 'archivada' ? 'archivada' : llego && usado >= aportado * .9 ? 'usada' : llego || falta <= 0 ? 'cumplida' : 'activa';
    return { ahorrado, aportado, usado, pct: obj ? Math.min(1, ahorrado / obj) : 0, pctLogrado: obj ? Math.min(1, aportado / obj) : 0, falta, ritmo, eta, sugerido, atrasado, adelantado, estado,
      porA: sum(ap.filter(x => x.quien === 'a')), porB: sum(ap.filter(x => x.quien === 'b')) };
  }
  const metasActivas = () => S.metas.filter(m => m.estado !== 'archivada');

  /* ---------- Render ---------- */
  const app = $('#app'), nav = $('#nav');
  let renderPend = false;
  function render() {
    if (renderPend) return; renderPend = true;
    requestAnimationFrame(() => { renderPend = false; pintar(); });
  }
  function pintar() {
    if (S.modo === 'cargando') return;
    refrescarCats();
    if (!S.cfg || !S.cfg.nombres?.a) { nav.hidden = true; app.innerHTML = vistaBienvenida(); return; }
    nav.hidden = false;
    nav.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-current', b.dataset.tab === S.tab ? 'page' : 'false'));
    const vistas = { inicio: vistaInicio, gastos: vistaGastos, deudas: vistaDeudas, ahorro: vistaPlanes };
    const clave = S.tab + S.mes;
    const nuevaVista = S._vista !== clave; S._vista = clave;
    app.innerHTML = cabecera() + `<div class="view${nuevaVista ? '' : ' quieta'}">${vistas[S.tab]()}</div>`;
    programarRecordatorios();
    sincronizarConsentimiento();
    if (!PREVIEW && !consentOk() && sheet.hidden) pedirConsentimiento('continuar');
    evaluarLogros();
    if (!nuevaVista) app.querySelector('.view').style.animation = 'none';
    contar();
  }
  function contar() {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    app.querySelectorAll('[data-num]').forEach(el => {
      const fin = Number(el.dataset.num), k = el.dataset.k || '';
      const ini0 = S.ultimos[k] ?? 0; S.ultimos[k] = fin;
      if (reduce || ini0 === fin) { el.textContent = pesos(fin); return; }
      el.classList.remove('salto'); void el.offsetWidth; el.classList.add('salto');
      const t0 = performance.now(), dur = 800;
      const paso = t => { const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 3); el.textContent = pesos(ini0 + (fin - ini0) * e); if (p < 1) requestAnimationFrame(paso); };
      requestAnimationFrame(paso);
    });
  }
  function cabecera() {
    return `<header class="top">
      <div class="brand">${LOGO()}<span>TU <span class="y">y</span> YO</span></div>
      <div class="sp"></div>
      <div class="duo" aria-label="${esc(nom('a'))} y ${esc(nom('b'))}"><span class="av a">${esc(ini('a'))}</span><span class="av b">${esc(ini('b'))}</span></div>
      <button class="icon-btn trofeo" data-act="logros" aria-label="Logros${hayLogroNuevo() ? ': hay uno nuevo' : ''}">${ICON.trofeo}${hayLogroNuevo() ? '<i class="punto"></i>' : ''}</button>
      <button class="icon-btn" data-act="ajustes" aria-label="Ajustes">${ICON.gear}</button>
    </header>
    ${S.tab !== 'deudas' ? `<div class="month">
      <button class="icon-btn" data-act="mes" data-n="-1" aria-label="Mes anterior">${ICON.left}</button>
      <h2>${esc(nombreMes(S.mes))}</h2>
      <button class="icon-btn" data-act="mes" data-n="1" aria-label="Mes siguiente">${ICON.right}</button>
    </div>` : '<div style="height:6px"></div>'}
    ${S.modo === 'nube' && S.members.length < 2 ? `<div class="banner">${ICON.users}<span>Falta que ${esc(nom(yo() === 'a' ? 'b' : 'a'))} se vincule.</span><button class="btn soft" data-act="invitar" style="padding:8px 12px">Ver código</button></div>` : ''}
    ${S.modo === 'local' && (PREVIEW || (ls.get('tuyyo:bannerHasta') || 0) < Date.now()) ? `<div class="banner">${ICON.link}<span>${PREVIEW ? 'Vista previa: los datos quedan solo en este dispositivo.' : 'Vincula a tu pareja para que los dos vean y editen todo.'}</span><button class="btn soft" data-act="conectar" style="padding:8px 12px">${PREVIEW ? 'Opciones' : 'Vincular'}</button>${PREVIEW ? '' : '<button class="btn ghost" data-act="bannerLuego" style="padding:8px 10px">Ahora no</button>'}</div>` : ''}`;
  }

  function vistaBienvenida() {
    return `<div class="welcome">
      ${LOGO('grande')}
      <div class="logo">TU <span>y</span> YO</div>
      <p>El presupuesto de los dos: cada gasto, cada deuda y cada peso que ahorran juntos.</p>
      <div class="menu">
        <button style="--i:0" data-act="setup"><span class="ico" style="background:var(--azul)">${ICON.heart}</span><span><b>Empezar nuestro presupuesto</b><small>Configura nombres e ingresos en un minuto</small></span></button>
        <button style="--i:1" data-act="unirme"><span class="ico" style="background:var(--verde)">${ICON.link}</span><span><b>Mi pareja ya lo creó</b><small>Escribe el código de 6 letras que te compartió</small></span></button>
        ${PREVIEW ? `<button style="--i:2" data-act="ejemplo"><span class="ico" style="background:#5B7BE0">${ICON.spark}</span><span><b>Ver con datos de ejemplo</b><small>Una pareja ficticia con gastos, deudas y metas</small></span></button>` : ''}
      </div>
    </div>`;
  }

  function vistaInicio() {
    const c = calcular(S.mes);
    const ahorroPct = c.ingresos ? c.ahorro / c.ingresos : 0;
    const libreTxt = c.libreReal >= 0 ? 'Les quedan libres este mes' : 'Este mes van en rojo por';
    const esHoyMes = S.mes === mesDe(hoy());
    // donut interactivo
    const partes = [];
    const cats = Object.entries(c.porCat).sort((a, b) => b[1] - a[1]);
    for (const [k, v] of cats) partes.push({ n: CAT[k]?.n || k, v, col: CAT[k]?.c || '#999' });
    if (c.ahorro > 0) partes.push({ n: 'Ahorro', nota: 'no es gasto', v: c.ahorro, col: 'var(--ok)' });
    if (c.libre > 0) partes.push({ n: 'Sin asignar', v: c.libre, col: 'var(--surface-2)' });
    const total = Math.max(c.ingresos, sum(partes, p => p.v)) || 1;
    const RD = 80, LD = 2 * Math.PI * RD; let acc = 0;
    const arcs = partes.map((p, i) => {
      const len = p.v / total * LD; const s = `<circle class="arc" data-act="donut" data-i="${i}" cx="100" cy="100" r="${RD}" stroke="${esc(p.col)}" stroke-dasharray="${Math.max(0, len - 1.5)} ${LD}" stroke-dashoffset="${-acc}" style="animation-delay:${i * 60}ms"><title>${esc(p.n)}: ${pesos(p.v)}</title></circle>`;
      acc += len; return s;
    }).join('');
    const pctGastado = (c.ingresos ? Math.round(c.gastado / c.ingresos * 100) : 0) + '%';
    const net = balance();
    const deudor = net > 0 ? 'b' : 'a', acreedor = otro(deudor);
    // presupuestos con marcador de "hoy"
    const pres = S.cfg.presupuestos || {};
    const [yy, mm] = S.mes.split('-').map(Number);
    const hoyPct = esHoyMes ? Number(hoy().slice(8)) / new Date(yy, mm, 0).getDate() : 1;
    const filas = CATS.filter(k => c.porCat[k.id] || (pres[k.id] && !k.oculta)).map((k, i) => {
      const g = c.porCat[k.id] || 0, p = pres[k.id] || 0, r = p ? g / p : 0;
      const est = !p ? '<span class="pill azul">sin tope</span>' : r > 1 ? `<span class="pill bad">Se pasaron ${corto(g - p)}</span>` : esHoyMes && r - hoyPct > .15 ? '<span class="pill warn">Van rápido</span>' : `<span class="pill ok">Quedan ${corto(p - g)}</span>`;
      return `<div class="bar-row" style="--i:${i}"><div class="lbl"><b>${esc(k.n)}</b><span class="num">${pesos(g)}${p ? ' / ' + corto(p) : ''} ${est}</span></div>
        <div class="track grueso"><div style="width:${p ? Math.min(100, r * 100) : 100}%;background:${r > 1 ? 'var(--bad)' : esc(k.c)};animation-delay:${i * 50}ms;${!p ? 'opacity:.35' : ''}"></div>${p && esHoyMes ? `<i class="hoy" style="left:${(hoyPct * 100).toFixed(1)}%" title="Hoy"></i>` : ''}</div></div>`;
    }).join('');
    const divRest = c.presDiv - c.divGastado;
    const sinIngresos = !c.ingresos;
    const compartidos = S.gastos.some(x => x.tipo === 'compartido' || x.categoria === 'ajuste');

    return `
    <section class="hero">
      ${sinIngresos ? `<div class="eyebrow">Para empezar</div>
      <div class="big" style="font-size:30px">Empiecen por lo que entra cada mes</div>
      <div class="nota">Con los ingresos de los dos calculamos cuánto les queda libre, cuánto ahorrar y cuánto le toca a cada uno.</div>
      <button class="btn hero-btn" data-act="ajustes">${ICON.up} Agregar ingresos</button>` : `<div class="eyebrow">${libreTxt}</div>
      <div class="big num" data-num="${Math.abs(Math.round(c.libreReal))}" data-k="libre">${pesos(Math.abs(c.libreReal))}</div>
      <div class="nota">${(() => {
        if (!esHoyMes || c.programado <= 0) return 'Solo descontamos lo que ya confirmaron como pagado.';
        const qu = []; if (c.fijosPend > 0) qu.push('fijos ' + corto(c.fijosPend)); if (c.cuotasPend > 0) qu.push('cuotas ' + corto(c.cuotasPend)); if (c.metaPend > 0) qu.push('ahorro ' + corto(c.metaPend));
        return `Solo descontamos lo ya pagado. Tienen ${pesos(c.programado)} programado por pagar (${qu.join(', ')}): si lo pagan todo, ${c.libreSiPagan >= 0 ? 'quedarían ' + pesos(c.libreSiPagan) : 'faltarían ' + pesos(-c.libreSiPagan)}.`;
      })()}</div>`}
      <div class="stats">
        <div class="stat"><span>Ingresos</span><b class="num">${corto(c.ingresos)}</b></div>
        <div class="stat"><span>Gastado</span><b class="num">${corto(c.gastado)}</b></div>
        <div class="stat"><span>Ahorrado</span><b class="num">${corto(c.ahorro)}</b></div>
      </div>
    </section>

    ${(() => {
      if (!esHoyMes) return '';
      const pp = pagosPendientes(7);
      const sig = sumarMes(S.mes, 1);
      const ff = S.fijos.filter(f => f.activo !== false && f.dia).flatMap(f => {
        const st = estadoFijo(f, S.mes);
        if (!st.pago && st.dias != null && st.dias <= 7) return [{ f, mes: S.mes, dias: st.dias }];
        const d2 = diasEntre(hoy(), diaEn(sig, f.dia));
        return st.pago && d2 <= 7 && !estadoFijo(f, sig).pago ? [{ f, mes: sig, dias: d2 }] : [];
      }).sort((a, b) => a.dias - b.dias);
      return pp.length + ff.length ? `<section class="card"><h3>Pagos que se acercan <span class="sub">próximos 7 días</span></h3><div class="stagger" style="display:grid;gap:10px">${[...pp.map(x => ({ dias: x.st.dias, html: i => filaPago(x.d, x.st, i) })), ...ff.map(x => ({ dias: x.dias, html: i => filaFijo(x.f, i, x.mes) }))].sort((p, q) => p.dias - q.dias).map((x, i) => x.html(i)).join('')}</div></section>` : '';
    })()}
    ${(() => {
      const rv = S.gastos.filter(x => x.revisar && !oculto(x)).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).slice(0, 5);
      return rv.length ? `<section class="card"><h3>${ICON.chat.replace('<svg', '<svg style="width:18px;height:18px;color:var(--verde)"')} Para hablar juntos</h3><div style="display:grid;gap:10px">${rv.map(x => filaHablar(x)).join('')}</div></section>` : '';
    })()}

    <section class="card">
      <h3>¿A dónde va cada peso? <span class="sub">${c.ingresos ? Math.round(ahorroPct * 100) + '% ahorrado' : ''}</span></h3>
      ${partes.length ? `<div class="donut-wrap" data-pct="${pctGastado}">
        <svg class="donut" viewBox="0 0 200 200" role="img" aria-label="Distribución del ingreso: ${esc(partes.map(p => p.n + ' ' + corto(p.v)).join(', '))}">
          <circle cx="100" cy="100" r="${RD}" fill="none" stroke="var(--surface-2)" stroke-width="22"/>${arcs}
          <text id="donutL" x="100" y="92" text-anchor="middle" font-size="13" style="fill:var(--muted)">gastado</text>
          <text id="donutV" x="100" y="118" text-anchor="middle" font-size="24" font-weight="800">${pctGastado}</text>
        </svg>
        <div class="legend">${partes.slice(0, 10).map((p, i) => `<button type="button" class="ley" data-act="donut" data-i="${i}" data-n="${esc(p.n)}" data-v="${esc(corto(p.v))}" aria-pressed="false"><i style="background:${esc(p.col)}"></i><span>${esc(p.n)}${p.nota ? ` <em>${esc(p.nota)}</em>` : ''}</span><span>${c.ingresos ? Math.round(p.v / c.ingresos * 100) : 0}% · ${corto(p.v)}</span></button>`).join('')}</div>
      </div>` : vacio('Aún no hay movimientos este mes', 'Toca el botón + para escanear una factura o anotar un gasto.', 'primer-mes')}
    </section>

    ${(() => {
      if (S.modo !== 'nube' && !PREVIEW) return '';
      const items = [
        ...S.gastos.filter(x => x.categoria !== 'ajuste').map(x => ({ t: x.creado, por: x.por || x.pagadoPor, txt: descDe(x), m: x.monto, act: 'verGasto', id: x.id })),
        ...S.aportes.map(x => ({ t: x.creado, por: x.por || x.quien, txt: 'Aporte a ' + (S.metas.find(m => m.id === x.metaId)?.nombre || 'una meta'), m: x.monto, act: 'editarAporte', id: x.id, ahorro: true })),
        ...S.ingresos.map(x => ({ t: x.creado, por: x.por || x.quien, txt: x.desc || 'Ingreso extra', m: x.monto, mas: true, act: 'editarIngreso', id: x.id }))
      ].filter(x => x.t).sort((a, b) => b.t - a.t).slice(0, 5);
      if (!items.length) return '';
      return `<section class="card"><h3>${ICON.users.replace('<svg', '<svg style="width:18px;height:18px;color:var(--azul)"')} Lo último de los dos</h3><div class="act">${items.map(x => `<button class="act-row" ${x.act ? `data-act="${x.act}" data-id="${esc(x.id)}"` : 'disabled'}>
        <span class="av ${esc(x.por)}">${esc(ini(x.por))}</span><span class="t"><b>${esc(x.txt)}</b><small>${esc(x.por === yo() && S.modo === 'nube' ? 'Tú' : nom(x.por))} · ${esc(haceTiempo(x.t))}${x.ahorro ? ' · ahorro' : ''}</small></span>
        <span class="m num" ${x.mas || x.ahorro ? 'style="color:var(--ok)"' : ''}>${x.mas ? '+' : ''}${pesos(x.m)}</span></button>`).join('')}</div></section>`;
    })()}

    ${compartidos ? `<section class="card">
      <h3>Cuentas claras entre los dos</h3>
      <div class="balance">
        <span class="av" style="background:var(--${deudor === 'a' ? 'azul' : 'verde'})">${esc(ini(deudor))}</span>
        <div class="flecha" aria-hidden="true"></div>
        <span class="av" style="background:var(--${acreedor === 'a' ? 'azul' : 'verde'})">${esc(ini(acreedor))}</span>
      </div>
      <div class="balance-txt">${net === 0 ? '<b>Están a paz y salvo</b><span class="muted">Nadie le debe nada a nadie.</span>'
        : `<span class="muted">${esc(nom(deudor))} le debe a ${esc(nom(acreedor))}</span><b class="num" data-num="${Math.abs(net)}" data-k="bal">${pesos(Math.abs(net))}</b>`}</div>
      <div class="split">
        <div class="who"><small><span class="dot a"></span>${esc(nom('a'))} pagó este mes</small><b class="num">${pesos(c.pagadoPor.a)}</b><small>${c.gastado ? Math.round(c.pagadoPor.a / c.gastado * 100) : 0}% · le toca ${Math.round(ratioA() * 100)}%</small></div>
        <div class="who"><small><span class="dot b"></span>${esc(nom('b'))} pagó este mes</small><b class="num">${pesos(c.pagadoPor.b)}</b><small>${c.gastado ? Math.round(c.pagadoPor.b / c.gastado * 100) : 0}% · le toca ${Math.round((1 - ratioA()) * 100)}%</small></div>
      </div>
      ${net !== 0 ? `<button class="btn soft full" style="margin-top:12px" data-act="saldar">Registrar que ${esc(nom(deudor))} ya pagó</button>` : ''}
    </section>` : ''}

    ${(() => {
      const pp = plataPersonal(S.mes); if (!pp.a.tope && !pp.b.tope) return '';
      const barra = p => { const x = pp[p], r = x.tope ? x.usado / x.tope : 0; return `<div class="bar-row"><div class="lbl"><b><span class="dot ${p}"></span>${esc(nom(p))}</b><span class="num muted">${x.tope ? (x.usado <= x.tope ? 'le quedan ' + pesos(x.tope - x.usado) : 'se pasó ' + pesos(x.usado - x.tope)) : pesos(x.usado) + ' sin tope'}</span></div><div class="track"><div style="width:${Math.min(100, r * 100)}%;background:${r > 1 ? 'var(--bad)' : 'var(--' + (p === 'a' ? 'azul' : 'verde') + ')'}"></div></div></div>`; };
      return `<section class="card"><h3>Plata personal <span class="sub">sin dar explicaciones</span></h3><div class="bars">${barra('a')}${barra('b')}</div></section>`;
    })()}

    ${(() => {
      if (!S.cuentas.length && !S.deudas.length) return '';
      const p = patrimonio();
      return `<section class="card"><h3>Patrimonio de los dos</h3>
        <div class="patri"><div><small>Tienen</small><b class="num" style="color:var(--ok)">${corto(p.activos)}</b></div><div><small>Deben</small><b class="num" style="color:var(--bad)">${corto(p.deudas)}</b></div><div><small>Neto</small><b class="num">${corto(p.neto)}</b></div></div>
        <button class="btn ghost full" style="margin-top:12px" data-act="cuentas">${S.cuentas.length ? 'Ver y actualizar cuentas' : 'Agregar sus cuentas y ahorros'}</button></section>`;
    })()}

    <section class="card">
      <h3>Termómetro de diversión</h3>
      ${c.presDiv ? `<div class="bar-row"><div class="lbl"><b>${divRest >= 0 ? 'Les quedan ' + pesos(divRest) : 'Se pasaron por ' + pesos(-divRest)}</b><span class="num muted">${pesos(c.divGastado)} / ${pesos(c.presDiv)}</span></div>
        <div class="track grueso"><div style="width:${Math.min(100, c.divGastado / c.presDiv * 100)}%;background:${divRest < 0 ? 'var(--bad)' : 'linear-gradient(90deg,var(--azul),var(--verde))'}"></div>${esHoyMes ? `<i class="hoy" style="left:${(hoyPct * 100).toFixed(1)}%"></i>` : ''}</div></div>
        <button class="btn ghost full" style="margin-top:12px" data-act="tab" data-tab="ahorro">Ver planes que les alcanzan</button>`
        : `<p class="muted" style="margin:0 0 12px">Pónganle un tope a la diversión y les diremos qué planes les alcanzan sin tocar el ahorro.</p><button class="btn soft full" data-act="ajustes">Definir presupuestos</button>`}
    </section>

    <section class="card"><h3>Presupuesto por categoría <span class="sub">${(() => { const r = resumenDist(pres); return r.ing ? (r.libre >= 0 ? 'sin asignar ' + corto(r.libre) : 'se pasan ' + corto(-r.libre)) : ''; })()}</span></h3>
      ${filas ? `<div class="bars stagger">${filas}</div>${esHoyMes ? '<p class="muted" style="font-size:12px;margin:8px 0 0">La rayita marca cuánto del mes ha pasado: si la barra va más adelante, van rápido.</p>' : ''}` : '<p class="muted" style="margin:0">Repartan su ingreso entre categorías para ver cuánto les queda en cada una.</p>'}
      <button class="btn soft full" style="margin-top:14px" data-act="distribucion">${ICON.target} Ajustar distribución y categorías</button></section>

    <section class="card">
      <h3>Últimos 6 meses</h3>
      ${grafico6Meses(S.mes)}
    </section>`;
  }

  /* ---------- Gráficas ---------- */
  function grafico6Meses(mes) {
    const meses = [...Array(6)].map((_, i) => sumarMes(mes, i - 5));
    let acum = 0;
    const d = meses.map(m => { const x = calcular(m); acum += x.ahorro; return { m, i: x.ingresos, g: x.gastado, a: x.ahorro, acum }; });
    const W = 340, H = 190, top = 14, base = 160, alto = base - top;
    const max = Math.max(1, ...d.map(x => Math.max(x.i, x.g, x.acum)));
    const slot = (W - 16) / 6, bw = Math.min(16, slot * .3);
    const y = v => base - v / max * alto;
    const barras = d.map((x, k) => {
      const cx = 8 + slot * k + slot / 2;
      return `<g class="g6" style="--i:${k}"><rect x="${(cx - bw - 1).toFixed(1)}" y="${y(x.i).toFixed(1)}" width="${bw}" height="${(base - y(x.i)).toFixed(1)}" rx="4" fill="var(--azul-soft)"><title>Ingresos ${esc(nombreMes(x.m))}: ${pesos(x.i)}</title></rect>
        <rect x="${(cx + 1).toFixed(1)}" y="${y(x.g).toFixed(1)}" width="${bw}" height="${(base - y(x.g)).toFixed(1)}" rx="4" fill="${x.m === mes ? 'var(--azul)' : 'color-mix(in srgb, var(--azul) 55%, transparent)'}"><title>Gastos ${esc(nombreMes(x.m))}: ${pesos(x.g)}</title></rect>
        <text x="${cx.toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="11" style="fill:${x.m === mes ? 'var(--ink)' : 'var(--muted)'};font-weight:${x.m === mes ? 700 : 500}">${esc(nombreMes(x.m, { month: 'short' }).replace('.', ''))}</text></g>`;
    }).join('');
    const pts = d.map((x, k) => [8 + slot * k + slot / 2, y(x.acum)]);
    const linea = pts.map((p, k) => (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const ult = d[5];
    return `<svg class="g6m" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ingresos, gastos y ahorro acumulado de los últimos 6 meses. En ${esc(nombreMes(mes))}: ingresos ${pesos(ult.i)}, gastos ${pesos(ult.g)}, ahorro acumulado ${pesos(ult.acum)}">
      <line x1="8" x2="${W - 8}" y1="${base}" y2="${base}" stroke="var(--line)"/>
      ${barras}
      ${acum > 0 ? `<path class="linea" d="${linea}" fill="none" stroke="var(--verde)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>${pts.map((p, k) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${k === 5 ? 5 : 3.5}" fill="var(--surface)" stroke="var(--verde)" stroke-width="2.5"><title>Ahorro acumulado: ${pesos(d[k].acum)}</title></circle>`).join('')}` : ''}
    </svg>
    <div class="ley-g"><span><i style="background:var(--azul-soft)"></i>Ingresos</span><span><i style="background:var(--azul)"></i>Gastos</span><span><i class="lin"></i>Ahorro acumulado ${corto(ult.acum)}</span></div>`;
  }
  function curvaDeudas(activas) {
    const ds = activas.filter(x => x.d.cuota > 0).map(x => ({ n: x.d.nombre, s: x.st.saldo, i: x.st.i, c: x.d.cuota }));
    if (!ds.length || ds.some(x => x.i > 0 && x.c <= x.s * x.i)) return '';
    const serie = [sum(ds, x => x.s)], fines = [];
    let m = 0;
    while (serie[m] > 0.5 && m < 360) {
      m++;
      for (const x of ds) if (x.s > 0) { x.s = Math.max(0, x.s * (1 + x.i) - x.c); if (x.s <= 0.5) { x.s = 0; fines.push({ n: x.n, m }); } }
      serie.push(sum(ds, x => x.s));
    }
    if (m < 1) return '';
    const W = 340, H = 170, x0 = 10, x1 = W - 10, top = 16, base = 132;
    const X = k => x0 + k / m * (x1 - x0), Y = v => base - v / serie[0] * (base - top);
    const linea = serie.map((v, k) => (k ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
    const mesHoy = mesDe(hoy()), finTxt = nombreMes(sumarMes(mesHoy, m), { month: 'short', year: 'numeric' }).replace('.', '');
    return `<section class="card"><h3>Camino a cero deudas <span class="sub">${mesesTxt(m)}</span></h3>
      <svg class="curva" viewBox="0 0 ${W} ${H}" role="img" aria-label="Si siguen pagando las cuotas, el total de deudas baja de ${pesos(serie[0])} a $0 en ${esc(finTxt)}">
        <defs><linearGradient id="gCurva" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--deuda)" stop-opacity=".45"/><stop offset="1" stop-color="var(--deuda)" stop-opacity="0"/></linearGradient></defs>
        <line x1="${x0}" x2="${x1}" y1="${base}" y2="${base}" stroke="var(--line)"/>
        <path d="${linea} L${X(m).toFixed(1)} ${base} L${x0} ${base} Z" fill="url(#gCurva)"/>
        <path class="linea" d="${linea}" fill="none" stroke="var(--deuda)" stroke-width="3" stroke-linejoin="round" pathLength="1"/>
        ${fines.slice(0, -1).map(f => `<circle cx="${X(f.m).toFixed(1)}" cy="${Y(serie[f.m]).toFixed(1)}" r="5" fill="var(--ambar-logo)" stroke="var(--surface)" stroke-width="2"><title>Terminan ${esc(f.n)} en ${esc(nombreMes(sumarMes(mesHoy, f.m)))}</title></circle>`).join('')}
        <circle cx="${X(m).toFixed(1)}" cy="${base}" r="6" fill="var(--verde)" stroke="var(--surface)" stroke-width="2"/>
        <text x="${x0}" y="${H - 14}" font-size="11" style="fill:var(--muted)">Hoy · ${esc(corto(serie[0]))}</text>
        <text x="${x1}" y="${H - 14}" font-size="11" text-anchor="end" style="fill:var(--verde);font-weight:700">$0 · ${esc(finTxt)}</text>
      </svg>
      ${fines.length > 1 ? `<div class="ley-g"><span><i style="background:var(--ambar-logo);border-radius:50%"></i>Cada punto: terminan una deuda y esa cuota queda libre</span></div>` : ''}
      <small class="aviso-legal">${esc(AVISO_ESTIMADO)} ${esc(L.noAsesoria)}</small></section>`;
  }
  function anilloMeta(m, st) {
    const R = 50, Lc = 2 * Math.PI * R, id = 'gm' + String(m.id).replace(/[^a-zA-Z0-9]/g, '');
    const p = st.pct;
    const hitos = [25, 50, 75].map(h => { const a = (h * 3.6 - 90) * Math.PI / 180; return `<circle cx="${(60 + R * Math.cos(a)).toFixed(1)}" cy="${(60 + R * Math.sin(a)).toFixed(1)}" r="4.2" class="hito ${p * 100 >= h ? 'on' : ''}"/>`; }).join('');
    return `<svg class="ring grande" viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--azul)"/><stop offset="1" stop-color="var(--verde)"/></linearGradient></defs>
      <circle class="bg" cx="60" cy="60" r="${R}"/><circle class="fg" cx="60" cy="60" r="${R}" style="stroke:url(#${id})" stroke-dasharray="${(p * Lc).toFixed(1)} ${Lc.toFixed(1)}"/>${hitos}
      <text x="60" y="66" text-anchor="middle">${Math.round(p * 100)}%</text></svg>`;
  }

  function vacio(t, d, ilus = 'sin-movimientos') { const svg = RECS.ilus[ilus]; return `<div class="empty">${svg ? `<div class="ilus">${svg}</div>` : ICON.receipt}<b>${esc(t)}</b>${esc(d)}</div>`; }

  const oculto = x => x.privado && S.modo === 'nube' && x.tipo !== yo();
  const descDe = x => oculto(x) ? 'Gasto discreto de ' + nom(x.tipo) : (x.desc || (CAT[x.categoria]?.n ?? 'Gasto'));
  const catDe = x => CAT[x.categoria] || (x.categoria === 'ajuste' ? { id: 'ajuste', n: 'Saldar cuentas', c: '#8C8399' } : CAT.otros);
  // Solo la otra persona puede decir «Ya lo hablamos» (en un solo celular, cualquiera).
  const marcoHablar = x => x.revisarPor || x.por || 'a';
  const puedeHablar = x => S.modo !== 'nube' || marcoHablar(x) !== yo();
  function filaHablar(x) {
    return `<div class="pago-row"><span class="ico" style="background:var(--${x.pagadoPor === 'b' ? 'verde' : 'azul'})">${esc(ini(x.pagadoPor))}</span>
      <button class="t sin-btn" data-act="verGasto" data-id="${esc(x.id)}"><b>${esc(descDe(x))} · ${pesos(x.monto)}</b><small>${x.nota ? '«' + esc(x.nota) + '»' : esc(nombreDia(x.fecha))}${S.modo === 'nube' ? ' · lo marcó ' + esc(marcoHablar(x) === yo() ? 'tú' : nom(marcoHablar(x))) : ''}</small></button>
      ${puedeHablar(x) ? `<button class="btn ghost" data-act="hablado" data-id="${esc(x.id)}">Ya lo hablamos</button>` : `<span class="pill azul espera">Esperando a ${esc(nom(otro(yo())))}</span>`}</div>`;
  }
  function itemGasto(x, i) {
    const k = catDe(x);
    const de = x.tipo === 'compartido' ? 'Compartido' : 'De ' + nom(x.tipo);
    return `<div class="item-wrap" style="--i:${i}" data-id="${esc(x.id)}"><button class="item" data-act="verGasto" data-id="${esc(x.id)}">
      ${icoCat(k)}
      <span class="t"><b>${x.revisar ? `<span class="flag" title="Para hablar juntos">${ICON.chat}</span>` : ''}${x.privado ? `<span class="flag" title="Discreto">${ICON.ojoNo}</span>` : ''}${x.fijoId ? `<span class="flag" title="Gasto fijo">${ICON.repeat}</span>` : ''}${x.metaId ? `<span class="flag" title="Pagado con ahorro de una meta">${ICON.piggy}</span>` : ''}${esc(descDe(x))}</b><small><span class="dot ${esc(x.pagadoPor)}"></span>Pagó ${esc(nom(x.pagadoPor))} · ${esc(de)}</small>${x.nota && !oculto(x) ? `<small class="nota">«${esc(x.nota)}»</small>` : ''}</span>
      <span class="m">${pesos(x.monto)}<small class="muted">${esc(k.n)}</small></span></button>
      <button class="item-mas" data-act="verGasto" data-id="${esc(x.id)}" aria-label="Editar o eliminar ${esc(descDe(x))}">${ICON.dots}</button></div>`;
  }
  function listaGastos() {
    const f = S.filtro, q = normalizarTxt(S.buscar || '');
    let lista = q ? S.gastos.slice() : S.gastos.filter(x => mesDe(x.fecha) === S.mes);
    if (f === 'compartido') lista = lista.filter(x => x.tipo === 'compartido');
    else if (f === 'a' || f === 'b') lista = lista.filter(x => x.tipo === f);
    if (q) lista = lista.filter(x => normalizarTxt([descDe(x), oculto(x) ? '' : x.nota, CAT[x.categoria]?.n, nom(x.pagadoPor), String(x.monto)].join(' ')).includes(q));
    lista.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || (b.creado || 0) - (a.creado || 0));
    const porDia = {}; lista.slice(0, 300).forEach(x => (porDia[x.fecha] = porDia[x.fecha] || []).push(x));
    let i = 0;
    const html = Object.entries(porDia).map(([d, xs]) => `<div class="day">${esc(nombreDia(d))}${q ? ' ' + esc(d.slice(0, 4)) : ''} · ${pesos(sum(xs))}</div>` + xs.map(x => itemGasto(x, i++)).join('')).join('');
    return html || (q ? vacio('Nada coincide', 'Prueben con otra palabra, un valor o el nombre de una categoría.', 'sin-resultados') : vacio('Sin gastos aquí', 'Escanea una factura o toca + para anotar uno.', 'sin-movimientos'));
  }
  const normalizarTxt = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  function vistaGastos() {
    const c = calcular(S.mes);
    const f = S.filtro;
    const html = listaGastos();
    const fijos = S.fijos.filter(x => x.activo !== false).sort((a, b) => (!!estadoFijo(a, S.mes).pago - !!estadoFijo(b, S.mes).pago) || (a.dia || 99) - (b.dia || 99));
    const totFijos = sum(fijos, x => totalFijoMes(x, S.mes)), pendFijos = fijos.filter(x => !estadoFijo(x, S.mes).pago);
    const subs = fijos.filter(x => x.suscripcion);
    const extras = c.extras.sort((a, b) => b.fecha.localeCompare(a.fecha));
    const chip = (v, t) => `<button class="chip" data-act="filtro" data-f="${v}" aria-pressed="${f === v}">${esc(t)}</button>`;
    return `
      <div class="card" style="padding:14px 18px"><div class="row" style="align-items:center">
        <div><div class="eyebrow">Gastado en el mes</div><div style="font:800 28px var(--f-display)" class="num" data-num="${Math.round(c.gastado)}" data-k="gmes">${pesos(c.gastado)}</div></div>
        <div style="display:flex;gap:8px;flex:none"><button class="btn soft icon-only" data-act="dictar" aria-label="Dictar gasto">${ICON.mic}</button><button class="btn" data-act="escanear">${ICON.cam} Escanear</button></div></div></div>
      <section class="card">
        <h3>${ICON.repeat.replace('<svg', '<svg style="width:18px;height:18px;color:var(--azul)"')} Gastos fijos del mes <span class="sub">${fijos.length ? (pendFijos.length ? pendFijos.length + ' pendiente' + (pendFijos.length === 1 ? '' : 's') : 'todos pagados') : ''}</span></h3>
        ${fijos.length ? `<div class="muted" style="font-size:13px;margin:-6px 0 12px">Suman ${pesos(totFijos)} al mes${c.fijosPend > 0 ? ` · faltan ${pesos(c.fijosPend)} por pagar` : ''}${subs.length ? ` · ${subs.length} suscripcion${subs.length === 1 ? '' : 'es'}: ${pesos(sum(subs))} al mes, ${pesos(sum(subs) * 12)} al año` : ''}</div>
          <div class="stagger" style="display:grid;gap:10px">${fijos.map((x, i) => filaFijo(x, i)).join('')}</div>`
          : `<div class="empty compacto"><div class="ilus">${RECS.ilus['sin-fijos'] || ''}</div>Arriendo, servicios, internet, Netflix… anótenlos una vez y cada mes los pagan completos o por partes.</div>`}
        <button class="btn soft full" style="margin-top:12px" data-act="nuevoFijo">Agregar gasto fijo o suscripción</button>
      </section>
      <label class="buscar" for="buscar">${ICON.search}<input id="buscar" class="input" type="search" placeholder="Buscar en todos los gastos" value="${esc(S.buscar || '')}" autocomplete="off"></label>
      <div class="chips" role="group" aria-label="Filtrar">${chip('todos', 'Todos')}${chip('compartido', 'Compartidos')}${chip('a', 'De ' + nom('a'))}${chip('b', 'De ' + nom('b'))}</div>
      <div class="list stagger" id="listaG">${html}</div>
      ${c.aportesMes.length || c.ahorroCat ? `<section class="card ahorro-mes"><h3>${ICON.piggy.replace('<svg', '<svg style="width:18px;height:18px;color:var(--ok)"')} Ahorro del mes <span class="sub">no es gasto · ${pesos(c.ahorro)}</span></h3>
        <div class="list">${c.aportesMes.slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).map(x => `<button class="item" data-act="editarAporte" data-id="${esc(x.id)}"><span class="ico" style="background:var(--ok)">${ICON.piggy}</span><span class="t"><b>${esc(S.metas.find(m => m.id === x.metaId)?.nombre || 'Meta')}</b><small>${esc(nom(x.quien))} · ${esc(nombreDia(x.fecha))}</small></span><span class="m" style="color:var(--ok)">${pesos(x.monto)}</span></button>`).join('')}</div>
        ${c.ahorroCat ? `<p class="muted" style="font-size:12px;margin:8px 0 0">Incluye ${pesos(c.ahorroCat)} de categorías del grupo «Ahorro e inversión».</p>` : ''}</section>` : ''}
      ${extras.length ? `<section class="card"><h3>Ingresos extra del mes</h3><div class="list">${extras.map(x => `<button class="item" data-act="editarIngreso" data-id="${esc(x.id)}"><span class="ico" style="background:var(--ok)">${ICON.up}</span><span class="t"><b>${esc(x.desc || 'Ingreso extra')}</b><small>${esc(nom(x.quien))} · ${esc(nombreDia(x.fecha))}</small></span><span class="m" style="color:var(--ok)">+${pesos(x.monto)}</span></button>`).join('')}</div></section>` : ''}`;
  }

  function anillo(p, txt) {
    const R = 26, L = 2 * Math.PI * R;
    return `<svg class="ring" viewBox="0 0 64 64" aria-hidden="true"><circle class="bg" cx="32" cy="32" r="${R}"/><circle class="fg" cx="32" cy="32" r="${R}" stroke-dasharray="${p * L} ${L}"/><text x="32" y="37" text-anchor="middle">${txt}</text></svg>`;
  }
  function vistaDeudas() {
    const ds = S.deudas.map(d => ({ d, st: estadoDeuda(d) }));
    const activas = ds.filter(x => x.st.saldo > 0);
    const totalSaldo = sum(activas, x => x.st.saldo), totalCuota = sum(activas, x => x.d.cuota);
    const parteA = sum(activas, x => parteCuota(x.d, 'a')), parteB = sum(activas, x => parteCuota(x.d, 'b'));
    const bola = [...activas].sort((a, b) => a.st.saldo - b.st.saldo)[0];
    const aval = [...activas].filter(x => x.st.i > 0).sort((a, b) => b.st.i - a.st.i)[0];
    const ultimaFin = activas.map(x => x.st.fin).filter(Boolean).sort().pop();
    const proximos = activas.filter(x => x.st.dias != null).sort((a, b) => (a.st.alDia - b.st.alDia) || a.st.dias - b.st.dias);

    const tarjetas = ds.sort((a, b) => (b.st.saldo > 0) - (a.st.saldo > 0) || (a.st.dias ?? 99) - (b.st.dias ?? 99)).map(({ d, st }, i) => {
      const resp = d.responsable || 'ambos';
      const tipo = TIPOS_DEUDA[d.tipo] || 'Deuda';
      let faltan = '—';
      if (st.saldo <= 0) faltan = 'Nada';
      else if (st.proy?.nunca) faltan = 'No termina';
      else if (st.proy) faltan = mesesTxt(st.proy.meses);
      let notas = '';
      if (st.saldo > 0 && st.proy?.nunca) notas += `<div class="verdict bad" style="margin:0">La cuota no alcanza para los intereses: la deuda crece cada mes.<small>Necesitan pagar más de ${pesos(st.saldo * st.i)} al mes para que empiece a bajar.</small></div>`;
      if (st.saldo > 0 && st.i > 0 && st.proy && !st.proy.nunca && st.proy.meses > 2) {
        const extra = Math.max(20000, Math.round((d.cuota || 0) * .25 / 10000) * 10000);
        const alt = simular(st.saldo, st.i, (d.cuota || 0) + extra);
        if (alt && !alt.nunca && alt.meses < st.proy.meses) notas += `<div class="tip">${ICON.spark}<span>Si abonan ${pesos(extra)} más al mes, terminan <b>${mesesTxt(st.proy.meses - alt.meses)} antes</b> y se ahorran ${pesos(st.proy.intereses - alt.intereses)} en intereses.</span></div>`;
      }
      if (d.tipo === 'tarjeta' && d.cupo) {
        const u = st.saldo / d.cupo;
        notas += `<div class="bar-row"><div class="lbl"><span>Usan el ${Math.round(u * 100)}% del cupo de ${corto(d.cupo)}</span><span class="num muted">disponible ${corto(Math.max(0, d.cupo - st.saldo))}</span></div><div class="track"><div style="width:${Math.min(100, u * 100)}%;background:${u > .7 ? 'var(--bad)' : u > .3 ? 'var(--warn)' : 'var(--ok)'}"></div></div></div>`;
      }
      const conjunta = resp === 'ambos' && d.cuota && st.saldo > 0
        ? `<div class="split" style="margin:0"><div class="who"><small><span class="dot a"></span>A ${esc(nom('a'))} le toca</small><b class="num">${pesos(parteCuota(d, 'a'))}</b><small>pagado en total ${corto(st.porA)}</small></div><div class="who"><small><span class="dot b"></span>A ${esc(nom('b'))} le toca</small><b class="num">${pesos(parteCuota(d, 'b'))}</b><small>pagado en total ${corto(st.porB)}</small></div></div>`
        : `<div class="muted" style="font-size:13px"><span class="dot a"></span>${esc(nom('a'))} ha pagado ${pesos(st.porA)} · <span class="dot b"></span>${esc(nom('b'))} ${pesos(st.porB)}</div>`;
      return `<section class="card debt" style="--i:${i}">
        <div class="head"><div style="min-width:0">
          <div class="eyebrow"><span class="mini-ico" aria-hidden="true">${ICON_DEUDA(d.tipo)}</span>${esc(tipo)}</div>
          <b>${esc(d.nombre)}</b>
          <div class="muted" style="font-size:13px">${bancoDe(d) ? esc(bancoDe(d)) + ' · ' : ''}<span class="dot ${esc(resp)}"></span>${esc(resp === 'ambos' ? 'Conjunta' : 'De ' + nom(resp))}${d.dia ? ' · paga el día ' + esc(d.dia) : ''}</div>
          <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">${chipVence(st)}${bola && bola.d.id === d.id && activas.length > 1 ? '<span class="pill azul">Liquidar primero</span>' : ''}</div></div>
          ${anillo(st.pct, Math.round(st.pct * 100) + '%')}</div>
        <div class="nums">
          <div><small>Deben hoy</small><b>${corto(st.saldo)}</b></div>
          <div><small>${d.tipo === 'tarjeta' ? 'Pago mínimo' : 'Cuota'}</small><b>${corto(d.cuota || 0)}</b></div>
          <div><small>Faltan</small><b>${faltan}</b></div>
          <div><small>Termina</small><b>${st.saldo <= 0 ? '¡Listo!' : st.fin ? esc(nombreMes(st.fin, { month: 'short', year: 'numeric' }).replace('.', '')) : '—'}</b></div>
          <div><small>Intereses por pagar</small><b>${st.proy && !st.proy.nunca && st.i > 0 ? corto(st.proy.intereses) : st.i > 0 ? '∞' : '$0'}</b></div>
          <div><small>${d.plazo ? 'Cuotas pagadas' : 'Tasa'}</small><b>${d.plazo ? esc(Math.min(st.numCuota, d.plazo) + ' de ' + d.plazo) : d.tasa ? esc(d.tasa) + '% ' + (d.tasaTipo === 'mv' ? 'M.V.' : 'E.A.') : 'Sin tasa'}</b></div>
        </div>
        ${st.saldo > 0 && st.i > 0 ? `<small class="aviso-legal" style="margin-top:-4px">${esc(AVISO_ESTIMADO)}</small>` : ''}
        ${notas}${conjunta}
        <div class="row">${st.saldo > 0 ? `<button class="btn" data-act="pagarDeuda" data-id="${esc(d.id)}">Pagar</button>` : ''}<button class="btn ghost" data-act="verDeuda" data-id="${esc(d.id)}">Pagos y saldo</button></div>
      </section>`;
    }).join('');
    return `
      <section class="hero">
        <div class="eyebrow">Lo que deben hoy entre todas las deudas</div>
        <div class="big num" data-num="${Math.round(totalSaldo)}" data-k="deuda">${pesos(totalSaldo)}</div>
        <div class="nota">${activas.length ? (ultimaFin ? `Si siguen pagando las cuotas, quedan libres de deudas en ${esc(nombreMes(ultimaFin))}.` : 'Agreguen la cuota de cada deuda para calcular cuándo terminan.') : 'Sin deudas activas.'}</div>
        <div class="stats">
          <div class="stat"><span>Cuotas al mes</span><b class="num">${corto(totalCuota)}</b></div>
          <div class="stat"><span>Le toca a ${esc(nom('a'))}</span><b class="num">${corto(parteA)}</b></div>
          <div class="stat"><span>Le toca a ${esc(nom('b'))}</span><b class="num">${corto(parteB)}</b></div>
        </div>
      </section>
      ${proximos.length ? `<section class="card"><h3>Calendario de pagos <span class="sub">${esc(nombreMes(mesDe(hoy()), { month: 'long' }))}</span></h3><div class="stagger" style="display:grid;gap:10px">${proximos.map((x, i) => filaPago(x.d, x.st, i)).join('')}</div></section>` : ''}
      ${curvaDeudas(activas)}
      ${activas.length > 1 ? `<section class="card idea"><span class="ico">${ICON.snow}</span><div><b>Estrategia sugerida</b><p>${aval && aval.d.tasa && (aval.d.tasaTipo === 'mv' ? aval.d.tasa * 12 : aval.d.tasa) >= 20 ? `Abonen lo extra primero a «${esc(aval.d.nombre)}»: tiene la tasa más alta y es la que más intereses les cobra. En las demás paguen solo la cuota.` : `Método bola de nieve: paguen la cuota de todas y abonen lo extra a «${esc(bola.d.nombre)}», la más pequeña. Cuando la terminen, esa cuota se suma a la siguiente.`}</p>${notaLegal()}</div></section>` : ''}
      <div class="stagger" style="display:grid;gap:14px">${tarjetas || `<section class="card">${vacio('Sin deudas registradas', 'Agreguen tarjetas, créditos o préstamos: banco, cuota, día de pago y si es de uno o de los dos.', 'sin-deudas')}</section>`}</div>
      <button class="btn soft full" data-act="nuevaDeuda">Agregar una deuda o tarjeta</button>`;
  }

  const PLANES = [
    { t: 'Atardecer con café', c: 12000, d: 'Un mirador, un termo de café y buena conversación.' },
    { t: 'Ciclovía y jugo', c: 15000, d: 'Recorran la ciclovía el domingo y terminen con un jugo en la plaza.' },
    { t: 'Museo o exposición', c: 15000, d: 'Muchos museos tienen entrada libre ciertos días; solo pagan transporte.' },
    { t: 'Juegos de mesa con amigos', c: 20000, d: 'Cada pareja lleva un snack; ustedes ponen el juego.' },
    { t: 'Noche de cine en casa', c: 25000, d: 'Crispetas, una película elegida por turnos y luces apagadas.' },
    { t: 'Picnic en el parque', c: 30000, d: 'Comida hecha en casa, una manta y la tarde libre.' },
    { t: 'Cocinar algo nuevo juntos', c: 45000, d: 'Elijan una receta de otro país y hagan el mercado juntos.' },
    { t: 'Cine entre semana', c: 60000, d: 'Las boletas de martes y miércoles suelen salir más baratas.' },
    { t: 'Clase de baile o cerámica', c: 90000, d: 'Una experiencia nueva para los dos; busquen clases de prueba.' },
    { t: 'Cena en un sitio nuevo', c: 120000, d: 'Fijen el presupuesto antes de pedir y compartan postre.' },
    { t: 'Escapada de un día', c: 200000, d: 'Un pueblo cercano en bus, almuerzo típico y regreso en la tarde.' },
    { t: 'Fin de semana fuera', c: 450000, d: 'Busquen hospedaje con cocina para no comer fuera todas las veces.' }
  ];
  function vistaPlanes() {
    const c = calcular(S.mes);
    const ant = calcular(sumarMes(S.mes, -1));
    const divRest = c.presDiv ? c.presDiv - c.divGastado : Math.max(0, c.libreReal * .3);
    const tope = Math.max(0, divRest);
    const alcanzan = PLANES.filter(p => p.c <= Math.max(tope, 15000));
    const semilla = Number(S.mes.replace('-', ''));
    const elegidos = alcanzan.length > 4 ? [0, 1, 2, 3].map(i => alcanzan[(semilla + i * 3) % alcanzan.length]).filter((v, i, a) => a.indexOf(v) === i) : alcanzan;
    const ideas = [];
    const tasa = c.ingresos ? c.ahorro / c.ingresos : 0;
    const meta = (S.cfg.metaAhorroPct || 0) / 100;
    if (c.ingresos) ideas.push({ i: ICON.piggy, t: tasa >= meta ? '¡Van cumpliendo su meta de ahorro!' : `Les falta ${pesos(c.metaAhorro - c.ahorro)} para la meta de ahorro`, d: tasa >= meta ? `Llevan ${Math.round(tasa * 100)}% ahorrado este mes. Lo que sobre al final pueden pasarlo a su meta más cercana.` : `Llevan ${Math.round(tasa * 100)}% de ${Math.round(meta * 100)}%. Aparten el ahorro apenas llegue el sueldo, antes de gastar.` });
    let peor = null;
    for (const k of Object.keys(c.porCat)) {
      if (k === 'deudas') continue;
      const a = ant.porCat[k] || 0, n = c.porCat[k];
      if (a > 0 && n > a * 1.15 && n - a > 20000 && (!peor || n - a > peor.dif)) peor = { k, dif: n - a, pct: Math.round((n / a - 1) * 100) };
    }
    if (peor) ideas.push({ i: ICON.trend, t: `${CAT[peor.k]?.n || peor.k} subió ${peor.pct}%`, d: `Van ${pesos(peor.dif)} más que el mes pasado. Si vuelven al nivel anterior, en un año ahorran ${pesos(peor.dif * 12)}.` });
    if ((c.porCat.comida || 0) > 50000) { const sem = c.porCat.comida / 4.3; ideas.push({ i: ICON.spark, t: 'Reto: una semana sin domicilios', d: `Gastan cerca de ${pesos(sem)} por semana comiendo fuera. Una semana cocinando en casa puede liberar ${pesos(sem * .7)} para su plan favorito.` }); }
    const subsP = S.fijos.filter(x => x.suscripcion && x.activo !== false);
    if (subsP.length) ideas.push({ i: ICON.repeat, t: `Sus ${subsP.length} suscripcion${subsP.length === 1 ? '' : 'es'} cuestan ${pesos(sum(subsP) * 12)} al año`, d: `Revisen cuáles usaron este mes. Cancelar la que menos usan (${esc(subsP.slice().sort((a, b) => b.monto - a.monto)[0].nombre)} es la más cara) libera plata para su meta.` });
    if (c.libreReal > 0) ideas.push({ i: ICON.target, t: 'Si guardan lo que sobra', d: `Pasar los ${pesos(c.libreReal)} libres de este mes a una meta, cada mes, suma ${pesos(c.libreReal * 12)} en un año.` });
    else if (c.ingresos) ideas.push({ i: ICON.target, t: 'Este mes van justos', d: 'Prioricen planes gratis y revisen la categoría que más creció. La meta de ahorro va primero.' });

    const metas = metasActivas().map(m => ({ m, st: estadoMeta(m) }));
    const archivadas = S.metas.filter(m => m.estado === 'archivada');
    const citaMes = S.citas.find(x => (x.mes || x.id) === S.mes && x.hecho);
    const racha = rachaCitas();
    const xp = calcXP(), nv = nivelDe(xp), rd = rachaDiaria();
    return `
      <section class="card nivel-card">
        <div class="nivel-top"><span class="nivel-n" aria-hidden="true">${nv.n}</span><div><div class="eyebrow">Nivel ${nv.n}</div><b>${esc(nv.nombre)}</b>
          <div class="muted" style="font-size:13px">${xp} XP · faltan ${nv.sig - xp} XP para el nivel ${nv.n + 1}</div></div>
          <button class="btn soft" data-act="logros">Ver logros</button></div>
        <div class="track"><div style="width:${Math.round(nv.prog * 100)}%;background:linear-gradient(90deg,var(--azul),var(--verde))"></div></div>
        <div class="rachas"><span>${ICON.fuego}<b>${rd}</b> día${rd === 1 ? '' : 's'} registrando</span><span>${ICON.cup}<b>${racha}</b> cita${racha === 1 ? '' : 's'} seguidas</span></div>
        ${vistaRetoCard()}
      </section>

      <section class="card cita-card">
        <div class="idea"><span class="ico" style="background:var(--verde-soft);color:var(--verde)">${ICON.cup}</span><div>
          <b>Cita de dinero de ${esc(nombreMes(S.mes, { month: 'long' }))}</b>
          <p>${citaMes ? 'Ya la hicieron. ' + (citaMes.acuerdos ? 'Acuerdos: «' + esc(citaMes.acuerdos.slice(0, 120)) + (citaMes.acuerdos.length > 120 ? '…' : '') + '»' : '') : 'Un resumen del mes y cuatro preguntas para revisar juntos en 15 minutos.'}</p>
          ${racha ? `<span class="pill azul" style="margin-top:6px">Racha: ${racha} mes${racha === 1 ? '' : 'es'} seguidos</span>` : ''}</div></div>
        <button class="btn ${citaMes ? 'ghost' : ''} full" style="margin-top:12px" data-act="cita">${citaMes ? 'Ver resumen y acuerdos' : 'Empezar nuestra cita'}</button>
      </section>

      <section class="card">
        <h3>${ICON.heart.replace('<svg', '<svg style="width:18px;height:18px;color:var(--verde)"')} ¿Nos lo podemos permitir?</h3>
        <form data-form="permitir" class="row" style="display:flex;gap:10px">
          <label for="pmonto" class="muted" style="position:absolute;left:-9999px">Valor del plan o compra</label>
          <input id="pmonto" class="input money" inputmode="numeric" placeholder="$0" style="font-size:20px;flex:2;min-width:0" required>
          <button class="btn" style="flex:1">Calcular</button>
        </form>
        <div id="veredicto"></div>
      </section>

      <section class="card">
        <h3>Planes que les alcanzan <span class="sub">${c.presDiv ? 'quedan ' + corto(Math.max(0, divRest)) + ' para diversión' : 'según su margen libre'}</span></h3>
        <div class="stagger" style="display:grid;gap:14px">${elegidos.map((p, i) => `<div class="idea" style="--i:${i}"><span class="ico">${ICON.heart}</span><div><b>${esc(p.t)} · ${corto(p.c)}</b><p>${esc(p.d)}</p></div></div>`).join('')}</div>
      </section>

      <section class="card">
        <h3>Consejos para que crezcan los ahorros</h3>
        <div class="stagger" style="display:grid;gap:14px">${ideas.map((x, i) => `<div class="idea" style="--i:${i}"><span class="ico">${x.i}</span><div><b>${esc(x.t)}</b><p>${esc(x.d)}</p></div></div>`).join('') || '<p class="muted">Registren ingresos y gastos para ver consejos.</p>'}</div>
        ${ideas.length ? notaLegal() : ''}
      </section>

      <h2 style="font:800 20px var(--f-display);margin:8px 4px 0">Metas de ahorro</h2>
      <div class="stagger" style="display:grid;gap:14px">${metas.map(({ m, st }, i) => `<section class="card debt meta" style="--i:${i}">
        <div class="head"><div style="min-width:0"><b>${esc(m.nombre)}</b><div class="muted" style="font-size:13px">${pesos(st.ahorrado)} de ${pesos(m.objetivo)}${st.usado ? ` · usaron ${pesos(st.usado)}` : ''}</div>
          <div class="hitos-pills">${[25, 50, 75, 100].map(h => `<span class="pill ${st.pct * 100 >= h ? 'ok' : 'apagada'}">${h}%</span>`).join('')}</div>
          <div class="muted" style="font-size:13px;margin-top:6px">${st.estado === 'usada' ? '<span class="pill ok">¡La disfrutaron!</span>' : st.falta <= 0 ? '<span class="pill ok">¡Meta cumplida!</span>' : st.eta ? 'A este ritmo la logran en ' + esc(nombreMes(st.eta)) : 'Hagan el primer aporte'}</div></div>${anilloMeta(m, st)}</div>
        ${st.falta > 0 ? `<div class="meta-plan">${st.atrasado ? `<div class="tip warn">${ICON.trend}<span>Van atrasados: aporten <b>${pesos(st.atrasado)}</b> este mes para ponerse al día.</span></div>` : st.adelantado ? `<div class="tip">${ICON.target}<span>Van adelantados. ¡Sigan así!</span></div>` : ''}
          <div class="muted" style="font-size:13px">Aporte sugerido: <b style="color:var(--ink)">${pesos(st.sugerido)}</b> al mes${m.fechaLimite ? ` para ${esc(nombreMes(mesDe(m.fechaLimite)))}` : ''} · a ${esc(nom('a'))} le toca ${pesos(Math.round(st.sugerido * ratioA() / 1000) * 1000)} y a ${esc(nom('b'))} ${pesos(st.sugerido - Math.round(st.sugerido * ratioA() / 1000) * 1000)}</div></div>` : ''}
        <div class="muted" style="font-size:13px"><span class="dot a"></span>${esc(nom('a'))} ${pesos(st.porA)} · <span class="dot b"></span>${esc(nom('b'))} ${pesos(st.porB)}</div>
        <div class="row">${st.estado === 'usada' || st.falta <= 0 ? `<button class="btn soft" data-act="archivarMeta" data-id="${esc(m.id)}">Archivar meta</button>` : `<button class="btn" data-act="aportar" data-id="${esc(m.id)}">Aportar</button>`}<button class="btn ghost" data-act="editarMeta" data-id="${esc(m.id)}">Editar</button></div>
      </section>`).join('') || `<section class="card">${vacio('Sin metas todavía', 'Un viaje, un fondo de emergencia, la cuota inicial… pónganle nombre y valor.', 'sin-metas')}</section>`}</div>
      ${archivadas.length ? `<details class="card archivadas"><summary>Metas archivadas (${archivadas.length})</summary><div class="list" style="margin-top:10px">${archivadas.map(m => `<div class="pago-row"><span class="ico" style="background:var(--surface-2);color:var(--muted)">${ICON.piggy}</span><div class="t"><b>${esc(m.nombre)}</b><small>${pesos(estadoMeta(m).aportado)} aportados · sus aportes se conservan</small></div><button class="btn ghost" data-act="restaurarMeta" data-id="${esc(m.id)}">Restaurar</button></div>`).join('')}</div></details>` : ''}
      <button class="btn soft full" data-act="nuevaMeta">Crear una meta</button>`;
  }
  const mesesEntre = (a, b) => { const [y1, m1] = a.split('-').map(Number), [y2, m2] = b.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1); };

  function veredicto(monto) { const v = veredictoBase(monto); return v ? v + notaLegal() : ''; }
  function veredictoBase(monto) {
    const c = calcular(mesDe(hoy()));
    const divRest = c.presDiv ? c.presDiv - c.divGastado : null;
    const libre = c.libreReal;
    if (monto <= 0) return '';
    if (divRest != null && monto <= divRest && monto <= libre - (c.programado || 0)) return `<div class="verdict ok">Sí, se lo pueden dar.<small>Les quedarían ${pesos(divRest - monto)} para diversión y la meta de ahorro sigue intacta.</small></div>`;
    const prog = c.programado || 0;
    if (monto <= libre && monto > libre - prog) return `<div class="verdict warn">Hoy alcanza, pero tienen ${pesos(prog)} programado por pagar.<small>Si lo compran y luego pagan fijos, cuotas y ahorro del mes, ${libre - prog - monto >= 0 ? 'les quedarían ' + pesos(libre - prog - monto) : 'les faltarían ' + pesos(monto - (libre - prog))}. Revisen qué falta pagar antes de decidir.</small></div>`;
    if (divRest == null && monto <= libre) return `<div class="verdict ok">Sí, alcanza.<small>Les quedarían ${pesos(libre - monto)} libres, y aun así cubren lo que tienen programado por pagar.</small></div>`;
    if (monto <= libre) return `<div class="verdict warn">Alcanza, pero se pasan del presupuesto de diversión.<small>Excede el tope por ${pesos(monto - Math.max(0, divRest))}. Sale del margen libre (${pesos(libre)}); su ahorro no se toca.</small></div>`;
    const falta = monto - Math.max(0, libre);
    const semanal = Math.max(20000, Math.round((c.ingresos * .05 / 4.3) / 1000) * 1000);
    const semanas = Math.ceil(falta / semanal);
    return `<div class="verdict bad">Mejor esperar un poco.<small>Hoy les faltan ${pesos(falta)} sin tocar el ahorro. Si apartan ${pesos(semanal)} por semana, lo tienen en ${semanas} semana${semanas === 1 ? '' : 's'}. ¿Y si lo vuelven meta?</small></div>`;
  }

  /* ---------- Gastos fijos y suscripciones ---------- */
  const totalFijoMes = (f, mes) => (f.montosMes && f.montosMes[mes] != null) ? f.montosMes[mes] : (f.monto || 0);
  function estadoFijo(f, mes) {
    const pagos = S.gastos.filter(x => x.fijoId === f.id && mesDe(x.fecha) === mes).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.creado || 0) - (b.creado || 0));
    const total = totalFijoMes(f, mes), pagado = sum(pagos);
    const saltado = (f.saltos || []).includes(mes);
    const actual = mes === mesDe(hoy());
    const fecha = f.dia ? diaEn(mes, f.dia) : null;
    const futuro = mes > mesDe(hoy()), pasado = mes < mesDe(hoy());
    const dias = (actual || futuro) && fecha ? diasEntre(hoy(), fecha) : null;
    // Pagado solo cuando lo abonado completa el total del mes (0,5% de tolerancia por redondeos).
    const completo = total > 0 ? pagado >= total * .995 : pagos.length > 0;
    const estado = saltado ? 'saltado' : completo ? 'pagado' : pagado > 0 ? 'parcial' : (pasado || (dias != null && dias < 0)) ? 'vencido' : 'pendiente';
    const pendiente = saltado || completo ? 0 : Math.max(0, total - pagado);
    const pago = saltado ? { saltado: true, fecha: fecha || diaEn(mes, 1) } : completo ? pagos[pagos.length - 1] : null;
    return { pagos, total, pagado, pendiente, estado, saltado, pago, fecha, actual, dias, pasado };
  }
  function chipFijo(st) {
    if (st.saltado) return '<span class="pill azul">No aplica este mes</span>';
    if (st.estado === 'pagado') return `<span class="pill ok">Pagado ${st.pago?.fecha ? fechaCorta(st.pago.fecha) : ''}</span>`;
    if (st.estado === 'parcial') return `<span class="pill ${st.dias != null && st.dias < 0 || st.pasado ? 'bad' : 'warn'}">Parcial · faltan ${corto(st.pendiente)}</span>`;
    if (st.pasado) return '<span class="pill bad">No se registró</span>';
    if (st.dias == null) return st.fecha ? `<span class="pill azul">El ${fechaCorta(st.fecha)}</span>` : '<span class="pill azul">Pendiente</span>';
    if (st.dias < 0) return `<span class="pill bad">Vencido hace ${-st.dias} día${st.dias === -1 ? '' : 's'}</span>`;
    if (st.dias === 0) return '<span class="pill bad">Vence hoy</span>';
    if (st.dias <= 5) return `<span class="pill warn">Vence en ${st.dias} día${st.dias === 1 ? '' : 's'}</span>`;
    return `<span class="pill azul">El ${fechaCorta(st.fecha)}</span>`;
  }
  function filaFijo(f, i, mes = S.mes) {
    const st = estadoFijo(f, mes), k = CAT[f.categoria] || CAT.otros;
    const abierto = st.estado !== 'pagado' && !st.saltado;
    return `<div class="pago-row fijo-row" style="--i:${i}">${icoCat(k)}
      <div class="t"><b>${esc(f.nombre)}</b><small>${st.pagado && st.estado !== 'pagado' ? `<b class="num" style="display:inline;color:var(--ink)">${pesos(st.pagado)}</b> de ${pesos(st.total)}` : pesos(st.total)}${f.suscripcion ? ' · suscripción' : ''} · paga ${esc(nom(f.pagadoPor))}</small>
        ${st.estado === 'parcial' ? `<div class="track fino" role="img" aria-label="Pagado ${Math.round(st.pagado / st.total * 100)}%"><div style="width:${Math.min(100, st.pagado / st.total * 100)}%;background:var(--warn)"></div></div>` : ''}<div>${chipFijo(st)}</div></div>
      <div class="acciones">${abierto ? `<button class="btn soft" data-act="pagarFijo" data-id="${esc(f.id)}" data-mes="${esc(mes)}">${st.pagado ? 'Abonar' : 'Pagar'}</button>` : ''}<button class="icon-btn mas" data-act="menuFijo" data-id="${esc(f.id)}" data-mes="${esc(mes)}" aria-label="Más opciones de ${esc(f.nombre)}">${ICON.dots}</button></div></div>`;
  }
  function vistaMenuFijo(f, mes) {
    const st = estadoFijo(f, mes);
    const op = (act, ico, col, t, d, extra = '') => `<button data-act="${act}" data-id="${esc(f.id)}" data-mes="${esc(mes)}" ${extra}><span class="ico" style="background:${col}">${ico}</span><span><b>${t}</b><small>${d}</small></span></button>`;
    return `<h2>${esc(f.nombre)}</h2>
      <p class="muted" style="margin-top:-6px">${esc(nombreMes(mes))} · ${st.pagado ? pesos(st.pagado) + ' de ' + pesos(st.total) : pesos(st.total)} ${chipFijo(st)}</p>
      <div class="menu">
        ${st.estado !== 'pagado' && !st.saltado ? op('pagarFijo', ICON.card, 'var(--azul)', st.pagado ? 'Abonar lo que falta' : 'Pagar', 'Todo lo pendiente o solo una parte') : ''}
        ${op('pagosFijo', ICON.receipt, '#5B7BE0', 'Ver pagos del mes', st.pagos.length ? `${st.pagos.length} pago${st.pagos.length === 1 ? '' : 's'} · ${pesos(st.pagado)}` : 'Aún no hay pagos este mes')}
        ${op('editarFijo', ICON.pen, '#2F9FB3', 'Editar', 'Nombre, valor, día, categoría y quién paga')}
        ${op('saltarFijo', ICON.right, '#8C8399', st.saltado ? 'Volver a contarlo este mes' : 'Este mes no aplica', st.saltado ? 'Vuelve a aparecer como pendiente' : 'No cuenta como pendiente ni vencido en ' + esc(nombreMes(mes, { month: 'long' })))}
      </div>
      <div id="borrarZona" style="margin-top:14px"><button type="button" class="btn danger full" data-act="pedirBorrar" data-col="fijos" data-id="${esc(f.id)}">Eliminar gasto fijo</button></div>
      <p class="muted" style="font-size:12px;text-align:center">Si lo eliminan, los pagos ya registrados se conservan en los gastos.</p>`;
  }
  function vistaPagosFijo(f, mes) {
    const st = estadoFijo(f, mes);
    return `<h2>Pagos de ${esc(f.nombre)}</h2><p class="muted" style="margin-top:-6px">${esc(nombreMes(mes))} · ${pesos(st.pagado)} de ${pesos(st.total)}</p>
      <div class="list">${st.pagos.map((x, i) => itemGasto(x, i)).join('') || '<p class="muted">Aún no hay pagos este mes.</p>'}</div>
      <button class="btn ghost full" style="margin-top:14px" data-act="menuFijo" data-id="${esc(f.id)}" data-mes="${esc(mes)}">Volver</button>`;
  }
  function formPagoFijo(f, mes) {
    const st = estadoFijo(f, mes);
    return `<h2>¿Cuánto pagaste?</h2>
      <p class="muted" style="margin-top:-6px">${esc(f.nombre)} · ${esc(nombreMes(mes))}</p>
      <form data-form="pagoFijo" data-id="${esc(f.id)}" data-mes="${esc(mes)}" data-pagado="${st.pagado}">
        <div class="nums-sheet tres"><div><small>Total del mes</small><b class="num" id="fpTot">${pesos(st.total)}</b></div><div><small>Ya pagado</small><b class="num">${pesos(st.pagado)}</b></div><div><small>Falta</small><b class="num" id="fpFalta">${pesos(st.pendiente)}</b></div></div>
        <div class="field" style="margin-top:12px"><span class="lab">¿Qué pagaste?</span>${seg('fptipo', [['todo', 'Todo lo pendiente'], ['abono', 'Un abono']], 'todo')}</div>
        <div class="field"><label for="fpmonto">Valor pagado</label>${dinero('fpmonto', st.pendiente || st.total, 'required')}</div>
        <details class="mas-op"><summary>¿Este mes llegó por otro valor?</summary>
          <div class="field" style="margin-top:8px"><label for="fptotal">Total de ${esc(nombreMes(mes, { month: 'long' }))}</label>${dinero('fptotal', st.total)}<small class="muted">Solo cambia este mes (por ejemplo, los servicios). El valor normal sigue en ${pesos(f.monto)}.</small></div></details>
        <div class="field"><span class="lab">¿Quién pagó?</span>${seg('fppago', quienes(), f.pagadoPor || yo())}</div>
        <div class="field"><label for="fpfecha">Fecha</label><input id="fpfecha" name="fpfecha" type="date" class="input" value="${mes === mesDe(hoy()) ? hoy() : diaEn(mes, f.dia || 1)}" required></div>
        <button class="btn full">Registrar pago</button>
      </form>`;
  }
  function pendienteForm(fm) {
    const tot = digitos(fm.elements.fptotal.value) || 0;
    return Math.max(0, tot - Number(fm.dataset.pagado || 0));
  }
  function formFijo(f = {}) {
    return `<h2>${f.id ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}</h2>
      <p class="muted" style="margin-top:-6px">Se repite cada mes. Cuando lo paguen, lo marcan como pagado y queda en los gastos.</p>
      <form data-form="fijo" data-id="${esc(f.id || '')}">
        <div class="field"><label for="fnombre">Nombre</label><input id="fnombre" name="fnombre" class="input" maxlength="40" required value="${esc(f.nombre || '')}" placeholder="Ej: Arriendo, Netflix, Gimnasio"></div>
        <div class="row"><div class="field"><label for="fmonto">Valor aproximado</label>${dinero('fmonto', f.monto, 'required')}</div>
          <div class="field"><label for="fdia">Día del mes</label><input id="fdia" name="fdia" class="input" inputmode="numeric" maxlength="2" value="${esc(f.dia || '')}" placeholder="1 a 31"></div></div>
        <div class="field"><label for="fcat">Categoría</label><select id="fcat" name="fcat" class="input">${catsVisibles(f.categoria).filter(k => k.id !== 'deudas').map(k => `<option value="${esc(k.id)}" ${k.id === (f.categoria || 'hogar') ? 'selected' : ''}>${esc(k.n)}</option>`).join('')}</select></div>
        <div class="field"><span class="lab">¿Quién lo paga normalmente?</span>${seg('fpago', quienes(), f.pagadoPor || yo())}</div>
        <div class="field"><span class="lab">¿De quién es?</span>${seg('ftipo', [['compartido', 'De los dos'], ['a', nom('a')], ['b', nom('b')]], f.tipo || 'compartido')}</div>
        <label class="check" for="fsub"><input type="checkbox" id="fsub" name="fsub" ${f.suscripcion ? 'checked' : ''}><span>Es una suscripción (streaming, apps, gimnasio…)</span></label>
        <button class="btn full">Guardar</button>
        ${f.id ? `<div id="borrarZona"><button type="button" class="btn danger full" data-act="pedirBorrar" data-col="fijos" data-id="${esc(f.id)}">Eliminar gasto fijo</button></div>` : ''}
      </form>`;
  }

  /* ---------- Cuentas y patrimonio ---------- */
  const TIPOS_CUENTA = { banco: 'Cuenta bancaria', ahorro: 'Ahorros', efectivo: 'Efectivo', inversion: 'Inversión o CDT', cesantias: 'Cesantías o pensión voluntaria', bien: 'Bien (carro, casa, moto)', otro: 'Otro' };
  function patrimonio() {
    const activos = sum(S.cuentas, x => x.saldo);
    const deudas = sum(S.deudas, d => estadoDeuda(d).saldo);
    const de = p => sum(S.cuentas, x => (x.dueno || 'ambos') === p ? x.saldo : (x.dueno || 'ambos') === 'ambos' ? x.saldo / 2 : 0)
      - sum(S.deudas, d => { const r = d.responsable || 'ambos', sd = estadoDeuda(d).saldo; return r === p ? sd : r === 'ambos' ? sd * (p === 'a' ? ratioA() : 1 - ratioA()) : 0; });
    return { activos, deudas, neto: activos - deudas, a: de('a'), b: de('b') };
  }
  const haceTiempo = ts => { const m = Math.floor((Date.now() - ts) / 60000); if (m < 1) return 'ahora'; if (m < 60) return 'hace ' + m + ' min'; const h = Math.floor(m / 60); if (h < 24) return 'hace ' + h + ' h'; const d = Math.floor(h / 24); return d === 1 ? 'ayer' : 'hace ' + d + ' días'; };
  const haceDias = ts => { if (!ts) return ''; const d = Math.floor((Date.now() - ts) / 864e5); return d <= 0 ? 'hoy' : d === 1 ? 'ayer' : 'hace ' + d + ' días'; };
  function vistaCuentas() {
    const p = patrimonio();
    return `<h2>Patrimonio de los dos</h2>
      <p class="muted" style="margin-top:-6px">Lo que tienen menos lo que deben. Actualicen los saldos cada mes para ver si van creciendo.</p>
      <div class="nums-sheet">
        <div><small>Lo que tienen</small><b class="num" style="color:var(--ok)">${pesos(p.activos)}</b></div>
        <div><small>Lo que deben</small><b class="num" style="color:var(--bad)">${pesos(p.deudas)}</b></div>
        <div><small>Patrimonio de ${esc(nom('a'))}</small><b class="num">${pesos(p.a)}</b></div>
        <div><small>Patrimonio de ${esc(nom('b'))}</small><b class="num">${pesos(p.b)}</b></div>
      </div>
      <div class="list" style="margin-top:14px">${S.cuentas.slice().sort((a, b) => b.saldo - a.saldo).map((x, i) => `<button class="item" style="--i:${i}" data-act="editarCuenta" data-id="${esc(x.id)}">
        <span class="ico" style="background:var(--${(x.dueno || 'ambos') === 'b' ? 'verde' : 'azul'})">${ICON.bank}</span>
        <span class="t"><b>${esc(x.nombre)}</b><small>${x.banco ? esc(x.banco) + ' · ' : ''}${esc(TIPOS_CUENTA[x.tipo] || 'Cuenta')} · ${esc((x.dueno || 'ambos') === 'ambos' ? 'De los dos' : 'De ' + nom(x.dueno))} · ${esc(haceDias(x.actualizado))}</small></span>
        <span class="m">${pesos(x.saldo)}</span></button>`).join('') || '<p class="muted">Agreguen sus cuentas, ahorros, CDT o cesantías.</p>'}</div>
      <button class="btn full" style="margin-top:14px" data-act="nuevaCuenta">Agregar cuenta o bien</button>`;
  }
  function formCuenta(x = {}) {
    return `<h2>${x.id ? 'Actualizar cuenta' : 'Nueva cuenta'}</h2>
      <form data-form="cuenta" data-id="${esc(x.id || '')}">
        <div class="field"><label for="cnombre">Nombre</label><input id="cnombre" name="cnombre" class="input" maxlength="40" required value="${esc(x.nombre || '')}" placeholder="Ej: Ahorros Nu, CDT Bancolombia"></div>
        <div class="field"><label for="cbanco">Banco o entidad (opcional)</label><input id="cbanco" name="cbanco" class="input" maxlength="40" list="listaBancosC" value="${esc(x.banco || '')}" placeholder="Escribe o elige"><datalist id="listaBancosC">${BANCOS.map(b => `<option value="${esc(b)}"></option>`).join('')}</datalist></div>
        <div class="field"><label for="ctipo">Tipo</label><select id="ctipo" name="ctipo" class="input">${Object.entries(TIPOS_CUENTA).map(([k, n]) => `<option value="${k}" ${k === (x.tipo || 'banco') ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
        <div class="field"><label for="csaldo">Saldo o valor hoy</label>${dinero('csaldo', x.saldo, 'required')}</div>
        <div class="field"><span class="lab">¿De quién es?</span>${seg('cdueno', [['ambos', 'De los dos'], ['a', nom('a')], ['b', nom('b')]], x.dueno || 'ambos')}</div>
        <button class="btn full">Guardar</button>
        ${x.id ? `<div id="borrarZona"><button type="button" class="btn danger full" data-act="pedirBorrar" data-col="cuentas" data-id="${esc(x.id)}">Eliminar</button></div>` : ''}
      </form>`;
  }

  /* ---------- Plata personal ---------- */
  function plataPersonal(mes) {
    const m = (S.cfg && S.cfg.mesada) || {};
    const gastado = p => sum(S.gastos.filter(x => x.tipo === p && mesDe(x.fecha) === mes && !x.fijoId && x.categoria !== 'deudas' && x.categoria !== 'ajuste'));
    return { a: { tope: m.a || 0, usado: gastado('a') }, b: { tope: m.b || 0, usado: gastado('b') } };
  }

  /* ---------- Cita de dinero ---------- */
  function rachaCitas() {
    const hechas = new Set(S.citas.filter(x => x.hecho).map(x => x.mes || x.id));
    let m = mesDe(hoy()); if (!hechas.has(m)) m = sumarMes(m, -1);
    let n = 0; while (hechas.has(m) && n < 120) { n++; m = sumarMes(m, -1); }
    return n;
  }
  function vistaCita(mes) {
    const c = calcular(mes), ant = calcular(sumarMes(mes, -1));
    const cita = S.citas.find(x => (x.mes || x.id) === mes) || {};
    const dif = ant.gastado ? (c.gastado - ant.gastado) / ant.gastado : 0;
    const top = Object.entries(c.porCat).filter(([k]) => k !== 'deudas').sort((a, b) => b[1] - a[1]).slice(0, 3);
    const pres = S.cfg.presupuestos || {};
    const pasados = Object.entries(pres).filter(([k, v]) => (c.porCat[k] || 0) > v);
    const pagosDeuda = c.g.filter(x => x.categoria === 'deudas');
    const net = balance();
    const revisar = S.gastos.filter(x => x.revisar && !oculto(x));
    const pp = plataPersonal(mes);
    const fila = (t, v, cls = '') => `<div class="cita-row"><span>${t}</span><b class="num ${cls}">${v}</b></div>`;
    return `<h2>Cita de dinero · ${esc(nombreMes(mes, { month: 'long' }))}</h2>
      <p class="muted" style="margin-top:-6px">Quince minutos, un café y los dos mirando lo mismo. Sin culpas: la idea es ponerse de acuerdo.</p>
      <div class="cita">
        <h4>1. Cómo nos fue</h4>
        ${fila('Ingresos', pesos(c.ingresos))}
        ${fila('Gastamos', pesos(c.gastado) + (ant.gastado ? ` <small class="${dif > 0 ? 'bad' : 'ok'}">${dif > 0 ? '+' : ''}${Math.round(dif * 100)}% vs mes anterior</small>` : ''))}
        ${fila('Ahorramos', pesos(c.ahorro) + (c.ingresos ? ` <small>${Math.round(c.ahorro / c.ingresos * 100)}% de los ingresos</small>` : ''), 'ok')}
        ${pagosDeuda.length ? fila('Abonamos a deudas', pesos(sum(pagosDeuda, x => x.capital ?? x.monto)) + ` <small>intereses ${pesos(sum(pagosDeuda, x => x.interes || 0))}</small>`) : ''}
        <h4>2. En qué se fue la plata</h4>
        ${top.map(([k, v]) => fila(esc(CAT[k]?.n || k), pesos(v))).join('') || '<p class="muted">Sin gastos registrados.</p>'}
        ${pasados.length ? `<p class="muted" style="margin:6px 0 0">Se pasaron en: ${pasados.map(([k, v]) => `<b style="color:var(--bad)">${esc(CAT[k]?.n || k)}</b> (+${pesos((c.porCat[k] || 0) - v)})`).join(', ')}.</p>` : '<p class="muted" style="margin:6px 0 0">Ninguna categoría se pasó del presupuesto.</p>'}
        <h4>3. Entre nosotros</h4>
        ${fila('Cuentas claras', net === 0 ? 'A paz y salvo' : `${esc(nom(net > 0 ? 'b' : 'a'))} le debe ${pesos(Math.abs(net))}`)}
        ${pp.a.tope || pp.b.tope ? fila('Plata personal', `${esc(nom('a'))} ${corto(pp.a.usado)}/${corto(pp.a.tope)} · ${esc(nom('b'))} ${corto(pp.b.usado)}/${corto(pp.b.tope)}`) : ''}
        ${revisar.length ? `<p style="margin:6px 0 8px"><b>${revisar.length} gasto${revisar.length === 1 ? '' : 's'} para conversar:</b></p><div style="display:grid;gap:10px">${revisar.slice(0, 8).map(x => filaHablar(x)).join('')}</div>` : ''}
        <h4>4. Conversemos</h4>
        <ul class="preguntas">
          <li>¿Qué gasto de este mes nos hizo más felices?</li>
          <li>¿Hubo algún gasto que preferiríamos no repetir?</li>
          <li>¿Qué plan de diversión queremos para el próximo mes y cuánto le ponemos?</li>
          <li>¿Vamos bien con las metas y las deudas? ¿Ajustamos algún presupuesto?</li>
        </ul>
      </div>
      <form data-form="cita" data-id="${esc(mes)}">
        <div class="field"><label for="acuerdos">Acuerdos del mes</label><textarea id="acuerdos" name="acuerdos" class="input" style="font-family:var(--f-body);font-size:14px" maxlength="1000" placeholder="Ej: este mes nada de domicilios entre semana; abonamos $100.000 extra a la Visa.">${esc(cita.acuerdos || '')}</textarea></div>
        <button class="btn full">${cita.hecho ? 'Guardar acuerdos' : 'Terminamos nuestra cita'}</button>
      </form>`;
  }

  /* ---------- Exportar ---------- */
  async function exportarCSV() {
    const q = t => '"' + String(t ?? '').replace(/"/g, '""') + '"';
    const filas = [['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Valor', 'Pagó', 'De quién', 'Nota'].map(q).join(';')];
    for (const x of S.gastos.slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '')))
      filas.push([x.fecha, x.categoria === 'ajuste' ? 'Saldar cuentas' : 'Gasto', descDe(x), CAT[x.categoria]?.n || x.categoria, x.monto, nom(x.pagadoPor), x.tipo === 'compartido' ? 'Los dos' : nom(x.tipo), oculto(x) ? '' : x.nota].map(q).join(';'));
    for (const x of S.ingresos) filas.push([x.fecha, 'Ingreso extra', x.desc, '', x.monto, nom(x.quien), nom(x.quien), ''].map(q).join(';'));
    for (const x of S.aportes) filas.push([x.fecha, 'Aporte a meta', S.metas.find(m => m.id === x.metaId)?.nombre || 'Meta', 'Ahorro', x.monto, nom(x.quien), nom(x.quien), ''].map(q).join(';'));
    const csv = '﻿' + filas.join('\r\n');
    const FS = plugin('Filesystem'), Sh = plugin('Share');
    if (nativo && FS && Sh) {
      const r = await FS.writeFile({ path: 'TU-Y-YO-movimientos.csv', data: csv, directory: 'CACHE', encoding: 'utf8' });
      await Sh.share({ title: 'Movimientos TU Y YO', url: r.uri });
      return;
    }
    try { await navigator.clipboard.writeText(csv); toast('Copiado: pégalo en Excel o Google Sheets'); }
    catch { abrir(`<h2>Movimientos</h2><p class="muted">Selecciona y copia este texto.</p><textarea class="input" readonly style="min-height:260px">${esc(csv)}</textarea>`); }
  }

  /* ---------- Distribución del presupuesto ---------- */
  function resumenDist(pres, grupoDe = id => CAT[id]?.g || 'gus') {
    const cfg = S.cfg || cfgBase();
    const ing = (cfg.ingresos.a || 0) + (cfg.ingresos.b || 0);
    const g = { nec: 0, gus: 0, aho: 0 };
    for (const [id, m] of Object.entries(pres || {})) { if (!m || id === 'deudas' || CAT[id]?.oculta) continue; const k = grupoDe(id); g[GRUPOS[k] ? k : 'gus'] += m; }
    const deu = S.deudas.reduce((a, d) => { const st = estadoDeuda(d); return st.saldo > 0 ? a + Math.min(d.cuota || 0, st.saldo) : a; }, 0);
    const meta = Math.round(ing * (cfg.metaAhorroPct || 0) / 100);
    const total = g.nec + g.gus + g.aho + deu + meta;
    return { ing, ...g, deu, meta, total, libre: ing - total };
  }
  let distModo = 'pesos';
  function vistaDistribucion() {
    const c = S.cfg, pres = c.presupuestos || {};
    return `<h2>Distribución del presupuesto</h2>
      <p class="muted" style="margin-top:-6px">Repartan el ingreso de los dos entre categorías. Pueden renombrarlas, cambiarles el color y el grupo, ocultarlas o crear las suyas.</p>
      <div id="distResumen" class="dist-resumen"></div>
      <div class="row" style="align-items:center;margin:12px 0 4px">
        <button type="button" class="btn soft" data-act="sugerirDist" style="flex:1.3">${ICON.spark} Sugerir 50/30/20</button>
        <div class="seg" role="radiogroup" aria-label="Ver topes en" style="flex:1"><label><input type="radio" name="distModo" value="pesos" ${distModo === 'pesos' ? 'checked' : ''}><span>$</span></label><label><input type="radio" name="distModo" value="pct" ${distModo === 'pct' ? 'checked' : ''}><span>%</span></label></div>
      </div>
      <form data-form="distribucion">
        <div id="distFilas" class="dist-lista">${CATS.filter(k => k.id !== 'deudas').map(k => filaDist(k, pres[k.id] || 0)).join('')}</div>
        <div class="dist-fija"><span class="dot" style="background:${esc(CAT.deudas?.c || '#7A5C99')}"></span><span>Cuotas de deudas</span><b class="num" id="distDeu"></b></div>
        <div class="dist-fija"><span class="dot" style="background:var(--verde)"></span><span>Meta de ahorro (${esc(c.metaAhorroPct || 0)}%)</span><b class="num" id="distMeta"></b></div>
        <button type="button" class="btn ghost full" data-act="nuevaCat" style="margin-top:6px">+ Agregar categoría</button>
        <button class="btn full">Guardar distribución</button>
      </form>`;
  }
  function filaDist(k, monto) {
    return `<div class="dist-fila" data-id="${esc(k.id)}" data-c="${esc(k.c)}" data-v="${monto || 0}" ${k.oculta ? 'data-oculta="1"' : ''} ${k.custom ? 'data-custom="1"' : ''}>
      <button type="button" class="dist-color" data-act="colorCat" style="background:${esc(k.c)}" aria-label="Cambiar color de ${esc(k.n || 'la categoría')}"></button>
      <input class="input dist-nombre" value="${esc(k.n)}" maxlength="24" placeholder="Nombre" aria-label="Nombre de la categoría">
      <input class="input dist-monto ${distModo === 'pesos' ? 'money' : ''}" inputmode="numeric" value="${valorDist(monto)}" placeholder="${distModo === 'pesos' ? 'Sin tope' : '0 %'}" aria-label="Tope mensual">
      <div class="dist-meta">
        <select class="dist-grupo input" aria-label="Grupo">${Object.entries(GRUPOS).map(([g, n]) => `<option value="${g}" ${k.g === g ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <span class="dist-pct num"></span>
        <button type="button" class="dist-quitar" data-act="${k.custom ? 'borrarCat' : 'ocultarCat'}">${k.custom ? 'Eliminar' : (k.oculta ? 'Mostrar' : 'Ocultar')}</button>
      </div></div>`;
  }
  const ingresoMes = () => ((S.cfg?.ingresos?.a || 0) + (S.cfg?.ingresos?.b || 0));
  function valorDist(m) {
    if (!m) return '';
    if (distModo === 'pesos') return pesos(m);
    const ing = ingresoMes(); return ing ? String(Math.round(m / ing * 1000) / 10).replace('.', ',') : '';
  }
  function leerMontoFila(f) {
    const inp = f.querySelector('.dist-monto');
    if (distModo === 'pesos') return digitos(inp.value);
    const exacto = Number(f.dataset.v) || 0;
    if (inp.value === valorDist(exacto)) return exacto; // sin editar: conserva el valor exacto en pesos
    const pct =Number(String(inp.value).replace(',', '.').replace(/[^\d.]/g, '')) || 0;
    return Math.round(ingresoMes() * Math.min(pct, 100) / 100 / 1000) * 1000;
  }
  function actualizarDist() {
    const filas = [...document.querySelectorAll('#distFilas .dist-fila')]; if (!filas.length) return;
    const ing = ingresoMes(), pres = {}, grupo = {};
    for (const f of filas) {
      const id = f.dataset.id, m = leerMontoFila(f); f.dataset.v = m;
      grupo[id] = f.querySelector('.dist-grupo').value;
      if (f.dataset.oculta !== '1') pres[id] = m;
      f.querySelector('.dist-pct').textContent = distModo === 'pesos' ? (ing && m ? (Math.round(m / ing * 1000) / 10).toLocaleString('es-CO') + '%' : '') : (m ? corto(m) : '');
    }
    const r = resumenDist(pres, id => grupo[id] || 'gus');
    $('#distDeu').textContent = pesos(r.deu); $('#distMeta').textContent = pesos(r.meta);
    const pct = v => r.ing ? Math.round(v / r.ing * 100) : 0;
    const segs = [['nec', 'var(--azul)', r.nec], ['gus', '#E39A00', r.gus], ['aho', 'var(--verde)', r.aho + r.meta], ['deu', '#7A5C99', r.deu]];
    const base = Math.max(r.ing, r.total) || 1;
    $('#distResumen').innerHTML = `
      <div class="dist-top"><div><small>Ingreso de los dos</small><b class="num">${pesos(r.ing)}</b></div>
        <div class="${r.libre < 0 ? 'mal' : r.libre === 0 ? 'bien' : ''}"><small>${r.libre < 0 ? 'Se pasan por' : r.libre === 0 ? 'Cada peso asignado' : 'Sin asignar'}</small><b class="num">${pesos(Math.abs(r.libre))}</b></div></div>
      <div class="dist-barra" role="img" aria-label="Necesidades ${pct(r.nec)}%, gustos ${pct(r.gus)}%, ahorro ${pct(r.aho + r.meta)}%, deudas ${pct(r.deu)}%">${segs.map(([, col, v]) => v ? `<i style="width:${v / base * 100}%;background:${col}"></i>` : '').join('')}</div>
      <div class="dist-grupos">
        <span><i style="background:var(--azul)"></i>Necesidades <b>${pct(r.nec)}%</b> <em>guía 50%</em></span>
        <span><i style="background:#E39A00"></i>Gustos <b>${pct(r.gus)}%</b> <em>guía 30%</em></span>
        <span><i style="background:var(--verde)"></i>Ahorro <b>${pct(r.aho + r.meta)}%</b> <em>guía 20%</em></span>
        ${r.deu ? `<span><i style="background:#7A5C99"></i>Deudas <b>${pct(r.deu)}%</b></span>` : ''}
      </div>
      ${r.ing ? '' : '<p class="muted" style="margin:8px 0 0;font-size:13px">Escriban los ingresos en Ajustes para ver los porcentajes.</p>'}`;
  }
  function cambiarModoDist(m) {
    const filas = [...document.querySelectorAll('#distFilas .dist-fila')];
    const vals = filas.map(leerMontoFila);
    distModo = m;
    filas.forEach((f, i) => { const inp = f.querySelector('.dist-monto'); inp.classList.toggle('money', m === 'pesos'); inp.placeholder = m === 'pesos' ? 'Sin tope' : '0 %'; inp.value = valorDist(vals[i]); });
    actualizarDist();
  }

  /* ---------- Hoja inferior ---------- */
  const sheet = $('#sheet'), sheetBody = $('#sheetBody');
  let alCerrar = null, cierreT = null;
  function abrir(html, onClose) {
    clearTimeout(cierreT);
    sheetBody.innerHTML = html; sheet.hidden = false; alCerrar = onClose || null;
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('open')));
    $('#fab').setAttribute('aria-expanded', 'false');
    setTimeout(() => { const f = sheetBody.querySelector('[autofocus]'); if (f && !nativo) f.focus(); }, 350);
  }
  function cerrar() {
    if (S.bloqueo) return; // la autorización de datos no se puede saltar
    sheet.classList.remove('open');
    $('#fab').setAttribute('aria-expanded', 'false');
    clearTimeout(cierreT);
    cierreT = setTimeout(() => { sheet.hidden = true; sheetBody.innerHTML = ''; if (alCerrar) { const f = alCerrar; alCerrar = null; f(); } }, 300);
  }
  let toastT;
  function toast(t) { const el = $('#toast'); el.classList.remove('accion'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2800); }
  // Toast con botón (por ejemplo «Deshacer»), visible 6 segundos.
  function toastAccion(t, etiqueta, fn) {
    const el = $('#toast');
    el.innerHTML = `<span>${esc(t)}</span><button type="button" class="toast-btn">${esc(etiqueta)}</button>`;
    el.classList.add('show', 'accion');
    el.querySelector('button').onclick = async () => { el.classList.remove('show', 'accion'); clearTimeout(toastT); try { await fn(); } catch (err) { console.error(err); toast('No se pudo deshacer'); } };
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show', 'accion'), 6000);
  }
  function lluviaMonedas(n = 26) {
    if (reduceMov()) return;
    const box = document.createElement('div'); box.className = 'confeti monedas';
    for (let i = 0; i < n; i++) {
      const h = document.createElement('i'); const a = Math.random() * Math.PI * 2, d = 110 + Math.random() * 190;
      h.style.setProperty('--x', Math.cos(a) * d + 'px'); h.style.setProperty('--y', Math.sin(a) * d - 90 + 'px'); h.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      h.style.animationDelay = (Math.random() * 180) + 'ms';
      h.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#B86E00"/><circle cx="10" cy="10" r="7.4" fill="#FFB21E"/><path d="M10 5.5v9M12.3 7.6c-.5-1-4.4-1.2-4.4.9 0 2 4.4 1.1 4.4 3 0 2-3.9 1.9-4.6.6" fill="none" stroke="#B86E00" stroke-width="1.4" stroke-linecap="round"/></svg>';
      box.appendChild(h);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 1700);
  }
  function confeti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    lluviaMonedas(10);
    const box = document.createElement('div'); box.className = 'confeti';
    for (let i = 0; i < 18; i++) {
      const h = document.createElement('i'); const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 160;
      h.style.setProperty('--x', Math.cos(a) * d + 'px'); h.style.setProperty('--y', Math.sin(a) * d - 80 + 'px'); h.style.setProperty('--r', (Math.random() * 360 - 180) + 'deg');
      h.style.color = i % 2 ? 'var(--azul)' : 'var(--verde)'; h.innerHTML = ICON.heart; box.appendChild(h);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 1400);
  }

  /* ---------- Componentes de formulario ---------- */
  const seg = (name, opts, val) => `<div class="seg" role="radiogroup">${opts.map(([v, t]) => `<label><input type="radio" name="${name}" value="${esc(v)}" ${v === val ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('')}</div>`;
  const dinero = (id, val, extra = '') => `<input id="${id}" name="${id}" class="input money" inputmode="numeric" autocomplete="off" value="${val ? pesos(val) : ''}" placeholder="$0" ${extra}>`;
  const quienes = () => [['a', nom('a')], ['b', nom('b')]];

  function formGasto(g = {}, aviso = '') {
    const nuevo = !g.id;
    const cat = g.categoria || 'mercado';
    const deudas = S.deudas.filter(d => estadoDeuda(d).saldo > 0 || d.id === g.deudaId);
    return `<h2>${nuevo ? 'Nuevo gasto' : 'Editar gasto'}</h2>
      ${aviso ? `<div class="banner" style="margin-bottom:12px">${aviso}</div>` : ''}
      <form data-form="gasto" data-id="${esc(g.id || '')}">
        <div class="field"><label for="gmonto">Valor</label>${dinero('gmonto', g.monto, 'required autofocus')}</div>
        <div class="field"><label for="gdesc">Descripción</label><input id="gdesc" name="gdesc" class="input" maxlength="60" value="${esc(g.desc || '')}" placeholder="Ej: mercado del mes"></div>
        <div class="field"><span class="lab">Categoría</span><div class="cats">${catsVisibles(cat).map(k => `<label><input type="radio" name="gcat" value="${esc(k.id)}" ${k.id === cat ? 'checked' : ''}><i style="background:${esc(k.c)}"></i>${esc(k.n)}</label>`).join('')}</div></div>
        <div class="field" id="campoDeuda" ${cat === 'deudas' ? '' : 'hidden'}><label for="gdeuda">¿Qué deuda pagaron?</label>
          <select id="gdeuda" name="gdeuda" class="input"><option value="">Ninguna en particular</option>${deudas.map(d => `<option value="${esc(d.id)}" ${d.id === g.deudaId ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('')}</select>
          <small class="muted">Elijan la deuda para que su saldo baje. Para separar intereses y capital usen «Pagar» en la pestaña Deudas.</small></div>
        <div class="field"><span class="lab">¿Quién pagó?</span>${seg('gpago', quienes(), g.pagadoPor || yo())}</div>
        <div class="field"><span class="lab">¿De quién es el gasto?</span>${seg('gtipo', [['compartido', 'De los dos'], ['a', nom('a')], ['b', nom('b')]], g.tipo || 'compartido')}</div>
        <div class="field"><label for="gfecha">Fecha</label><input id="gfecha" name="gfecha" type="date" class="input" value="${esc(g.fecha || hoy())}" required></div>
        <div class="field"><label for="gnota">Nota para los dos (opcional)</label><input id="gnota" name="gnota" class="input" maxlength="120" value="${esc(g.nota || '')}" placeholder="Ej: era para el cumpleaños de mi papá"></div>
        ${(() => { const ms = metasActivas().filter(m => estadoMeta(m).ahorrado > 0 || m.id === g.metaId); return ms.length ? `<div class="field"><label for="gmeta">¿Lo pagaron con el ahorro de una meta? (opcional)</label><select id="gmeta" name="gmeta" class="input"><option value="">No, sale de la plata del mes</option>${ms.map(m => `<option value="${esc(m.id)}" ${m.id === g.metaId ? 'selected' : ''}>${esc(m.nombre)} · ${corto(estadoMeta(m).ahorrado)} ahorrados</option>`).join('')}</select><small class="muted">Se descuenta de esa meta y no de lo libre del mes.</small></div>` : ''; })()}
        <label class="check" for="grev"><input type="checkbox" id="grev" name="grev" ${g.revisar ? 'checked' : ''}><span>Marcar para hablarlo juntos${S.modo === 'nube' ? ' (tu pareja confirma cuando lo hablen)' : ''}</span></label>
        <label class="check" for="gpriv" id="campoPriv" ${(g.tipo || 'compartido') === 'compartido' ? 'hidden' : ''}><input type="checkbox" id="gpriv" name="gpriv" ${g.privado ? 'checked' : ''}><span>Discreto: tu pareja ve el valor pero no el detalle en su pantalla. No es secreto: queda guardado en el hogar compartido.</span></label>
        ${g.fijoId ? `<input type="hidden" name="gfijo" value="${esc(g.fijoId)}">` : ''}
        <input type="hidden" name="gorigen" value="${esc(g.origen || 'manual')}">
        ${g.items?.length ? `<div class="field"><span class="lab">Productos leídos de la factura</span><div class="items">${g.items.map(it => `<div><span>${esc(it.descripcion)}</span><span class="num">${pesos(it.valor)}</span></div>`).join('')}</div></div>` : ''}
        <button class="btn full">${nuevo ? 'Guardar gasto' : 'Guardar cambios'}</button>
        ${nuevo ? '' : `<div id="borrarZona"><button type="button" class="btn danger full" data-act="pedirBorrar" data-col="gastos" data-id="${esc(g.id)}">Eliminar</button></div>`}
      </form>`;
  }
  function vistaGasto(g) {
    if (oculto(g)) return `<h2>Gasto discreto</h2><p class="muted">${esc(nom(g.tipo))} marcó este gasto como discreto: ves el valor (${pesos(g.monto)}), no el detalle.</p>`;
    const k = catDe(g);
    const fijo = g.fijoId && S.fijos.find(f => f.id === g.fijoId);
    const deuda = g.deudaId && S.deudas.find(d => d.id === g.deudaId);
    const meta = g.metaId && S.metas.find(m => m.id === g.metaId);
    const fila = (t, v) => v ? `<div class="cita-row"><span>${t}</span><b>${v}</b></div>` : '';
    const ORI = { voz: 'Dictado', factura: 'Factura escaneada', fijo: 'Pago de gasto fijo', manual: 'Escrito a mano' };
    return `<div class="det-head">${icoCat(k, 'grande')}<div style="min-width:0"><div class="eyebrow">${esc(k.n)}</div><h2 style="margin:0">${esc(descDe(g))}</h2></div></div>
      <div class="det-monto num">${pesos(g.monto)}</div>
      <div class="cita det">
        ${fila('Fecha', esc(nombreDia(g.fecha)))}
        ${fila('Pagó', esc(nom(g.pagadoPor)))}
        ${fila('De quién es', esc(g.tipo === 'compartido' ? 'De los dos' : nom(g.tipo)))}
        ${S.modo === 'nube' || PREVIEW ? fila('Lo registró', esc(nom(g.por || g.pagadoPor)) + (g.editadoPor ? ' · editado por ' + esc(nom(g.editadoPor)) : '')) : ''}
        ${fila('Gasto fijo', fijo ? esc(fijo.nombre) : '')}
        ${fila('Deuda', deuda ? esc(deuda.nombre) + (g.interes ? ` · interés ${pesos(g.interes)}` : '') : '')}
        ${fila('Pagado con la meta', meta ? esc(meta.nombre) : '')}
        ${fila('Cómo se anotó', ORI[g.origen] ? esc(ORI[g.origen]) : '')}
        ${g.nota ? `<p class="nota-det">«${esc(g.nota)}»</p>` : ''}
      </div>
      ${g.revisar ? `<div class="hablar-det">${ICON.chat}<span>${puedeHablar(g) ? (S.modo === 'nube' ? esc(nom(marcoHablar(g))) + ' lo marcó para hablarlo.' : 'Marcado para hablarlo juntos.') : 'Lo marcaste para hablarlo. ' + esc(nom(otro(yo()))) + ' confirma cuando lo hablen.'}</span>${puedeHablar(g) ? `<button class="btn soft" data-act="hablado" data-id="${esc(g.id)}">Ya lo hablamos</button>` : ''}</div>`
        : g.habladoPor ? `<p class="muted" style="font-size:13px">Lo hablaron${S.modo === 'nube' ? ' · confirmó ' + esc(nom(g.habladoPor)) : ''}${g.habladoEn ? ' · ' + esc(haceTiempo(g.habladoEn)) : ''}.</p>` : ''}
      <div class="row" style="margin-top:14px"><button class="btn" data-act="editarGasto" data-id="${esc(g.id)}">${ICON.pen} Editar</button></div>
      <div id="borrarZona" style="margin-top:10px"><button type="button" class="btn danger full" data-act="pedirBorrar" data-col="gastos" data-id="${esc(g.id)}">Eliminar gasto</button></div>`;
  }
  function borrarConfirm(col, id) {
    return `<div class="row"><button type="button" class="btn ghost" data-act="cancelBorrar" data-col="${esc(col)}" data-id="${esc(id)}">Cancelar</button><button type="button" class="btn danger" data-act="borrar" data-col="${esc(col)}" data-id="${esc(id)}">Sí, eliminar</button></div>`;
  }

  function formDeuda(d = {}) {
    const tipo = d.tipo || 'tarjeta';
    const st = d.id ? estadoDeuda(d) : null;
    const resp = d.responsable || 'ambos';
    return `<h2>${d.id ? 'Editar deuda' : 'Nueva deuda'}</h2>
      <form data-form="deuda" data-id="${esc(d.id || '')}">
        <div class="field"><label for="dtipo">Tipo</label><select id="dtipo" name="dtipo" class="input">${Object.entries(TIPOS_DEUDA).map(([k, n]) => `<option value="${k}" ${k === tipo ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
        <div class="field"><label for="dnombre">Nombre para reconocerla</label><input id="dnombre" name="dnombre" class="input" maxlength="40" required value="${esc(d.nombre || '')}" placeholder="Ej: Visa Oro, Crédito del carro"></div>
        <div class="field"><label for="dbanco">Banco o a quién se le debe</label><input id="dbanco" name="dbanco" class="input" maxlength="40" list="listaBancos" value="${esc(bancoDe(d))}" placeholder="Escribe o elige"><datalist id="listaBancos">${BANCOS.map(b => `<option value="${esc(b)}"></option>`).join('')}</datalist></div>
        <div class="row"><div class="field"><label for="dsaldo">${d.id ? 'Lo que deben hoy' : 'Saldo que deben hoy'}</label>${dinero('dsaldo', st ? st.saldo : d.saldoInicial, 'required')}</div>
          <div class="field" id="campoCupo" ${tipo === 'tarjeta' ? '' : 'hidden'}><label for="dcupo">Cupo total</label>${dinero('dcupo', d.cupo)}</div></div>
        <div class="row"><div class="field"><label for="dcuota" id="lblCuota">${tipo === 'tarjeta' ? 'Pago mínimo o lo que pagan al mes' : 'Cuota mensual'}</label>${dinero('dcuota', d.cuota)}</div>
          <div class="field"><label for="ddia">Día de pago</label><input id="ddia" name="ddia" class="input" inputmode="numeric" maxlength="2" value="${esc(d.dia || '')}" placeholder="1 a 31"></div></div>
        <div class="field"><label for="dtasa">Tasa de interés (opcional)</label>
          <div class="row" style="align-items:center"><input id="dtasa" name="dtasa" class="input" inputmode="decimal" value="${esc(d.tasa || '')}" placeholder="Ej: 28,5">${seg('dtasatipo', [['ea', 'E.A.'], ['mv', 'Mensual']], d.tasaTipo || 'ea')}</div>
          <small class="muted">Aparece en el extracto. Con ella calculamos los intereses de cada cuota y la fecha real de terminación.</small></div>
        <div class="row" id="campoPlazo" ${tipo === 'tarjeta' ? 'hidden' : ''}><div class="field"><label for="dplazo">Total de cuotas (opcional)</label><input id="dplazo" name="dplazo" class="input" inputmode="numeric" maxlength="3" value="${esc(d.plazo || '')}" placeholder="Ej: 36"></div>
          <div class="field"><label for="dprev">Cuotas ya pagadas antes</label><input id="dprev" name="dprev" class="input" inputmode="numeric" maxlength="3" value="${esc(d.cuotasPrevias || '')}" placeholder="Ej: 10"></div></div>
        <div class="field"><span class="lab">¿De quién es la deuda?</span>${seg('dresp', [['ambos', 'Conjunta'], ['a', nom('a')], ['b', nom('b')]], resp)}
          <small class="muted" id="notaConjunta" ${resp === 'ambos' ? '' : 'hidden'}>La cuota se reparte como en Ajustes: ${esc(nom('a'))} ${Math.round(ratioA() * 100)}% y ${esc(nom('b'))} ${Math.round((1 - ratioA()) * 100)}%. Quien pague de más queda a favor en «Cuentas claras».</small></div>
        <button class="btn full">Guardar deuda</button>
        ${d.id ? `<div id="borrarZona"><button type="button" class="btn danger full" data-act="pedirBorrar" data-col="deudas" data-id="${esc(d.id)}">Eliminar deuda</button></div>` : ''}
      </form>`;
  }
  function formPagoDeuda(d) {
    const st = estadoDeuda(d);
    const sugerido = Math.max(0, Math.min(st.saldo, (st.cuotaMes - st.pagadoMes) || d.cuota || st.saldo));
    const interes = Math.round(st.saldo * st.i);
    return `<h2>Pago de ${esc(d.nombre)}</h2>
      <p class="muted" style="margin-top:-6px">${bancoDe(d) ? esc(bancoDe(d)) + ' · ' : ''}Deben hoy ${pesos(st.saldo)}${st.proximo ? ' · vence el ' + esc(fechaCorta(st.proximo)) : ''}</p>
      <form data-form="pagoDeuda" data-id="${esc(d.id)}" data-i="${st.i}" data-saldo="${st.saldo}">
        <div class="field"><span class="lab">¿Qué están pagando?</span>${seg('ptipo', [['cuota', d.tipo === 'tarjeta' ? 'Pago del mes' : 'Cuota del mes'], ['abono', 'Abono extra a capital']], 'cuota')}</div>
        <div class="field"><label for="pmontoD">Valor pagado</label>${dinero('pmontoD', sugerido, 'required')}</div>
        <div class="field" id="campoInt" ${st.i > 0 ? '' : 'hidden'}><label for="pint">De ese valor, intereses</label>${dinero('pint', interes)}
          <small class="muted">Calculado con la tasa. Si el extracto dice otra cifra, cámbiala.</small></div>
        <div class="resumen-pago" id="resumenPago"></div>
        <div class="field"><span class="lab">¿Quién pagó?</span>${seg('ppago', quienes(), yo())}</div>
        <div class="field"><label for="pfecha">Fecha</label><input id="pfecha" name="pfecha" type="date" class="input" value="${hoy()}" required></div>
        <button class="btn full">Registrar pago</button>
      </form>`;
  }
  function resumenPago(f) {
    const box = f.querySelector('#resumenPago'); if (!box) return;
    const monto = digitos(f.elements.pmontoD.value);
    const abono = f.elements.ptipo.value === 'abono';
    const interes = abono || f.querySelector('#campoInt').hidden ? 0 : Math.min(monto, digitos(f.elements.pint.value));
    const capital = Math.max(0, monto - interes);
    const saldo = Number(f.dataset.saldo), nuevo = Math.max(0, saldo - capital);
    box.innerHTML = `<div><span>Abono a la deuda</span><b class="num">${pesos(capital)}</b></div><div><span>Quedarán debiendo</span><b class="num">${pesos(nuevo)}</b></div>`;
  }
  function vistaDeuda(d) {
    const st = estadoDeuda(d);
    const lista = [...st.pagos].reverse();
    return `<h2>${esc(d.nombre)}</h2>
      <p class="muted" style="margin-top:-6px">${esc(TIPOS_DEUDA[d.tipo] || 'Deuda')}${bancoDe(d) ? ' · ' + esc(bancoDe(d)) : ''}</p>
      <div class="nums-sheet">
        <div><small>Deben hoy</small><b class="num">${pesos(st.saldo)}</b></div>
        <div><small>Pagado en total</small><b class="num">${pesos(st.pagado)}</b></div>
        <div><small>Intereses pagados</small><b class="num">${pesos(st.intereses)}</b></div>
        <div><small>${st.fin ? 'Terminan en' : 'Faltan'}</small><b>${st.saldo <= 0 ? '¡Pagada!' : st.fin ? esc(nombreMes(st.fin)) : st.proy?.nunca ? 'No baja' : '—'}</b></div>
      </div>
      <form data-form="saldoReal" data-id="${esc(d.id)}" style="margin-top:14px">
        <div class="field"><label for="sreal">¿El banco dice otro saldo? Actualízalo con el extracto</label>
          <div class="row"><input id="sreal" name="sreal" class="input money" style="font-size:18px;flex:2;min-width:0" inputmode="numeric" placeholder="${esc(pesos(st.saldo))}" required><button class="btn soft" style="flex:1">Actualizar</button></div></div>
      </form>
      <h3 style="font:700 16px var(--f-display);margin:18px 0 8px">Historial de pagos</h3>
      <div class="list">${lista.map((x, i) => `<button class="item" style="--i:${i}" data-act="verGasto" data-id="${esc(x.id)}">
        <span class="ico" style="background:var(--${x.pagadoPor === 'b' ? 'verde' : 'azul'})">${esc(ini(x.pagadoPor))}</span>
        <span class="t"><b>${x.abono ? 'Abono a capital' : 'Pago'} · ${esc(nombreDia(x.fecha))}</b><small>${esc(nom(x.pagadoPor))}${x.interes ? ' · interés ' + pesos(x.interes) + ' · capital ' + pesos(x.capital ?? x.monto) : ''}</small></span>
        <span class="m">${pesos(x.monto)}</span></button>`).join('') || '<p class="muted">Aún no hay pagos registrados.</p>'}</div>
      <div class="row" style="margin-top:14px"><button class="btn ghost" data-act="editarDeuda" data-id="${esc(d.id)}">Editar datos</button>${st.saldo > 0 ? `<button class="btn" data-act="pagarDeuda" data-id="${esc(d.id)}">Registrar pago</button>` : ''}</div>`;
  }
  function formMeta(m = {}) {
    return `<h2>${m.id ? 'Editar meta' : 'Nueva meta'}</h2>
      <form data-form="meta" data-id="${esc(m.id || '')}">
        <div class="field"><label for="mnombre">¿Para qué ahorran?</label><input id="mnombre" name="mnombre" class="input" maxlength="40" required value="${esc(m.nombre || '')}" placeholder="Ej: Viaje a Cartagena" autofocus></div>
        <div class="field"><label for="mobj">Valor de la meta</label>${dinero('mobj', m.objetivo, 'required')}</div>
        <div class="field"><label for="mfecha">¿Para cuándo? (opcional)</label><input id="mfecha" name="mfecha" type="date" class="input" value="${esc(m.fechaLimite || '')}"></div>
        <button class="btn full">Guardar meta</button>
        ${m.id ? `<div id="borrarZona"><button type="button" class="btn danger full" data-act="pedirBorrar" data-col="metas" data-id="${esc(m.id)}">Eliminar meta</button></div><p class="muted" style="font-size:12px;text-align:center">Si ya tiene aportes, la archivamos para no perder su historial.</p>` : ''}
      </form>`;
  }
  function formAporte(m, x = null) {
    const st = estadoMeta(m);
    return `<h2>${x ? 'Editar aporte' : 'Aporte a ' + esc(m.nombre)}</h2>
      <p class="muted" style="margin-top:-6px">${x ? esc(m.nombre) + ' · ' : ''}Llevan ${pesos(st.ahorrado)} de ${pesos(m.objetivo)}. El ahorro no cuenta como gasto.</p>
      <form data-form="aporte" data-id="${esc(m.id)}" data-aid="${esc(x?.id || '')}">
        <div class="field"><label for="amonto">Valor</label>${dinero('amonto', x ? x.monto : st.sugerido, 'required autofocus')}${!x && st.sugerido ? '<small class="muted">Sugerido para llegar a tiempo. Cámbienlo si quieren.</small>' : ''}</div>
        <div class="field"><span class="lab">¿Quién aporta?</span>${seg('aquien', quienes(), x?.quien || yo())}</div>
        ${x ? `<div class="field"><label for="afecha">Fecha</label><input id="afecha" name="afecha" type="date" class="input" value="${esc(x.fecha || hoy())}" required></div>` : ''}
        <button class="btn full">${x ? 'Guardar cambios' : 'Aportar'}</button>
        ${x ? `<div id="borrarZona"><button type="button" class="btn danger full" data-act="pedirBorrar" data-col="aportes" data-id="${esc(x.id)}">Eliminar aporte</button></div>` : ''}
      </form>`;
  }
  function formIngreso(x = {}, aviso = '') {
    return `<h2>${x.id ? 'Editar ingreso extra' : 'Ingreso extra'}</h2>
      <p class="muted" style="margin-top:-6px">Primas, ventas, trabajos extra. Los sueldos fijos van en Ajustes.</p>
      ${aviso ? `<div class="banner" style="margin-bottom:12px">${aviso}</div>` : ''}
      <form data-form="ingreso" data-id="${esc(x.id || '')}">
        <div class="field"><label for="imonto">Valor</label>${dinero('imonto', x.monto, 'required autofocus')}</div>
        <div class="field"><label for="idesc">Descripción</label><input id="idesc" name="idesc" class="input" maxlength="40" value="${esc(x.desc || '')}" placeholder="Ej: Prima de diciembre"></div>
        <div class="field"><span class="lab">¿De quién?</span>${seg('iquien', quienes(), x.quien || yo())}</div>
        <div class="field"><label for="ifecha">Fecha</label><input id="ifecha" name="ifecha" type="date" class="input" value="${esc(x.fecha || hoy())}" required></div>
        <button class="btn full">Guardar</button>
        ${x.id ? `<div id="borrarZona"><button type="button" class="btn danger full" data-act="pedirBorrar" data-col="ingresos" data-id="${esc(x.id)}">Eliminar</button></div>` : ''}
      </form>`;
  }
  function formAjustes(inicial) {
    const c = S.cfg || cfgBase();
    const p = c.presupuestos || {};
    return `<h2>${inicial ? 'Su presupuesto' : 'Ajustes'}</h2>
      ${!inicial && S.modo === 'nube' ? vistaVinculados() : ''}
      ${!inicial && S.modo === 'local' ? `<button class="btn soft full" style="margin-bottom:14px" data-act="conectar">${ICON.users} Vincular con mi pareja</button>` : ''}
      <form data-form="ajustes" data-inicial="${inicial ? 1 : ''}">
        <div class="row"><div class="field"><label for="na">${inicial ? 'Tu nombre' : 'Persona 1'}</label><input id="na" name="na" class="input" maxlength="20" required value="${esc(c.nombres.a)}" ${inicial ? 'autofocus' : ''}></div>
          <div class="field"><label for="nb">${inicial ? 'Tu pareja' : 'Persona 2'}</label><input id="nb" name="nb" class="input" maxlength="20" required value="${esc(c.nombres.b)}"></div></div>
        <div class="row"><div class="field"><label for="ia">Ingreso mensual 1</label>${dinero('ia', c.ingresos.a)}</div>
          <div class="field"><label for="ib">Ingreso mensual 2</label>${dinero('ib', c.ingresos.b)}</div></div>
        <div class="field"><span class="lab">¿Cómo reparten los gastos compartidos?</span>${seg('reparto', [['proporcional', 'Según ingresos'], ['mitad', 'Mitad y mitad'], ['custom', 'Personalizado']], c.reparto)}</div>
        <div class="field" id="campoPct" ${c.reparto === 'custom' ? '' : 'hidden'}><label for="pcta">% que pone la persona 1</label><input id="pcta" name="pcta" class="input" inputmode="numeric" value="${esc(c.pctA)}"></div>
        <div class="field"><label for="meta">Meta de ahorro mensual (% de los ingresos)</label><input id="meta" name="meta" class="input" inputmode="numeric" value="${esc(c.metaAhorroPct)}"></div>
        ${inicial ? '' : `<div class="row"><div class="field"><label for="ma">Plata personal de ${esc(c.nombres.a || '1')}</label>${dinero('ma', c.mesada?.a)}</div><div class="field"><label for="mb">Plata personal de ${esc(c.nombres.b || '2')}</label>${dinero('mb', c.mesada?.b)}</div></div>
          <small class="muted" style="margin-top:-8px">Un monto al mes para que cada uno gaste en lo suyo sin dar explicaciones. Cuenta los gastos marcados como «de» esa persona.</small>`}
        ${inicial ? '' : `<label class="check" for="rec"><input type="checkbox" id="rec" name="rec" ${c.recordatorios === false ? '' : 'checked'}><span>Avisarme en el celular cuando venzan deudas y gastos fijos</span></label>
          <label class="check" for="notifm"><input type="checkbox" id="notifm" name="notifm" ${ls.get('tuyyo:notifMontos') ? 'checked' : ''}><span>Mostrar nombres y montos en las notificaciones (se ven con el celular bloqueado)</span></label>`}
        ${inicial ? '' : (() => { const r = resumenDist(c.presupuestos || {}); return `<button type="button" class="dist-acceso" data-act="distribucion">
          <span class="ico" style="background:var(--azul)">${ICON.target}</span><span><b>Distribución del presupuesto</b><small>${CATS.filter(k => !k.oculta && k.id !== 'deudas').length} categorías · ${r.ing ? (r.libre >= 0 ? 'sin asignar ' + pesos(r.libre) : 'se pasan por ' + pesos(-r.libre)) : 'agrega los ingresos'}</small></span>${ICON.right}</button>`; })()}
        <button class="btn full">${inicial ? 'Empezar' : 'Guardar ajustes'}</button>
      </form>
      ${inicial ? '' : `<div style="display:grid;gap:10px;margin-top:18px">
        <button type="button" class="dist-acceso" data-act="legal"><span class="ico" style="background:var(--verde)">${ICON.escudo}</span><span><b>Privacidad y legal</b><small>Política, términos, tus autorizaciones, exportar y eliminar tus datos</small></span>${ICON.right}</button>
        <button class="btn ghost full" data-act="exportar">Exportar todos los movimientos (Excel)</button>
        ${S.modo === 'nube' ? `<button class="btn ghost full" data-act="desconectar">Dejar de sincronizar en este celular</button><p class="muted" style="font-size:12px;margin:-4px 0 0;text-align:center">Los datos del hogar siguen en la nube para tu pareja. Para borrarlos usa Eliminar mis datos.</p>` : ''}
        <p class="muted" style="font-size:12px;text-align:center">Modo: ${S.modo === 'nube' ? 'vinculados y sincronizados' : 'solo este celular'}</p></div>`}`;
  }
  function vistaVincular() {
    return `<h2>Vincular con tu pareja</h2>
      <div class="vinc-hero" aria-hidden="true"><span class="av a">${esc(ini('a'))}</span><span class="vinc-line"></span><span class="av b">${esc(ini('b'))}</span></div>
      <ul class="vinc-lista">
        <li>Los dos ven y editan todo en vivo: gastos, deudas, metas, presupuestos y ajustes.</li>
        <li>Cada movimiento queda con el nombre de quien lo registró, y te avisamos cuando tu pareja agrega algo.</li>
        <li>Lo que ya tienes en este celular se sube y lo verá tu pareja.</li>
        <li>Solo entran dos personas, con un código que vence en 48 horas.</li>
      </ul>
      <div class="aviso">${L.avisoVincular}</div>
      <button class="btn full" data-act="crearCodigo">${ICON.link} Crear código para mi pareja</button>`;
  }
  function vistaVinculados() {
    const dos = S.members.length >= 2;
    const otroP = yo() === 'a' ? 'b' : 'a';
    return `<section class="vinc-card">
      <div class="vinc-hero small" aria-hidden="true"><span class="av a">${esc(ini('a'))}</span><span class="vinc-line ${dos ? 'on' : ''}"></span><span class="av b">${esc(ini('b'))}</span></div>
      <b>${dos ? `${esc(nom(yo()))} (tú) y ${esc(nom(otroP))} están vinculados` : 'Esperando a tu pareja'}</b>
      <small>${dos ? 'Los dos tienen el mismo control: ven, agregan, editan y borran todo. Los cambios llegan al instante.' : 'Comparte el código para que tu pareja entre desde su celular.'}</small>
      <div style="display:grid;gap:8px;margin-top:10px">
        ${dos ? '' : `<button class="btn full" data-act="invitar">${ICON.link} Ver código para mi pareja</button>`}
        ${dos ? `<div id="reZona"><button class="btn ghost full" data-act="pedirReinvitar">Mi pareja cambió de celular</button></div>` : ''}
      </div></section>`;
  }
  function formConectar() {
    return `<h2>Conectar con tu pareja</h2>
      <p class="muted" style="margin-top:-6px">Para que los dos vean lo mismo en vivo, la app guarda los datos en tu propio proyecto gratuito de Firebase.</p>
      <ol style="padding-left:20px;display:grid;gap:6px;font-size:14px">
        <li>Entra a console.firebase.google.com y crea un proyecto (plan gratis Spark).</li>
        <li>En Authentication, activa el acceso <b>Anónimo</b>.</li>
        <li>Crea una base Firestore y pega las reglas del archivo <b>firestore.rules</b> del repositorio.</li>
        <li>En Configuración del proyecto, agrega una app Web y copia el bloque <b>firebaseConfig</b>.</li>
      </ol>
      <form data-form="crearHogar">
        <div class="field"><label for="fbcfg">Pega aquí el firebaseConfig</label><textarea id="fbcfg" name="fbcfg" class="input" required placeholder='const firebaseConfig = { apiKey: "...", projectId: "...", appId: "..." };'></textarea></div>
        <button class="btn full" id="btnCrear">Crear nuestro hogar en la nube</button>
      </form>`;
  }
  function formUnirme() {
    return `<h2>Unirme a mi pareja</h2>
      <p class="muted" style="margin-top:-6px">En el celular de tu pareja: Ajustes → Vincular con mi pareja. Escribe aquí el código de 6 letras que le aparece.</p>
      <div class="aviso">${L.avisoVincular}</div>
      <form data-form="unirme">
        <div class="field"><label for="codigo">Código de tu pareja</label>${CONFIG_APP
          ? '<input id="codigo" name="codigo" class="input code-in" required maxlength="400" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC-123" autofocus>'
          : '<textarea id="codigo" name="codigo" class="input" required placeholder="TUYYO-..." autofocus></textarea>'}</div>
        <button class="btn full" id="btnUnir">Vincularme</button>
      </form>`;
  }
  function vistaCodigo(cod, ejemplo = false) {
    const corto = cod.length === 6;
    return `<h2>${ejemplo ? 'Así se ve el código' : '¡Listo! Ahora tu pareja'}</h2>
      <p class="muted" style="margin-top:-6px">Comparte este código solo con tu pareja: con él se puede ver y editar todo el presupuesto. ${corto ? 'En su celular, tu pareja instala TU Y YO, toca «Mi pareja ya lo creó» y escribe este código. Vence en 48 horas y sirve para una sola persona.' : 'Envíale este código. En su celular abre TU Y YO, toca «Mi pareja ya lo creó» y lo pega. Solo entran dos personas.'}</p>
      ${corto ? `<div class="code-big" id="codTxt" tabindex="0" aria-label="Código ${esc(cod.split('').join(' '))}">${esc(conGuion(cod))}</div>${ejemplo ? '<p class="muted" style="text-align:center;margin:-4px 0 8px;font-size:12px">Código de ejemplo: en la app se genera uno real.</p>' : ''}`
        : `<div class="code" id="codTxt" tabindex="0">${esc(cod)}</div>`}
      <div class="row" style="margin-top:12px"><button class="btn" data-act="compartirCod" ${ejemplo ? 'disabled' : ''}>Compartir</button><button class="btn soft" data-act="copiarCod">Copiar</button></div>
      <p class="muted" style="font-size:13px;margin-top:14px">Cuando tu pareja entre, verás aquí: «${esc(nom('b'))} se unió».</p>`;
  }

  /* ---------- Privacidad y legal (Ley 1581 de 2012) ---------- */
  const CONSENT = 'tuyyo:consentimiento';
  const consentOk = () => { const c = ls.get(CONSENT); return !!(c && c.version === L.version && c.acepta); };
  const DOCS_LEGAL = { politica: 'Política de Tratamiento de Datos', terminos: 'Términos y Condiciones', eliminacion: 'Cómo eliminar tus datos' };
  function vistaConsentimiento(sig) {
    const crea = sig === 'setup';
    const intro = String(L.autorizacion || '').replace(/<p>☐[\s\S]*?<\/p>/g, '');
    const link = k => `<button type="button" class="link" data-act="legalDoc" data-k="${k}" data-volver="${esc(sig)}">${esc(DOCS_LEGAL[k])}</button>`;
    return `<div class="legal consent">${intro}</div>
      <form data-form="consentimiento" data-sig="${esc(sig)}">
        <label class="check fuerte" for="cacepta"><input type="checkbox" id="cacepta" name="cacepta" required><span><b>Soy mayor de 18 años</b>, leí y acepto la ${link('politica')} y los ${link('terminos')}, y autorizo el tratamiento de mis datos para estas finalidades, incluida su transmisión a Google Firebase en Estados Unidos.</span></label>
        ${crea ? '<label class="check fuerte" for="cterceros"><input type="checkbox" id="cterceros" name="cterceros" required><span>Si escribo datos de mi pareja, declaro que cuento con su autorización.</span></label>' : ''}
        <button class="btn full">Aceptar y continuar</button>
      </form>
      ${sig === 'continuar' ? '<button type="button" class="btn ghost full" style="margin-top:10px" data-act="eliminarDatos">No acepto: eliminar mis datos</button>' : '<button type="button" class="btn ghost full" style="margin-top:10px" data-act="noAcepto">Ahora no</button>'}
      <p class="muted" style="font-size:12px;text-align:center">Versión de los textos: ${esc(L.version)}</p>`;
  }
  function pedirConsentimiento(sig) {
    S.bloqueo = sig === 'continuar';
    abrir(vistaConsentimiento(sig));
  }
  let consentFirma = '';
  function sincronizarConsentimiento() {
    if (!S.cfg || !S.cfg.nombres?.a || !consentOk()) return;
    const p = yo(), rec = ls.get(CONSENT), act = (S.cfg.consentimientos || {})[p];
    if (act && act.version === rec.version) return;
    const firma = p + rec.version + (S.hogarId || '');
    if (consentFirma === firma) return; consentFirma = firma;
    Store.guardarCampoCfg('consentimientos.' + p, { version: rec.version, fecha: rec.fecha, persona: p, mayorEdad: true, terceros: !!rec.terceros })
      .catch(err => { console.error(err); consentFirma = ''; });
  }
  function vistaLegal() {
    const op = (act, ico, col, t, d, extra = '') => `<button data-act="${act}" ${extra}><span class="ico" style="background:${col}">${ico}</span><span><b>${t}</b><small>${d}</small></span></button>`;
    return `<h2>Privacidad y legal</h2>
      <p class="muted" style="margin-top:-6px">TU Y YO no tiene publicidad, no vende datos y no usa analítica. Tus datos son tuyos.</p>
      <div class="menu">
        ${op('legalDoc', ICON.doc, 'var(--azul)', 'Política de Tratamiento de Datos', 'Qué datos guardamos, para qué y tus derechos', 'data-k="politica"')}
        ${op('legalDoc', ICON.doc, '#5B7BE0', 'Términos y Condiciones', 'Las reglas de uso de la app', 'data-k="terminos"')}
        ${op('misAut', ICON.escudo, 'var(--verde)', 'Mis autorizaciones', 'Cuándo y qué aceptaron')}
        ${op('exportar', ICON.up, '#2F9FB3', 'Exportar mis datos', 'Todos los movimientos en un archivo para Excel')}
        ${op('eliminarDatos', ICON.basura, 'var(--bad)', 'Eliminar mis datos', 'De este celular o de todo el hogar')}
        ${L.contacto && !L.contacto.includes('[') ? op('legalDoc', ICON.mail, '#8C8399', 'Contacto', esc(L.contacto), 'data-k="eliminacion"') : ''}
      </div>
      <p class="muted" style="font-size:12px;text-align:center;margin-top:14px">Versión de los textos legales: ${esc(L.version)}</p>`;
  }
  function vistaDocLegal(k, volver) {
    return `<h2>${esc(DOCS_LEGAL[k] || 'Legal')}</h2><div class="legal">${L[k] || ''}</div>
      <button class="btn ghost full" style="margin-top:14px" data-act="${volver ? 'consentir' : 'legal'}" data-sig="${esc(volver || '')}">Volver</button>`;
  }
  function vistaMisAut() {
    const loc = ls.get(CONSENT), cs = S.cfg?.consentimientos || {};
    const fila = (t, r) => r ? `<div class="cita-row"><span>${esc(t)}</span><b>${esc(new Date(r.fecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }))} · v${esc(r.version)}</b></div>` : `<div class="cita-row"><span>${esc(t)}</span><b class="muted">Aún no</b></div>`;
    return `<h2>Mis autorizaciones</h2>
      <div class="cita">${fila('En este celular', loc)}${S.cfg?.nombres?.a ? fila(nom('a'), cs.a) + fila(nom('b'), cs.b) : ''}</div>
      <p class="muted" style="font-size:13px">Autorizaron el tratamiento de sus datos para ver su presupuesto y compartirlo entre los dos, incluida su transmisión a Google Firebase (Estados Unidos). Pueden revocarla eliminando sus datos.</p>
      <button class="btn ghost full" data-act="legal">Volver</button>`;
  }
  function vistaEliminar() {
    const nube = S.modo === 'nube';
    return `<h2>Eliminar mis datos</h2>
      <p class="muted" style="margin-top:-6px">Esto no se puede deshacer. Si quieren guardar una copia, primero exporten los movimientos.</p>
      <form data-form="eliminar">
        <div class="opciones">
          <label class="check"><input type="radio" name="alcance" value="local" checked><span><b>Solo de este celular</b><br><small class="muted">Borra los datos y la vinculación de este celular.${nube ? ' El hogar sigue en la nube para tu pareja.' : ''}</small></span></label>
          ${nube ? `<label class="check"><input type="radio" name="alcance" value="hogar"><span><b>Todo el hogar, para los dos</b><br><small class="muted">Borra de la nube todos los gastos, deudas, metas, cuentas y ajustes. ${esc(nom(otro(yo())))} también los pierde.</small></span></label>` : ''}
        </div>
        <div class="field"><label for="confirmar">Para confirmar, escribe ELIMINAR</label><input id="confirmar" name="confirmar" class="input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ELIMINAR"></div>
        <button class="btn danger full">Eliminar definitivamente</button>
      </form>
      <button class="btn ghost full" style="margin-top:10px" data-act="legal">Cancelar</button>`;
  }

  /* ---------- Logros, niveles, rachas y retos ---------- */
  const LOGROS = [
    { id: 'primer_paso', n: 'Primer paso', d: 'Registraron su primer gasto', m: 'bronce', xp: 10 },
    { id: 'equipo', n: 'Somos equipo', d: 'Se vincularon los dos', m: 'bronce', xp: 10 },
    { id: 'bitacora_7', n: 'Una semana al día', d: 'Registraron algo 7 días seguidos', m: 'bronce', xp: 10 },
    { id: 'bitacora_30', n: 'Mes impecable', d: '30 días seguidos registrando', m: 'plata', xp: 25 },
    { id: 'factura_magica', n: 'Ojo de águila', d: 'Escanearon 5 facturas', m: 'bronce', xp: 10, ind: true },
    { id: 'a_viva_voz', n: 'A viva voz', d: 'Dictaron 10 gastos', m: 'bronce', xp: 10, ind: true },
    { id: 'cuentas_claras', n: 'Cuentas claras', d: 'Saldaron cuentas entre los dos', m: 'bronce', xp: 10 },
    { id: 'cita_1', n: 'Primera cita de dinero', d: 'Hicieron su primera cita de dinero', m: 'bronce', xp: 10 },
    { id: 'cita_3', n: 'Constantes', d: '3 citas de dinero seguidas', m: 'plata', xp: 25 },
    { id: 'cita_6', n: 'Socios de vida', d: '6 citas de dinero seguidas', m: 'oro', xp: 50 },
    { id: 'en_presupuesto', n: 'Dentro del plan', d: 'Cerraron un mes sin pasarse en ninguna categoría con tope', m: 'plata', xp: 25 },
    { id: 'ahorradores', n: 'Ahorradores', d: 'Cumplieron la meta de ahorro de un mes', m: 'plata', xp: 25 },
    { id: 'fijos_al_dia', n: 'Nada pendiente', d: 'Pagaron completos todos los gastos fijos de un mes', m: 'plata', xp: 25 },
    { id: 'meta_cumplida', n: 'Meta cumplida', d: 'Llegaron al 100% de una meta', m: 'oro', xp: 50 },
    { id: 'adios_deuda', n: 'Libres de esta deuda', d: 'Terminaron de pagar una deuda', m: 'oro', xp: 50 },
    { id: 'abono_extra', n: 'Le ganamos a los intereses', d: 'Hicieron un abono extra a capital', m: 'bronce', xp: 10 }
  ];
  const RETOS = [
    { id: 'sin_domicilios', n: 'Una semana sin domicilios', d: '7 días sin pedir domicilios (Rappi, iFood, DiDi Food).' },
    { id: 'cocina_casa', n: 'Cocinemos en casa', d: 'Gastar en comida fuera la mitad o menos que el mes pasado.' },
    { id: 'diversion_tope', n: 'Diversión con tope', d: 'No pasarse del presupuesto de diversión este mes.' },
    { id: 'ahorro_hormiga', n: 'Ahorro hormiga', d: 'Hacer 4 aportes a sus metas, en semanas distintas.' },
    { id: 'cero_impulso', n: 'Cero compras impulsivas', d: 'Terminar el mes sin gastos marcados para hablar.' }
  ];
  const METAL = { bronce: 'bronce', plata: 'plata', oro: 'oro' };
  const NIVELES = ['Recién organizados', 'Buen equipo', 'Ahorradores', 'Estrategas', 'Imparables', 'Dueños de sus finanzas'];
  const medallaReto = id => `<svg viewBox="-50 -56 100 112" role="img" aria-label="Insignia de reto"><defs><linearGradient id="m-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E7A46B"/><stop offset=".55" stop-color="#9A5B2A"/><stop offset="1" stop-color="#5A3416"/></linearGradient></defs><path d="M-18 30 L-26 54 L-14 48 L-8 58 L0 34 Z" fill="#3552E8"/><path d="M18 30 L26 54 L14 48 L8 58 L0 34 Z" fill="#13B176"/><circle r="40" fill="url(#m-${id})"/><circle r="31" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/><path d="M0 -18 L5.3 -6.5 L18 -5.6 L8.4 2.8 L11.2 15.2 L0 8.6 L-11.2 15.2 L-8.4 2.8 L-18 -5.6 L-5.3 -6.5 Z" fill="#fff"/></svg>`;
  const insignia = id => RECS.insignias[id] || medallaReto(String(id).replace(/[^a-z_]/g, ''));
  const diaMenos = (f, n) => { const [y, m, d] = f.split('-').map(Number); const x = new Date(y, m - 1, d - n); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };
  // Días seguidos con al menos un movimiento; un comodín por semana perdona un día.
  function rachaDiaria() {
    const dias = new Set([...S.gastos, ...S.ingresos, ...S.aportes].map(x => x.fecha).filter(Boolean));
    if (!dias.size) return 0;
    let k = dias.has(hoy()) ? 0 : 1, racha = 0, ultima = 0, comodinSemana = -1;
    for (let n = 0; n < 400; n++, k++) {
      const f = diaMenos(hoy(), k), semana = Math.floor(n / 7);
      if (dias.has(f)) { racha = n + 1; ultima = racha; continue; }
      if (comodinSemana === semana) break;
      comodinSemana = semana;
    }
    return ultima;
  }
  function mesesCerrados() {
    const fechas = S.gastos.map(x => x.fecha).filter(Boolean).sort();
    if (!fechas.length) return [];
    const out = []; let m = mesDe(fechas[0]); const fin = mesDe(hoy());
    while (m < fin && out.length < 36) { out.push(m); m = sumarMes(m, 1); }
    return out;
  }
  const dentroDelPlan = m => {
    const pres = S.cfg?.presupuestos || {}, c = calcular(m);
    const topes = Object.entries(pres).filter(([k, v]) => v > 0 && k !== 'deudas' && CAT[k] && !CAT[k].oculta);
    return c.g.length > 0 && topes.length >= 3 && topes.every(([k, v]) => (c.porCat[k] || 0) <= v);
  };
  const quienMas = xs => { const a = xs.filter(x => (x.por || x.pagadoPor) === 'a').length, b = xs.length - a; return a === b ? 'ambos' : a > b ? 'a' : 'b'; };
  function retoCumplido(r) {
    if (!r || !r.id) return false;
    const mesHoy = mesDe(hoy()), cerrado = r.mes < mesHoy;
    const delMes = S.gastos.filter(x => mesDe(x.fecha) === r.mes);
    if (r.id === 'sin_domicilios') {
      const fin = diaMenos(r.inicio, -6); if (hoy() <= fin) return false;
      return !S.gastos.some(x => x.fecha >= r.inicio && x.fecha <= fin && /domicilio|rappi|ifood|didi/i.test(normalizarTxt(x.desc)));
    }
    if (r.id === 'cocina_casa') { const ant = calcular(sumarMes(r.mes, -1)).porCat.comida || 0; return cerrado && ant > 0 && (calcular(r.mes).porCat.comida || 0) <= ant * .5; }
    if (r.id === 'diversion_tope') { const tope = S.cfg?.presupuestos?.diversion || 0; return cerrado && tope > 0 && (calcular(r.mes).porCat.diversion || 0) <= tope; }
    if (r.id === 'ahorro_hormiga') return new Set(S.aportes.filter(x => mesDe(x.fecha) === r.mes).map(x => Math.ceil(Number(x.fecha.slice(8)) / 7))).size >= 4;
    if (r.id === 'cero_impulso') return cerrado && delMes.length > 0 && !delMes.some(x => x.revisar || x.habladoPor);
    return false;
  }
  function logrosCumplidos() {
    const c = {};
    if (S.gastos.length) c.primer_paso = 'ambos';
    if (S.modo === 'nube' && S.members.length === 2) c.equipo = 'ambos';
    const rd = rachaDiaria(); if (rd >= 7) c.bitacora_7 = 'ambos'; if (rd >= 30) c.bitacora_30 = 'ambos';
    const fac = S.gastos.filter(x => x.origen === 'factura'); if (fac.length >= 5) c.factura_magica = quienMas(fac);
    const voz = S.gastos.filter(x => x.origen === 'voz'); if (voz.length >= 10) c.a_viva_voz = quienMas(voz);
    if (S.gastos.some(x => x.categoria === 'ajuste')) c.cuentas_claras = 'ambos';
    if (S.citas.some(x => x.hecho)) c.cita_1 = 'ambos';
    const rc = rachaCitas(); if (rc >= 3) c.cita_3 = 'ambos'; if (rc >= 6) c.cita_6 = 'ambos';
    const cerrados = mesesCerrados();
    if (cerrados.some(dentroDelPlan)) c.en_presupuesto = 'ambos';
    if (cerrados.some(m => { const x = calcular(m); return x.metaAhorro > 0 && x.ahorro >= x.metaAhorro; })) c.ahorradores = 'ambos';
    if (cerrados.some(m => { const fs = S.fijos.filter(f => f.activo !== false && !(f.saltos || []).includes(m)); return fs.length >= 2 && fs.every(f => estadoFijo(f, m).estado === 'pagado'); })) c.fijos_al_dia = 'ambos';
    if (S.metas.some(m => m.objetivo > 0 && estadoMeta(m).aportado >= m.objetivo)) c.meta_cumplida = 'ambos';
    if (S.deudas.some(d => d.saldoInicial > 0 && estadoDeuda(d).saldo === 0)) c.adios_deuda = 'ambos';
    if (S.gastos.some(x => x.abono === true)) c.abono_extra = 'ambos';
    for (const m of S.metas) { const p = estadoMeta(m).pctLogrado * 100; for (const h of [25, 50, 75, 100]) if (m.objetivo > 0 && p >= h) c['meta_' + m.id + '_' + h] = 'ambos'; }
    if (retoCumplido(S.cfg?.reto)) c['reto_' + S.cfg.reto.id] = 'ambos';
    return c;
  }
  function calcXP() {
    const ya = S.cfg?.logros || {};
    let xp = sum(LOGROS.filter(l => ya[l.id]), l => l.xp);
    for (const k of Object.keys(ya)) { if (/^meta_.+_(25|50|75|100)$/.test(k)) xp += 5; else if (k.startsWith('reto_')) xp += 20; }
    xp += S.citas.filter(x => x.hecho).length * 10;
    const desde = diaMenos(hoy(), 89);
    xp += new Set([...S.gastos, ...S.ingresos, ...S.aportes].map(x => x.fecha).filter(f => f && f >= desde && f <= hoy())).size;
    return xp;
  }
  function nivelDe(xp) {
    let k = 0; while (25 * (k + 1) * (k + 2) <= xp) k++;
    const n = k + 1, ini = 25 * k * (k + 1), sig = 25 * (k + 1) * (k + 2);
    return { n, nombre: NIVELES[Math.min(n, 6) - 1], ini, sig, prog: (xp - ini) / (sig - ini) };
  }
  const logroVisto = () => new Set(ls.get('tuyyo:logrosVistos') || []);
  const hayLogroNuevo = () => { const ya = S.cfg?.logros || {}; const rev = ls.get('tuyyo:logrosRevisados') || 0; return Object.entries(ya).some(([k, v]) => !k.startsWith('meta_') && (v.en || 0) > rev); };
  let firmaLogros = '', colaLogros = [];
  function evaluarLogros() {
    if (!S.cfg || !S.cfg.nombres?.a || S.modo === 'cargando') return;
    const firma = COLS.map(c => S[c].length).join(',') + '|' + S.members.length + S.modo + JSON.stringify(S.cfg.reto || null) + hoy() + sum(S.gastos) + sum(S.aportes) + Object.keys(S.cfg.logros || {}).length;
    if (firma === firmaLogros) return; firmaLogros = firma;
    const ya = S.cfg.logros || {}, cumple = logrosCumplidos();
    const nuevos = Object.keys(cumple).filter(k => !ya[k]);
    let vistos = ls.get('tuyyo:logrosVistos');
    // Al estrenar esta versión (o en un celular nuevo) no se celebra lo que ya habían logrado.
    if (vistos === null) { vistos = [...Object.keys(ya), ...nuevos]; ls.set('tuyyo:logrosVistos', vistos); }
    if (nuevos.length) {
      const ahora = Date.now();
      Store.guardarCamposCfg(Object.fromEntries(nuevos.map(k => ['logros.' + k, { en: ahora, por: cumple[k] }]))).catch(err => console.error('logros', err));
    }
    const set = new Set(vistos);
    const porCelebrar = Object.keys({ ...ya, ...Object.fromEntries(nuevos.map(k => [k, 1])) }).filter(k => !set.has(k));
    if (!porCelebrar.length) return;
    ls.set('tuyyo:logrosVistos', [...set, ...porCelebrar]);
    for (const k of porCelebrar) {
      const hm = k.match(/^meta_(.+)_(25|50|75)$/);
      if (hm) { const m = S.metas.find(x => x.id === hm[1]); if (m) setTimeout(() => { toast(`¡Van en el ${hm[2]}% de ${m.nombre}!`); confeti(); }, 600); continue; }
      if (/^meta_.+_100$/.test(k)) continue;
      colaLogros.push(k);
    }
    setTimeout(siguienteLogro, 700);
  }
  function siguienteLogro() {
    if (document.querySelector('.logro-up') || !colaLogros.length) return;
    mostrarLogro(colaLogros.shift());
  }
  function mostrarLogro(id) {
    const l = LOGROS.find(x => x.id === id) || (id.startsWith('reto_') ? { n: '¡Reto cumplido!', d: (RETOS.find(r => 'reto_' + r.id === id) || {}).n || 'Reto del mes', m: 'bronce', xp: 20 } : null);
    if (!l) return;
    const box = document.createElement('div'); box.className = 'logro-up';
    box.innerHTML = `<div class="lu-fondo" data-act="cerrarLogro"></div><div class="lu-card ${l.m}" role="dialog" aria-modal="true" aria-labelledby="luT">
      <div class="lu-medalla">${insignia(id)}</div>
      <small class="lu-eyebrow">Logro de ${METAL[l.m]} desbloqueado</small>
      <h2 id="luT">${esc(l.n)}</h2><p>${esc(l.d)}</p><b class="lu-xp">+${l.xp} XP</b>
      <button class="btn full" data-act="cerrarLogro" autofocus>¡Lo logramos!</button></div>`;
    document.body.appendChild(box);
    requestAnimationFrame(() => box.classList.add('on'));
    lluviaMonedas(26); vibrarP([30, 40, 60]);
    setTimeout(() => box.querySelector('.btn')?.focus(), 400);
  }
  function vistaLogros(filtro = 'todos') {
    const ya = S.cfg?.logros || {}, xp = calcXP(), nv = nivelDe(xp);
    const retos = Object.keys(ya).filter(k => k.startsWith('reto_')).map(k => ({ id: k, n: (RETOS.find(r => 'reto_' + r.id === k) || {}).n || 'Reto', d: 'Reto del mes cumplido', m: 'bronce', xp: 20 }));
    let lista = [...LOGROS, ...retos];
    if (filtro === 'dos') lista = lista.filter(l => ya[l.id] && (ya[l.id].por === 'ambos' || !l.ind));
    else if (filtro === 'mios') lista = lista.filter(l => ya[l.id] && ya[l.id].por === yo());
    else if (filtro === 'faltan') lista = lista.filter(l => !ya[l.id]);
    const chip = (v, t) => `<button class="chip" data-act="filtroLogros" data-f="${v}" aria-pressed="${filtro === v}">${t}</button>`;
    const hechos = LOGROS.filter(l => ya[l.id]).length;
    return `<h2>Sus logros</h2>
      <div class="nivel-top"><span class="nivel-n" aria-hidden="true">${nv.n}</span><div><div class="eyebrow">Nivel ${nv.n} · ${xp} XP</div><b>${esc(nv.nombre)}</b><div class="muted" style="font-size:13px">Faltan ${nv.sig - xp} XP para el nivel ${nv.n + 1}</div></div></div>
      <div class="track" style="margin:10px 0 12px"><div style="width:${Math.round(nv.prog * 100)}%;background:linear-gradient(90deg,var(--azul),var(--verde))"></div></div>
      <div class="rachas"><span>${ICON.fuego}<b>${rachaDiaria()}</b> días registrando</span><span>${ICON.cup}<b>${rachaCitas()}</b> citas seguidas</span><span>${ICON.target}<b>${hechos}</b> de ${LOGROS.length} logros</span></div>
      <div class="chips" role="group" aria-label="Filtrar logros" style="margin-top:12px">${chip('todos', 'Todos')}${chip('dos', 'De los dos')}${chip('mios', 'Míos')}${chip('faltan', 'Por lograr')}</div>
      <div class="medallas">${lista.map((l, i) => { const ok = !!ya[l.id]; return `<div class="medalla ${ok ? '' : 'bloq'}" style="--i:${i}"><div class="md">${insignia(l.id)}</div><b>${esc(l.n)}</b><small>${esc(l.d)}</small>${ok ? `<small class="cuando">${l.ind && ya[l.id].por !== 'ambos' ? esc(nom(ya[l.id].por)) + ' · ' : ''}${esc(haceDias(ya[l.id].en))}</small>` : `<small class="cuando">+${l.xp} XP</small>`}</div>`; }).join('') || '<p class="muted" style="grid-column:1/-1">Nada por aquí todavía.</p>'}</div>
      <p class="muted" style="font-size:12px;text-align:center">Ganan XP con cada logro, cada cita de dinero, cada hito de sus metas y cada día que registran.</p>`;
  }
  function vistaRetoCard() {
    const r = S.cfg?.reto, mesHoy = mesDe(hoy());
    const activo = r && r.mes === mesHoy && RETOS.find(x => x.id === r.id);
    const ya = r && S.cfg?.logros?.['reto_' + r.id];
    if (!activo) return `<button class="btn ghost full" style="margin-top:12px" data-act="elegirReto">${ICON.spark} Elegir un reto del mes</button>`;
    return `<div class="reto"><span class="ico" style="background:var(--ambar-soft);color:var(--ambar)">${ICON.spark}</span><div><div class="eyebrow">Reto de ${esc(nombreMes(mesHoy, { month: 'long' }))}</div><b>${esc(activo.n)}</b><p class="muted" style="margin:2px 0 0;font-size:13px">${ya ? '¡Lo lograron! +20 XP' : esc(activo.d)}</p></div><button class="btn ghost" data-act="elegirReto" style="padding:8px 12px">Cambiar</button></div>`;
  }
  function vistaRetos() {
    const r = S.cfg?.reto;
    return `<h2>Reto del mes</h2><p class="muted" style="margin-top:-6px">Uno a la vez. Si lo cumplen ganan 20 XP y una insignia.</p>
      <div class="menu">${RETOS.map((x, i) => `<button style="--i:${i}" data-act="ponerReto" data-r="${x.id}"><span class="ico" style="background:var(--ambar)">${ICON.spark}</span><span><b>${esc(x.n)}${r && r.id === x.id && r.mes === mesDe(hoy()) ? ' · activo' : ''}</b><small>${esc(x.d)}</small></span></button>`).join('')}</div>
      ${r && r.mes === mesDe(hoy()) ? '<button class="btn ghost full" style="margin-top:12px" data-act="quitarReto">Dejar el reto</button>' : ''}`;
  }

  /* ---------- Vista previa ---------- */
  function soloApp() {
    return `${vistaVincular().replace('data-act="crearCodigo"', 'data-act="codigoEjemplo"')}
      <p class="muted" style="font-size:13px;margin-top:12px">En esta vista previa la vinculación es de muestra: funciona de verdad en la app Android.</p>
      <button class="btn ghost full" style="margin-top:6px" data-act="reiniciar">Borrar datos de prueba y empezar de cero</button>`;
  }
  function cargarEjemplo() {
    const m0 = mesDe(hoy()), m1 = sumarMes(m0, -1), m2 = sumarMes(m0, -2);
    const dia = (m, d) => diaEn(m, d);
    const ahora = Date.now(), r = 7700000 > 0 ? 4500000 / 7700000 : .5;
    const cols = { gastos: {}, deudas: {}, metas: {}, aportes: {}, ingresos: {}, fijos: {}, cuentas: {}, citas: {} };
    let n = 0; const add = (c, o) => { cols[c]['e' + (n++)] = o; };
    const tsDe = f => { const t = new Date(f + 'T' + pad(8 + (n * 7) % 13) + ':' + pad((n * 17) % 60) + ':00').getTime(); return Math.min(t, ahora - (n % 9 + 1) * 37 * 60000); };
    const g = (m, d, desc, monto, cat, pago, tipo = 'compartido', extra = {}) => add('gastos', { desc, monto, fecha: dia(m, d), categoria: cat, pagadoPor: pago, tipo, ratioA: r, creado: tsDe(dia(m, d)), por: pago, ...extra });
    const fijo = o => { const id = 'e' + (n++); cols.fijos[id] = { activo: true, ...o }; return id; };
    const fArr = fijo({ nombre: 'Arriendo', monto: 1200000, dia: 1, categoria: 'hogar', pagadoPor: 'a', tipo: 'compartido' });
    const fEpm = fijo({ nombre: 'Servicios EPM', monto: 210000, dia: 6, categoria: 'hogar', pagadoPor: 'b', tipo: 'compartido' });
    const fNet = fijo({ nombre: 'Internet y celulares', monto: 145000, dia: 8, categoria: 'hogar', pagadoPor: 'a', tipo: 'compartido' });
    fijo({ nombre: 'Netflix', monto: 44900, dia: 3, categoria: 'diversion', pagadoPor: 'b', tipo: 'compartido', suscripcion: true });
    fijo({ nombre: 'Spotify Dúo', monto: 22900, dia: 20, categoria: 'diversion', pagadoPor: 'a', tipo: 'compartido', suscripcion: true });
    fijo({ nombre: 'Gimnasio', monto: 99000, dia: 10, categoria: 'salud', pagadoPor: 'a', tipo: 'a', suscripcion: true });
    const hoyDia = Number(hoy().slice(8));
    for (const [fid, fx] of Object.entries(cols.fijos)) for (const m of [m2, m1, m0]) {
      if (m === m0 && (fx.dia > hoyDia || fid === fNet)) continue;
      g(m, fx.dia, fx.nombre, fx.monto, fx.categoria, fx.pagadoPor, fx.tipo, { fijoId: fid });
    }
    for (const [m, k] of [[m2, 1.08], [m1, 1.15], [m0, 1]]) {
      const hasta = m === m0 ? Number(hoy().slice(8)) : 31;
      const gg = (d, desc, monto, cat, pago, tipo, extra) => { if (d <= hasta) g(m, d, desc, Math.round(monto * k / 100) * 100, cat, pago, tipo, extra); };
      gg(4, 'Mercado Éxito', 385000, 'mercado', 'a'); gg(10, 'Domicilio Rappi', 62000, 'comida', 'b'); gg(12, 'Cine y crispetas', 78000, 'diversion', 'b');
      gg(14, 'Gasolina Terpel', 120000, 'transporte', 'a'); gg(16, 'Mercado D1', 168000, 'mercado', 'b'); gg(18, 'Droguería Cruz Verde', 46000, 'salud', 'a', 'a');
      gg(20, 'Cena aniversario', 140000, 'diversion', 'a'); gg(22, 'Tenis', 189000, 'ropa', 'b', 'b', m === m1 ? { nota: 'Estaban en promoción, los necesitaba para correr' } : {}); gg(25, 'Comida de Luna', 95000, 'mascotas', 'b');
      gg(27, 'Almuerzo fuera', 58000, 'comida', 'a');
    }
    add('deudas', { tipo: 'tarjeta', nombre: 'Visa Oro', banco: 'Bancolombia', saldoInicial: 2400000, cuota: 300000, cupo: 5000000, tasa: 29, tasaTipo: 'ea', dia: 5, responsable: 'ambos', creado: ahora - 90 * 864e5 });
    add('deudas', { tipo: 'vehiculo', nombre: 'Crédito del carro', banco: 'Davivienda', saldoInicial: 18000000, cuota: 650000, tasa: 16, tasaTipo: 'ea', dia: 15, plazo: 48, cuotasPrevias: 10, responsable: 'a', creado: ahora - 90 * 864e5 });
    add('deudas', { tipo: 'personal', nombre: 'Préstamo de mi mamá', banco: 'Familiar o amigo', saldoInicial: 800000, cuota: 200000, dia: 2, responsable: 'b', creado: ahora - 90 * 864e5 });
    const ids = Object.keys(cols.deudas);
    for (const [m, quien] of [[m2, 'a'], [m1, 'b'], [m0, 'a']]) {
      add('gastos', { desc: 'Pago Visa Oro', monto: 300000, interes: 48000, capital: 252000, fecha: dia(m, 5), categoria: 'deudas', deudaId: ids[0], pagadoPor: quien, tipo: 'compartido', ratioA: r, creado: ahora - 50 * 864e5 });
      add('gastos', { desc: 'Pago Crédito del carro', monto: 650000, interes: 222000, capital: 428000, fecha: dia(m, 15), categoria: 'deudas', deudaId: ids[1], pagadoPor: 'a', tipo: 'a', creado: ahora - 50 * 864e5 });
      if (m === m0 && Number(hoy().slice(8)) < 2) continue;
      add('gastos', { desc: 'Pago Préstamo de mi mamá', monto: 200000, interes: 0, capital: 200000, fecha: dia(m, 2), categoria: 'deudas', deudaId: ids[2], pagadoPor: 'b', tipo: 'b', creado: ahora - 50 * 864e5 });
    }
    add('metas', { nombre: 'Viaje a Cartagena', objetivo: 3500000, fechaLimite: dia(sumarMes(m0, 8), 15) });
    add('metas', { nombre: 'Fondo de emergencia', objetivo: 6000000, fechaLimite: null });
    const metas = Object.keys(cols.metas);
    for (const m of [m2, m1, m0]) { add('aportes', { metaId: metas[0], monto: 300000, quien: 'a', por: 'a', fecha: dia(m, 2), creado: tsDe(dia(m, 2)) }); add('aportes', { metaId: metas[1], monto: 250000, quien: 'b', por: 'b', fecha: dia(m, 3), creado: tsDe(dia(m, 3)) }); }
    add('ingresos', { monto: 450000, desc: 'Venta de postres', quien: 'b', por: 'b', fecha: dia(m0, 1), creado: ahora - 5 * 3600e3 });
    g(m0, Math.max(1, Number(hoy().slice(8)) - 1), 'Pedido Amazon', 268000, 'otros', 'a', 'compartido', { revisar: true, nota: '¿De verdad necesitábamos la freidora de aire?' });
    g(m0, Math.max(1, Number(hoy().slice(8)) - 2), 'Regalo sorpresa', 150000, 'regalos', 'a', 'a', { privado: true });
    add('cuentas', { nombre: 'Cuenta de ahorros Bancolombia', tipo: 'banco', saldo: 3850000, dueno: 'ambos', actualizado: ahora - 3 * 864e5 });
    add('cuentas', { nombre: 'Cajita Nu', tipo: 'ahorro', saldo: 2100000, dueno: 'b', actualizado: ahora - 864e5 });
    add('cuentas', { nombre: 'CDT Davivienda', tipo: 'inversion', saldo: 5000000, dueno: 'a', actualizado: ahora - 20 * 864e5 });
    add('cuentas', { nombre: 'Cesantías Porvenir', tipo: 'cesantias', saldo: 4300000, dueno: 'a', actualizado: ahora - 30 * 864e5 });
    add('cuentas', { nombre: 'Carro (valor comercial)', tipo: 'bien', saldo: 42000000, dueno: 'a', actualizado: ahora - 60 * 864e5 });
    cols.citas[m2] = { mes: m2, hecho: true, fecha: dia(m2, 30), acuerdos: 'Cocinar en casa entre semana.' };
    cols.citas[m1] = { mes: m1, hecho: true, fecha: dia(m1, 30), acuerdos: 'Abonar $100.000 extra a la Visa y nada de domicilios entre semana.' };
    const cfg = Object.assign(cfgBase(), { nombres: { a: 'Andrés', b: 'Camila' }, ingresos: { a: 4500000, b: 3200000 }, mesada: { a: 300000, b: 300000 }, metaAhorroPct: 15,
      presupuestos: { mercado: 600000, hogar: 1650000, transporte: 250000, comida: 200000, diversion: 350000, salud: 120000, ropa: 200000, mascotas: 120000, regalos: 100000, otros: 150000 } });
    Store.guardarLocal({ cfg, cols }); Store.iniciarLocal(); confeti(); toast('Datos de ejemplo cargados');
  }

  /* ---------- Gastos por voz ---------- */
  const EJEMPLOS_VOZ = () => [
    'Gasté 45 mil en mercado',
    `${(S.cfg?.nombres?.b || 'Camila').split(' ')[0]} pagó 85 mil de cine entre los dos`,
    'Veinte mil en taxi ayer, para mí',
    'Un millón doscientos de arriendo',
    'Me pagaron la prima, 2 millones'
  ];
  function vistaVoz() {
    return `<h2>Dime el gasto</h2>
      <p class="muted" style="margin-top:-6px">Di el valor, en qué fue y, si quieres, quién pagó y si es de los dos.</p>
      <div class="voz">
        <button type="button" class="mic" id="micBtn" data-act="escuchar" aria-label="Hablar">${ICON.mic}<span class="ondas" aria-hidden="true"><i></i><i></i><i></i></span></button>
        <div class="voz-txt" id="vozTxt" aria-live="polite">Toca el micrófono y habla</div>
      </div>
      <div class="chips voz-ej" aria-label="Ejemplos">${EJEMPLOS_VOZ().map(e => `<button type="button" class="chip" data-act="ejemploVoz" data-t="${esc(e)}">«${esc(e)}»</button>`).join('')}</div>
      <form data-form="voz" style="margin-top:14px">
        <div class="field"><label for="vozFrase">O escríbelo como lo dirías</label>
          <div class="row"><input id="vozFrase" name="vozFrase" class="input" maxlength="200" autocomplete="off" placeholder="Ej: 30 mil de domicilio, pagó ${esc((S.cfg?.nombres?.b || 'Camila').split(' ')[0])}" style="flex:3;min-width:0"><button class="btn" style="flex:1">Listo</button></div></div>
      </form>`;
  }
  let escuchando = false, ultimaFrase = '', reconWeb = null, vozFin = null;
  function setVoz(txt, estado) {
    const t = $('#vozTxt'), b = $('#micBtn');
    if (t && txt != null) t.textContent = txt;
    if (b) { b.classList.toggle('on', estado === 'on'); b.setAttribute('aria-label', estado === 'on' ? 'Dejar de escuchar' : 'Hablar'); }
  }
  async function escuchar() {
    if (escuchando) { detenerVoz(); return; }
    ultimaFrase = '';
    const SR = plugin('SpeechRecognition');
    if (nativo && SR) {
      try {
        const disp = await SR.available();
        if (!disp.available) { setVoz('Este celular no tiene reconocimiento de voz. Instala o activa «Google» o «Servicios de voz de Google».'); return; }
        let perm = await SR.checkPermissions();
        if (perm.speechRecognition !== 'granted') perm = await SR.requestPermissions();
        if (perm.speechRecognition !== 'granted') { setVoz('Necesitamos permiso del micrófono. Actívalo en Ajustes del celular → Apps → TU Y YO.'); return; }
        await SR.removeAllListeners();
        await SR.addListener('partialResults', d => { const m = d.matches && d.matches[0]; if (m) { ultimaFrase = m; setVoz('«' + m + '»', 'on'); } });
        await SR.addListener('listeningState', d => { if (d.status === 'stopped') terminarVoz(); });
        escuchando = true; setVoz('Te escucho…', 'on'); vibrar();
        await SR.start({ language: 'es-CO', maxResults: 1, partialResults: true, popup: false });
        clearTimeout(vozFin); vozFin = setTimeout(() => { if (escuchando) detenerVoz(); }, 15000);
      } catch (err) { console.error(err); escuchando = false; setVoz('No pudimos usar el micrófono. Escribe la frase abajo.'); }
      return;
    }
    const W = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!W) { setVoz(PREVIEW ? 'En esta vista previa no hay micrófono. Escribe la frase abajo o toca un ejemplo: en la app Android funciona con la voz.' : 'Este dispositivo no permite dictar. Escribe la frase abajo.'); return; }
    try {
      reconWeb = new W(); reconWeb.lang = 'es-CO'; reconWeb.interimResults = true; reconWeb.maxAlternatives = 1;
      reconWeb.onresult = e => { ultimaFrase = Array.from(e.results).map(r => r[0].transcript).join(' '); setVoz('«' + ultimaFrase + '»', 'on'); };
      reconWeb.onerror = e => { escuchando = false; setVoz(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'El micrófono no está disponible aquí. Escribe la frase abajo o toca un ejemplo.' : 'No te escuché bien. Intenta de nuevo o escríbelo.'); };
      reconWeb.onend = () => terminarVoz();
      escuchando = true; setVoz('Te escucho…', 'on'); reconWeb.start();
    } catch (err) { console.error(err); escuchando = false; setVoz('El micrófono no está disponible aquí. Escribe la frase abajo.'); }
  }
  function detenerVoz() {
    const SR = plugin('SpeechRecognition');
    try { if (nativo && SR) SR.stop(); else if (reconWeb) reconWeb.stop(); } catch { /* ya detenido */ }
    setTimeout(terminarVoz, 600);
  }
  function terminarVoz() {
    if (!escuchando) return;
    escuchando = false; clearTimeout(vozFin);
    try { plugin('SpeechRecognition')?.removeAllListeners(); } catch { /* nada */ }
    if (ultimaFrase.trim()) entenderFrase(ultimaFrase);
    else setVoz('No te escuché. Toca el micrófono e intenta otra vez.');
  }
  function entenderFrase(frase) {
    const r = VOZ.interpretar(frase, S.cfg.nombres, yo(), hoy());
    vibrar();
    const oido = `Entendí: «${esc(frase)}». Revisa y guarda.`;
    if (r.tipo === 'ingreso') { sheetBody.innerHTML = formIngreso({ monto: r.monto, desc: r.desc || 'Ingreso extra', quien: r.quien, fecha: r.fecha }, oido); return; }
    const nf0 = VOZ.norm(frase);
    const propia = CATS.filter(k => !k.oculta && k.id !== 'deudas' && VOZ.norm(k.n).length > 3).sort((a, b) => b.n.length - a.n.length).find(k => new RegExp('\\b' + VOZ.norm(k.n).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(nf0));
    const g = { monto: r.monto, desc: r.desc, categoria: propia && (propia.custom || r.categoria === 'otros') ? propia.id : r.categoria, pagadoPor: r.pagadoPor, tipo: r.de, fecha: r.fecha, origen: 'voz' };
    const fijoV = S.fijos.filter(x => x.activo !== false).find(x => VOZ.norm(x.nombre).split(' ').some(w => w.length > 3 && new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(nf0)));
    if (fijoV && r.categoria !== 'deudas') { g.fijoId = fijoV.id; g.categoria = fijoV.categoria; g.desc = fijoV.nombre; if (!r.de || r.de === 'compartido') g.tipo = fijoV.tipo || 'compartido'; }
    if (r.categoria === 'deudas') {
      const nf = VOZ.norm(frase);
      const d = S.deudas.find(x => estadoDeuda(x).saldo > 0 && (VOZ.norm(x.nombre).split(' ').some(w => w.length > 3 && nf.includes(w)) || (bancoDe(x) && nf.includes(VOZ.norm(bancoDe(x)).split(' ')[0]))));
      if (d) { g.deudaId = d.id; g.desc = 'Pago ' + d.nombre; }
    }
    sheetBody.innerHTML = formGasto(g, r.monto ? oido : `Entendí: «${esc(frase)}», pero no el valor. Escríbelo.`);
  }

  /* ---------- Escaneo de facturas ---------- */
  async function tomarFoto(origen) {
    const Cam = plugin('Camera');
    if (nativo && Cam) {
      try {
        const r = await Cam.getPhoto({ quality: 85, resultType: 'dataUrl', source: origen === 'galeria' ? 'PHOTOS' : 'CAMERA', correctOrientation: true, width: 1800, allowEditing: false });
        if (r?.dataUrl) procesarFactura(r.dataUrl);
      } catch (e) { if (!/cancel/i.test(String(e?.message || e))) toast('No pudimos abrir la cámara. Revisa el permiso en Ajustes del celular.'); }
      return;
    }
    $(origen === 'galeria' ? '#fotoGal' : '#fotoCam').click();
  }
  function archivoElegido(e) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    const r = new FileReader(); r.onload = () => procesarFactura(r.result); r.readAsDataURL(f);
  }
  async function procesarFactura(dataUrl) {
    abrir(`<h2>Leyendo tu factura…</h2>
      <div class="scan"><img class="receipt-prev" src="${dataUrl}" alt="Foto de la factura"></div>
      <p class="muted" id="ocrEstado">Preparando el lector (la primera vez descarga el idioma, necesita internet)…</p>
      <div class="progress"><div id="ocrBar"></div></div>`);
    try {
      const r = await OCR.leerFactura(dataUrl, p => { const b = $('#ocrBar'); if (b) b.style.width = Math.round(p * 100) + '%'; const s = $('#ocrEstado'); if (s) s.textContent = 'Leyendo texto… ' + Math.round(p * 100) + '%'; });
      if (!sheetBody.querySelector('.scan')) return; // cerraron la hoja
      vibrar();
      const aviso = r.total ? 'Revisa los datos leídos y corrige si hace falta.' : 'No encontramos el total. Escríbelo y revisa lo demás.';
      sheetBody.innerHTML = formGasto({ monto: r.total || 0, desc: r.comercio || '', fecha: r.fecha && r.fecha <= hoy() ? r.fecha : hoy(), categoria: r.categoria, items: r.items, origen: 'factura' }, aviso);
    } catch (e) {
      console.error(e);
      if (!sheetBody.querySelector('.scan')) return;
      sheetBody.innerHTML = formGasto({}, PREVIEW ? 'En esta vista previa no se puede leer la foto. En la app Android la factura se lee sola.' : 'No pudimos leer la foto (revisa tu conexión la primera vez). Anota el gasto a mano.');
    }
  }

  /* ---------- Eventos ---------- */
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-act],[data-tab]'); if (!t) return;
    const act = t.dataset.act || 'tab', id = t.dataset.id;
    switch (act) {
      case 'tab': S.tab = t.dataset.tab; window.scrollTo({ top: 0, behavior: 'smooth' }); render(); break;
      case 'cerrar': cerrar(); break;
      case 'mes': S.mes = sumarMes(S.mes, Number(t.dataset.n)); render(); break;
      case 'filtro': S.filtro = t.dataset.f; render(); break;
      case 'ajustes': abrir(formAjustes(false)); break;
      case 'setup': if (!consentOk()) { pedirConsentimiento('setup'); break; } abrir(formAjustes(true)); break;
      case 'consentir': pedirConsentimiento(t.dataset.sig || 'continuar'); break;
      case 'noAcepto': S.bloqueo = false; cerrar(); toast('Sin tu autorización no podemos guardar tus datos.'); break;
      case 'unirme': if (!consentOk()) { pedirConsentimiento('unirme'); break; } abrir(PREVIEW ? `${formUnirme().replace('data-form="unirme"', 'data-form="unirmeEjemplo"')}<p class="muted" style="font-size:13px">En la vista previa no se puede vincular de verdad.</p>` : formUnirme()); break;
      case 'conectar': abrir(PREVIEW ? soloApp() : CONFIG_APP ? vistaVincular() : formConectar()); break;
      case 'dictar':
        if (!ls.get('tuyyo:expMic')) { abrir(`<h2>Dictar gastos</h2><div class="permiso">${ICON.mic}<p>Usaremos el micrófono solo mientras dictas. El dictado lo hace el servicio de voz de Google de tu celular, que puede enviar el audio a Google para convertirlo en texto. A TU Y YO solo llega el texto: la app no graba ni guarda audio.</p></div><button class="btn full" data-act="dictarOk">Entendido, continuar</button>`); break; }
        abrir(vistaVoz(), () => { if (escuchando) detenerVoz(); }); setTimeout(() => { if (nativo) escuchar(); }, 450); break;
      case 'dictarOk': ls.set('tuyyo:expMic', 1); abrir(vistaVoz(), () => { if (escuchando) detenerVoz(); }); setTimeout(() => { if (nativo) escuchar(); }, 450); break;
      case 'escuchar': escuchar(); break;
      case 'ejemploVoz': { const i = $('#vozFrase'); if (i) i.value = t.dataset.t; entenderFrase(t.dataset.t); break; }
      case 'codigoEjemplo': abrir(vistaCodigo('K7M4QP', true)); break;
      case 'crearCodigo': {
        t.disabled = true; t.textContent = 'Creando código…';
        try { const cod = await Store.crearHogar(CONFIG_APP); vibrar(); confeti(); sheetBody.innerHTML = vistaCodigo(cod); }
        catch (err) { console.error(err); toast('No pudimos crear el código. Revisa tu conexión a internet.'); t.disabled = false; t.textContent = 'Crear código para mi pareja'; }
        break;
      }
      case 'pedirReinvitar': $('#reZona').innerHTML = `<p class="muted" style="font-size:13px;margin:0 0 8px">La otra persona dejará de ver el hogar en su celular. Úsalo solo si tu pareja cambió de celular o están de acuerdo. ${esc(nom(yo() === 'a' ? 'b' : 'a'))} entrará con un código nuevo; los datos no se borran.</p><div class="row"><button class="btn ghost" data-act="cancelReinvitar">Cancelar</button><button class="btn" data-act="reinvitar">Crear código nuevo</button></div>`; break;
      case 'cancelReinvitar': $('#reZona').innerHTML = '<button class="btn ghost full" data-act="pedirReinvitar">Mi pareja cambió de celular</button>'; break;
      case 'reinvitar': try { const cod = await Store.reinvitar(); abrir(vistaCodigo(cod)); } catch (err) { console.error(err); toast('No pudimos crear el código nuevo.'); } break;
      case 'ejemplo': cargarEjemplo(); break;
      case 'reiniciar': ls.del(LOCAL); S.tab = 'inicio'; cerrar(); Store.iniciarLocal(); break;
      case 'escanear': case 'galeria': {
        const o = act === 'galeria' ? 'galeria' : 'camara';
        if (!ls.get('tuyyo:expCam')) { abrir(`<h2>${o === 'galeria' ? 'Factura desde la galería' : 'Escanear factura'}</h2><div class="permiso">${ICON.cam}<p>La foto se lee en tu celular para llenar el gasto y no se sube a internet.</p></div><button class="btn full" data-act="camOk" data-o="${o}">Entendido, continuar</button>`); break; }
        cerrarMenu(); tomarFoto(o); break;
      }
      case 'camOk': ls.set('tuyyo:expCam', 1); cerrarMenu(); tomarFoto(t.dataset.o === 'galeria' ? 'galeria' : 'camara'); break;
      case 'nuevoGasto': abrir(formGasto()); break;
      case 'nuevaDeuda': abrir(formDeuda()); break;
      case 'nuevaMeta': abrir(formMeta()); break;
      case 'nuevoIngreso': abrir(formIngreso()); break;
      case 'elegirDeuda': abrir(`<h2>¿Qué deuda pagaron?</h2><div class="menu">${S.deudas.filter(d => estadoDeuda(d).saldo > 0).map((d, i) => `<button style="--i:${i}" data-act="pagarDeuda" data-id="${esc(d.id)}"><span class="ico" style="background:var(--azul)">${ICON.card}</span><span><b>${esc(d.nombre)}</b><small>Saldo ${pesos(estadoDeuda(d).saldo)}</small></span></button>`).join('') || '<p class="muted">No hay deudas activas.</p>'}</div>`); break;
      case 'elegirMeta': abrir(`<h2>¿A qué meta aportan?</h2><div class="menu">${metasActivas().map((m, i) => `<button style="--i:${i}" data-act="aportar" data-id="${esc(m.id)}"><span class="ico" style="background:var(--ok)">${ICON.piggy}</span><span><b>${esc(m.nombre)}</b><small>${Math.round(estadoMeta(m).pct * 100)}% logrado</small></span></button>`).join('') || '<p class="muted">Aún no hay metas. Créenlas en Planes.</p>'}</div>`); break;
      case 'verGasto': { const g = S.gastos.find(x => x.id === id); if (g) abrir(vistaGasto(g)); break; }
      case 'editarGasto': { const g = S.gastos.find(x => x.id === id); if (g) abrir(oculto(g) ? vistaGasto(g) : formGasto(g)); break; }
      case 'editarAporte': { const x = S.aportes.find(y => y.id === id); const m = x && S.metas.find(y => y.id === x.metaId); if (m) abrir(formAporte(m, x)); else if (x) toast('Ese aporte es de una meta que ya no existe'); break; }
      case 'archivarMeta': case 'restaurarMeta': { const m = S.metas.find(x => x.id === id); if (!m) break; const d = { ...m }; delete d.id; if (act === 'archivarMeta') { d.estado = 'archivada'; d.archivadaEn = Date.now(); } else { d.estado = 'activa'; delete d.archivadaEn; } await Store.poner('metas', id, d); toast(act === 'archivarMeta' ? 'Meta archivada. ¡Bien hecho!' : 'Meta restaurada'); break; }
      case 'editarDeuda': { const d = S.deudas.find(x => x.id === id); if (d) abrir(formDeuda(d)); break; }
      case 'pagarDeuda': { const d = S.deudas.find(x => x.id === id); if (d) { abrir(formPagoDeuda(d)); resumenPago($('form[data-form=pagoDeuda]')); } break; }
      case 'editarMeta': { const m = S.metas.find(x => x.id === id); if (m) abrir(formMeta(m)); break; }
      case 'aportar': { const m = S.metas.find(x => x.id === id); if (m) abrir(formAporte(m)); break; }
      case 'editarIngreso': { const x = S.ingresos.find(y => y.id === id); if (x) abrir(formIngreso(x)); break; }
      case 'nuevoFijo': abrir(formFijo()); break;
      case 'editarFijo': { const x = S.fijos.find(y => y.id === id); if (x) abrir(formFijo(x)); break; }
      case 'pagarFijo': { const x = S.fijos.find(y => y.id === id); if (x) abrir(formPagoFijo(x, t.dataset.mes || mesDe(hoy()))); break; }
      case 'menuFijo': { const x = S.fijos.find(y => y.id === id); if (x) abrir(vistaMenuFijo(x, t.dataset.mes || S.mes)); break; }
      case 'pagosFijo': { const x = S.fijos.find(y => y.id === id); if (x) abrir(vistaPagosFijo(x, t.dataset.mes || S.mes)); break; }
      case 'saltarFijo': {
        const x = S.fijos.find(y => y.id === id); if (!x) break; const mes = t.dataset.mes || S.mes;
        const d = { ...x }; delete d.id; const sal = new Set(x.saltos || []);
        if (sal.has(mes)) sal.delete(mes); else sal.add(mes);
        d.saltos = [...sal].sort().slice(-24);
        await Store.poner('fijos', id, d); cerrar(); toast(sal.has(mes) ? `${x.nombre}: no aplica en ${nombreMes(mes, { month: 'long' })}` : `${x.nombre} vuelve a contar este mes`); break;
      }
      case 'cuentas': abrir(vistaCuentas()); break;
      case 'nuevaCuenta': abrir(formCuenta()); break;
      case 'editarCuenta': { const x = S.cuentas.find(y => y.id === id); if (x) abrir(formCuenta(x)); break; }
      case 'cita': abrir(vistaCita(S.mes)); break;
      case 'hablado': {
        const g = S.gastos.find(x => x.id === id); if (!g) break;
        if (!puedeHablar(g)) { toast(`${nom(otro(yo()))} es quien confirma que ya lo hablaron`); break; }
        const d = { ...g }; delete d.id; delete d.revisar; delete d.revisarPor;
        d.habladoPor = yo(); d.habladoEn = Date.now();
        await Store.poner('gastos', id, d); vibrar();
        if (!sheet.hidden && sheetBody.querySelector('.hablar-det')) cerrar();
        toast('Listo, ya lo hablaron'); break;
      }
      case 'exportar': abrir(`<h2>Exportar movimientos</h2><div class="permiso">${ICON.up}<p>El archivo incluye movimientos de los dos. Compártelo solo con quien quieras.</p></div><button class="btn full" data-act="exportarOk">Exportar</button><button class="btn ghost full" style="margin-top:10px" data-act="cerrar">Cancelar</button>`); break;
      case 'exportarOk': try { await exportarCSV(); } catch (err) { console.error(err); toast('No se pudo exportar'); } break;
      case 'legal': S.bloqueo = false; abrir(vistaLegal()); break;
      case 'legalDoc': abrir(vistaDocLegal(t.dataset.k, t.dataset.volver)); break;
      case 'misAut': abrir(vistaMisAut()); break;
      case 'eliminarDatos': S.bloqueo = false; abrir(vistaEliminar()); break;
      case 'logros': ls.set('tuyyo:logrosRevisados', Date.now()); abrir(vistaLogros()); render(); break;
      case 'filtroLogros': sheetBody.innerHTML = vistaLogros(t.dataset.f); break;
      case 'cerrarLogro': { const b = document.querySelector('.logro-up'); if (b) { b.classList.remove('on'); setTimeout(() => { b.remove(); siguienteLogro(); }, 250); } break; }
      case 'elegirReto': abrir(vistaRetos()); break;
      case 'ponerReto': await Store.guardarCampoCfg('reto', { id: t.dataset.r, mes: mesDe(hoy()), inicio: hoy() }); cerrar(); vibrar(); toast('¡Reto aceptado! Mucha suerte a los dos'); break;
      case 'quitarReto': await Store.guardarCampoCfg('reto', null); cerrar(); toast('Reto quitado'); break;
      case 'bannerLuego': ls.set('tuyyo:bannerHasta', Date.now() + 7 * 864e5); render(); break;
      case 'donut': {
        const w = t.closest('.donut-wrap'); if (!w) break;
        const i = t.dataset.i, sel = w.dataset.sel === i ? '' : i; w.dataset.sel = sel;
        w.classList.toggle('con-sel', !!sel);
        w.querySelectorAll('.arc').forEach(a => a.classList.toggle('sel', a.dataset.i === sel));
        w.querySelectorAll('.ley').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.i === sel)));
        const b = sel ? w.querySelector(`.ley[data-i="${sel}"]`) : null;
        w.querySelector('#donutL').textContent = b ? b.dataset.n : 'gastado';
        w.querySelector('#donutV').textContent = b ? b.dataset.v : w.dataset.pct;
        break;
      }
      case 'distribucion': distModo = 'pesos'; abrir(vistaDistribucion()); actualizarDist(); break;
      case 'nuevaCat': {
        const lista = $('#distFilas'); if (!lista) break;
        if (lista.children.length >= 40) { toast('Máximo 40 categorías'); break; }
        const usados = new Set([...lista.children].map(f => f.dataset.c));
        const col = PALETA.find(x => !usados.has(x)) || PALETA[lista.children.length % PALETA.length];
        lista.insertAdjacentHTML('beforeend', filaDist({ id: 'c_' + uid().replace(/[^a-z0-9]/gi, ''), n: '', c: col, g: 'gus', custom: true }, 0));
        const nueva = lista.lastElementChild; nueva.classList.add('nueva'); nueva.querySelector('.dist-nombre').focus(); nueva.scrollIntoView({ block: 'center', behavior: 'smooth' });
        actualizarDist(); break;
      }
      case 'colorCat': {
        const f = t.closest('.dist-fila'); const i = PALETA.indexOf(f.dataset.c); const col = PALETA[(i + 1) % PALETA.length];
        f.dataset.c = col; t.style.background = col; break;
      }
      case 'ocultarCat': {
        const f = t.closest('.dist-fila'); const oc = f.dataset.oculta === '1';
        if (oc) delete f.dataset.oculta; else f.dataset.oculta = '1';
        t.textContent = oc ? 'Ocultar' : 'Mostrar'; actualizarDist(); break;
      }
      case 'borrarCat': {
        const f = t.closest('.dist-fila'); const idc = f.dataset.id;
        const usos = S.gastos.filter(x => x.categoria === idc).length + S.fijos.filter(x => x.categoria === idc).length;
        if (usos) { f.dataset.oculta = '1'; t.dataset.act = 'ocultarCat'; t.textContent = 'Mostrar'; toast(`Tiene ${usos} movimiento${usos === 1 ? '' : 's'}: la ocultamos para no perderlos`); }
        else f.remove();
        actualizarDist(); break;
      }
      case 'sugerirDist': {
        const ing = ingresoMes(); if (!ing) { toast('Primero escriban los ingresos en Ajustes'); break; }
        const r = resumenDist({});
        const disp = { nec: ing * .5, gus: ing * .3, aho: Math.max(0, ing * .2 - r.meta) };
        disp.nec = Math.max(0, disp.nec - r.deu);
        const filas = [...document.querySelectorAll('#distFilas .dist-fila')].filter(f => f.dataset.oculta !== '1');
        const peso = { mercado: 3, hogar: 5, transporte: 1.6, salud: .7, educacion: .5, mascotas: .3, comida: 2, diversion: 2.6, ropa: 1.6, regalos: 1, otros: 1.5 };
        const porG = {}; for (const f of filas) { const g = f.querySelector('.dist-grupo').value; (porG[g] = porG[g] || []).push(f); }
        for (const [g, fs] of Object.entries(porG)) {
          const tot = fs.reduce((a, f) => a + (peso[f.dataset.id] || 1), 0);
          for (const f of fs) { const m = Math.round((disp[g] || 0) * (peso[f.dataset.id] || 1) / tot / 10000) * 10000; f.dataset.v = m; f.querySelector('.dist-monto').value = valorDist(m); }
        }
        actualizarDist(); toast('50% necesidades, 30% gustos, 20% ahorro. Ajústenlo a su gusto.'); break;
      }
      case 'verDeuda': { const d = S.deudas.find(x => x.id === id); if (d) abrir(vistaDeuda(d)); break; }
      case 'pedirBorrar': $('#borrarZona').innerHTML = borrarConfirm(t.dataset.col, id); break;
      case 'cancelBorrar': $('#borrarZona').innerHTML = `<button type="button" class="btn danger full" data-act="pedirBorrar" data-col="${esc(t.dataset.col)}" data-id="${esc(id)}">Eliminar</button>`; break;
      case 'borrar': {
        const col = t.dataset.col, doc = (S[col] || []).find(x => x.id === id);
        try {
          // Una meta con historial se archiva: nunca se borran sus aportes.
          if (col === 'metas' && doc && (S.aportes.some(a => a.metaId === id) || S.gastos.some(x => x.metaId === id))) {
            const d = { ...doc }; delete d.id; d.estado = 'archivada'; d.archivadaEn = Date.now();
            await Store.poner('metas', id, d); cerrar();
            toastAccion('Meta archivada: sus aportes se conservan', 'Deshacer', async () => { const r = { ...doc }; delete r.id; await Store.poner('metas', id, r); toast('Meta restaurada'); });
            break;
          }
          S.borradosPorMi.add(id);
          await Store.quitar(col, id); cerrar();
          const TXT = { gastos: 'Gasto eliminado', fijos: 'Gasto fijo eliminado', aportes: 'Aporte eliminado', deudas: 'Deuda eliminada', ingresos: 'Ingreso eliminado', cuentas: 'Cuenta eliminada', metas: 'Meta eliminada' };
          if (doc) toastAccion(TXT[col] || 'Eliminado', 'Deshacer', async () => { const r = { ...doc }; delete r.id; S.borradosPorMi.delete(id); await Store.poner(col, id, r); toast('Recuperado'); });
          else toast('Eliminado');
        } catch (err) { console.error(err); S.borradosPorMi.delete(id); toast('No se pudo eliminar. Revisa tu conexión.'); }
        break;
      }
      case 'saldar': {
        const net = balance(); if (!net) break;
        const deudor = net > 0 ? 'b' : 'a';
        await Store.poner('gastos', null, { desc: `${nom(deudor)} saldó cuentas`, monto: Math.abs(net), fecha: hoy(), categoria: 'ajuste', pagadoPor: deudor, tipo: otro(deudor), creado: Date.now() });
        vibrar(); confeti(); toast('¡Cuentas saldadas!'); break;
      }
      case 'invitar': {
        try { const cod = await Store.invitacion(); abrir(vistaCodigo(cod)); } catch (err) { console.error(err); toast('No pudimos obtener el código. Revisa tu conexión.'); }
        break;
      }
      case 'copiarCod': {
        const txt = $('#codTxt').textContent;
        try { await navigator.clipboard.writeText(txt); toast('Código copiado'); }
        catch { const r = document.createRange(); r.selectNodeContents($('#codTxt')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Código seleccionado: cópialo'); }
        break;
      }
      case 'compartirCod': {
        const txt = $('#codTxt').textContent; const Sh = plugin('Share');
        const msg = txt.length <= 8 ? `Vinculémonos en TU Y YO: abre la app, toca «Mi pareja ya lo creó» y escribe este código: ${txt}` : 'Únete a nuestro presupuesto en TU Y YO con este código:\n' + txt;
        try { if (Sh) await Sh.share({ title: 'TU Y YO', text: msg }); else if (navigator.share) await navigator.share({ text: msg }); else throw 0; }
        catch { try { await navigator.clipboard.writeText(txt); toast('Código copiado'); } catch { toast('Copia el código manualmente'); } }
        break;
      }
      case 'desconectar': Store.desconectar(); cerrar(); toast('Ahora usas solo este celular'); break;
    }
  });

  // Menú del botón +
  const fab = $('#fab');
  function cerrarMenu() { if (!sheet.hidden) cerrar(); }
  fab.addEventListener('click', () => {
    if (S.bloqueo) return;
    if (fab.getAttribute('aria-expanded') === 'true') { cerrar(); return; }
    const op = [
      ['dictar', ICON.mic, 'var(--verde)', 'Dictar gasto', 'Dilo en voz alta y la app lo anota'],
      ['escanear', ICON.cam, 'var(--azul)', 'Escanear factura', 'Toma la foto y la app llena el gasto'],
      ['galeria', ICON.img, '#B07A86', 'Factura desde la galería', 'Usa una foto que ya tengas'],
      ['nuevoGasto', ICON.pen, '#5B7BE0', 'Anotar gasto', 'Escribe el valor y la categoría'],
      ['elegirDeuda', ICON.card, '#7A5C99', 'Pagar una deuda', 'Registra quién pagó la cuota'],
      ['elegirMeta', ICON.piggy, 'var(--ok)', 'Aportar a una meta', 'Suma a sus ahorros'],
      ['nuevoIngreso', ICON.up, '#2F9FB3', 'Ingreso extra', 'Primas, ventas, bonos'],
      ['nuevoFijo', ICON.repeat, '#DD8436', 'Gasto fijo o suscripción', 'Arriendo, servicios, Netflix…'],
      ['nuevaCuenta', ICON.bank, '#6A6FD8', 'Cuenta o ahorro', 'Para ver su patrimonio']
    ];
    abrir(`<h2>¿Qué quieren registrar?</h2><div class="menu">${op.map(([a, ic, col, t, d], i) => `<button style="--i:${i}" data-act="${a}"><span class="ico" style="background:${col}">${ic}</span><span><b>${t}</b><small>${d}</small></span></button>`).join('')}</div>`);
    fab.setAttribute('aria-expanded', 'true');
  });
  $('#fotoCam').addEventListener('change', archivoElegido);
  $('#fotoGal').addEventListener('change', archivoElegido);

  // Formato de dinero mientras se escribe
  document.addEventListener('input', e => {
    const el = e.target;
    if (el.classList.contains('money')) { const n = digitos(el.value); el.value = n ? pesos(n) : ''; }
    if (el.name === 'gcat') { const c = $('#campoDeuda'); if (c) c.hidden = el.value !== 'deudas'; }
    if (el.form?.dataset.form === 'pagoDeuda') resumenPago(el.form);
    if (el.classList.contains('code-in') && el.value.length <= 8) { const c = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); el.value = c.length > 3 ? conGuion(c) : c; }
    if (el.closest && el.closest('#distFilas')) actualizarDist();
    if (el.name === 'fptotal') { const fm = el.form, p = pendienteForm(fm); $('#fpTot').textContent = pesos(digitos(el.value)); $('#fpFalta').textContent = pesos(p); if (fm.elements.fptipo.value === 'todo') fm.elements.fpmonto.value = pesos(p); }
    if (el.id === 'buscar') { S.buscar = el.value; const l = $('#listaG'); if (l) l.innerHTML = listaGastos(); }
  });
  document.addEventListener('change', e => {
    if (e.target.name === 'reparto') { const c = $('#campoPct'); if (c) c.hidden = e.target.value !== 'custom'; }
    if (e.target.name === 'dtipo') { const t = e.target.value === 'tarjeta'; $('#campoCupo').hidden = !t; $('#campoPlazo').hidden = t; $('#lblCuota').textContent = t ? 'Pago mínimo o lo que pagan al mes' : 'Cuota mensual'; }
    if (e.target.name === 'distModo') cambiarModoDist(e.target.value);
    if (e.target.classList?.contains('dist-grupo')) actualizarDist();
    if (e.target.name === 'gtipo') { const c = $('#campoPriv'); if (c) c.hidden = e.target.value === 'compartido'; }
    if (e.target.name === 'dresp') { const n = $('#notaConjunta'); if (n) n.hidden = e.target.value !== 'ambos'; }
    if (e.target.name === 'ptipo') { const c = $('#campoInt'), f = e.target.form; if (c) c.hidden = e.target.value === 'abono' || Number(f.dataset.i) === 0; }
    if (e.target.form?.dataset.form === 'pagoDeuda') resumenPago(e.target.form);
    if (e.target.name === 'gcat') { const c = $('#campoDeuda'); if (c) c.hidden = e.target.value !== 'deudas'; }
    if (e.target.name === 'fptipo') { const fm = e.target.form; if (e.target.value === 'todo') fm.elements.fpmonto.value = pesos(pendienteForm(fm)); else { fm.elements.fpmonto.value = ''; fm.elements.fpmonto.focus(); } }
  });

  document.addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, tipo = f.dataset.form, id = f.dataset.id || null;
    const v = n => f.elements[n]?.value ?? '';
    const boton = f.querySelector('button:not([type=button])');
    const ocupado = b => { if (boton) boton.disabled = b; };
    try {
      ocupado(true);
      if (tipo === 'gasto') {
        const monto = digitos(v('gmonto'));
        if (!monto || monto > 1e10) { toast('Escribe un valor válido'); return; }
        const cat = v('gcat') || 'otros', t = v('gtipo');
        const prev = id ? S.gastos.find(x => x.id === id) : null;
        const data = { desc: v('gdesc').trim().slice(0, 60), monto, fecha: v('gfecha') || hoy(), categoria: CAT[cat] ? cat : 'otros',
          pagadoPor: v('gpago') === 'b' ? 'b' : 'a', tipo: ['a', 'b'].includes(t) ? t : 'compartido',
          deudaId: cat === 'deudas' ? (v('gdeuda') || null) : null, creado: prev?.creado || Date.now() };
        if (data.tipo === 'compartido') data.ratioA = prev?.tipo === 'compartido' && typeof prev.ratioA === 'number' ? prev.ratioA : ratioA();
        const its = prev?.items || leerItemsDeForm(f); if (its?.length) data.items = its.slice(0, 40);
        const nota = v('gnota').trim().slice(0, 120); if (nota) data.nota = nota;
        if (f.elements.grev?.checked) { data.revisar = true; data.revisarPor = prev?.revisar ? marcoHablar(prev) : yo(); }
        else if (prev?.habladoPor) { data.habladoPor = prev.habladoPor; data.habladoEn = prev.habladoEn || null; }
        const metaId = v('gmeta'); if (metaId && S.metas.find(m => m.id === metaId)) data.metaId = metaId;
        data.origen = prev?.origen || (['voz', 'factura', 'fijo', 'manual'].includes(v('gorigen')) ? v('gorigen') : 'manual');
        if (data.tipo !== 'compartido' && f.elements.gpriv?.checked) data.privado = true;
        const fijoId = v('gfijo') || prev?.fijoId; if (fijoId) data.fijoId = fijoId;
        if (data.deudaId) {
          const interes = prev && prev.deudaId === data.deudaId ? Math.min(monto, prev.interes || 0) : 0;
          data.interes = interes; data.capital = monto - interes; data.abono = !!prev?.abono;
        }
        await Store.poner('gastos', id, data);
        vibrar(); cerrar(); toast(id ? 'Gasto actualizado' : (data.revisar && S.modo === 'nube' ? `Guardado. ${nom(otro(yo()))} lo verá en «Para hablar juntos»` : 'Gasto guardado'));
        if (data.deudaId && estadoDeuda(S.deudas.find(d => d.id === data.deudaId) || {}).saldo === 0) confeti();
      } else if (tipo === 'deuda') {
        const tasa = Number(String(v('dtasa')).replace(',', '.'));
        const dia = Math.round(Number(v('ddia')));
        const prev = id ? S.deudas.find(x => x.id === id) : null;
        const saldoForm = digitos(v('dsaldo'));
        const tipoD = TIPOS_DEUDA[v('dtipo')] ? v('dtipo') : 'otro';
        const plazo = Math.round(Number(v('dplazo'))), previas = Math.round(Number(v('dprev')));
        const data = { tipo: tipoD, nombre: v('dnombre').trim().slice(0, 40), banco: v('dbanco').trim().slice(0, 40), cuota: digitos(v('dcuota')),
          cupo: tipoD === 'tarjeta' ? (digitos(v('dcupo')) || null) : null,
          tasa: tasa > 0 && tasa < 500 ? tasa : null, tasaTipo: v('dtasatipo') === 'mv' ? 'mv' : 'ea', dia: dia >= 1 && dia <= 31 ? dia : null,
          plazo: tipoD !== 'tarjeta' && plazo > 0 && plazo < 600 ? plazo : null, cuotasPrevias: tipoD !== 'tarjeta' && previas > 0 && previas < 600 ? previas : null,
          responsable: ['a', 'b'].includes(v('dresp')) ? v('dresp') : 'ambos',
          saldoInicial: prev ? prev.saldoInicial : saldoForm, creado: prev?.creado || Date.now() };
        if (!data.nombre || !saldoForm) { toast('Pon nombre y saldo'); return; }
        if (prev) {
          data.saldoActual = prev.saldoActual ?? null; data.saldoActualizado = prev.saldoActualizado ?? null;
          if (saldoForm !== estadoDeuda(prev).saldo) { data.saldoActual = saldoForm; data.saldoActualizado = Date.now(); }
          if (saldoForm > (prev.saldoInicial || 0)) data.saldoInicial = saldoForm;
        }
        await Store.poner('deudas', id, data); vibrar(); cerrar(); toast('Deuda guardada');
      } else if (tipo === 'distribucion') {
        const filas = [...document.querySelectorAll('#distFilas .dist-fila')];
        const categorias = [], presupuestos = {};
        for (const f of filas) {
          const id = f.dataset.id, n = f.querySelector('.dist-nombre').value.trim().slice(0, 24), m = leerMontoFila(f);
          const base = CATS_BASE.find(b => b.id === id);
          if (!n && !base) { if (m) { toast('Pónganle nombre a la categoría nueva'); f.querySelector('.dist-nombre').focus(); return; } continue; }
          if (!ID_RE.test(id)) continue;
          categorias.push({ id, n: n || base.n, c: COLOR_RE.test(f.dataset.c) ? f.dataset.c : '#8C8399', g: GRUPOS[f.querySelector('.dist-grupo').value] ? f.querySelector('.dist-grupo').value : 'gus', oculta: f.dataset.oculta === '1' });
          if (m && f.dataset.oculta !== '1') presupuestos[id] = Math.min(m, 1e10);
        }
        const d = CATS.find(k => k.id === 'deudas'); if (d) categorias.push({ id: 'deudas', n: d.n, c: d.c, g: 'deu', oculta: false });
        await Store.guardarCfg({ ...S.cfg, categorias, presupuestos });
        vibrar(); cerrar(); toast('Distribución guardada');
      } else if (tipo === 'fijo') {
        const dia = Math.round(Number(v('fdia')));
        const prevF = id ? S.fijos.find(x => x.id === id) : null;
        const data = { nombre: v('fnombre').trim().slice(0, 40), monto: digitos(v('fmonto')), dia: dia >= 1 && dia <= 31 ? dia : null,
          categoria: CAT[v('fcat')] ? v('fcat') : 'hogar', pagadoPor: v('fpago') === 'b' ? 'b' : 'a',
          tipo: ['a', 'b'].includes(v('ftipo')) ? v('ftipo') : 'compartido', suscripcion: !!f.elements.fsub?.checked, activo: true };
        if (!data.nombre || !data.monto) { toast('Pon nombre y valor'); return; }
        if (prevF?.montosMes) data.montosMes = prevF.montosMes;
        if (prevF?.saltos) data.saltos = prevF.saltos;
        await Store.poner('fijos', id, data); vibrar(); cerrar(); toast('Gasto fijo guardado');
      } else if (tipo === 'pagoFijo') {
        const fx = S.fijos.find(x => x.id === id); if (!fx) return;
        const mes = f.dataset.mes || mesDe(hoy());
        const monto = digitos(v('fpmonto')); if (!monto || monto > 1e10) { toast('Escribe cuánto pagaste'); return; }
        const totalNuevo = digitos(v('fptotal')) || totalFijoMes(fx, mes);
        if (totalNuevo !== totalFijoMes(fx, mes)) {
          const d = { ...fx }; delete d.id; const mm = { ...(fx.montosMes || {}) };
          if (totalNuevo === fx.monto) delete mm[mes]; else mm[mes] = totalNuevo;
          const claves = Object.keys(mm).sort().slice(-12); d.montosMes = Object.fromEntries(claves.map(k => [k, mm[k]]));
          await Store.poner('fijos', id, d);
        }
        const fxN = S.fijos.find(x => x.id === id) || fx;
        const antes = estadoFijo(fxN, mes);
        const parcial = monto < antes.pendiente * .995;
        const g = { desc: fx.nombre + (parcial || antes.pagado ? ' (abono)' : ''), monto, fecha: v('fpfecha') || hoy(), categoria: CAT[fx.categoria] ? fx.categoria : 'hogar',
          pagadoPor: v('fppago') === 'b' ? 'b' : 'a', tipo: ['a', 'b'].includes(fx.tipo) ? fx.tipo : 'compartido', fijoId: fx.id, origen: 'fijo', creado: Date.now() };
        if (mesDe(g.fecha) !== mes) g.fecha = diaEn(mes, Number(g.fecha.slice(8)) || 1);
        if (g.tipo === 'compartido') g.ratioA = ratioA();
        await Store.poner('gastos', null, g);
        vibrar(); cerrar();
        const st = estadoFijo(S.fijos.find(x => x.id === id) || fx, mes);
        if (st.estado === 'pagado') { confeti(); toast(`¡${fx.nombre} quedó pagado!`); } else toast(`Abono registrado. Faltan ${pesos(st.pendiente)}`);
      } else if (tipo === 'cuenta') {
        const data = { nombre: v('cnombre').trim().slice(0, 40), banco: v('cbanco').trim().slice(0, 40), tipo: TIPOS_CUENTA[v('ctipo')] ? v('ctipo') : 'otro', saldo: digitos(v('csaldo')),
          dueno: ['a', 'b'].includes(v('cdueno')) ? v('cdueno') : 'ambos', actualizado: Date.now() };
        if (!data.nombre) { toast('Pon un nombre'); return; }
        await Store.poner('cuentas', id, data); vibrar(); toast('Cuenta guardada'); abrir(vistaCuentas());
      } else if (tipo === 'cita') {
        const prev = S.citas.find(x => (x.mes || x.id) === id);
        await Store.poner('citas', id, { mes: id, acuerdos: v('acuerdos').trim().slice(0, 1000), hecho: true, fecha: prev?.fecha || hoy() });
        vibrar(); cerrar(); if (!prev?.hecho) { confeti(); toast('¡Cita cumplida! Racha: ' + rachaCitas() + ' mes' + (rachaCitas() === 1 ? '' : 'es')); } else toast('Acuerdos guardados');
      } else if (tipo === 'saldoReal') {
        const d = S.deudas.find(x => x.id === id); const n = digitos(v('sreal'));
        if (!d || !v('sreal').trim()) { toast('Escribe el saldo del extracto'); return; }
        const data = { ...d }; delete data.id;
        data.saldoActual = n; data.saldoActualizado = Date.now(); if (n > (d.saldoInicial || 0)) data.saldoInicial = n;
        await Store.poner('deudas', id, data); vibrar(); cerrar(); toast('Saldo actualizado');
      } else if (tipo === 'pagoDeuda') {
        const d = S.deudas.find(x => x.id === id); const monto = digitos(v('pmontoD'));
        if (!d || !monto) { toast('Escribe el valor'); return; }
        const abono = v('ptipo') === 'abono';
        const interes = abono || tasaMensual(d) === 0 ? 0 : Math.min(monto, digitos(v('pint')));
        const data = { desc: (abono ? 'Abono ' : 'Pago ') + d.nombre, monto, interes, capital: monto - interes, abono, fecha: v('pfecha') || hoy(), categoria: 'deudas', deudaId: d.id,
          pagadoPor: v('ppago') === 'b' ? 'b' : 'a', tipo: d.responsable === 'a' || d.responsable === 'b' ? d.responsable : 'compartido',
          ratioA: ratioA(), creado: Date.now() };
        await Store.poner('gastos', null, data);
        vibrar(); cerrar();
        const st = estadoDeuda(d);
        if (st.saldo <= 0) { confeti(); toast('¡Deuda pagada por completo!'); }
        else toast(`Pago registrado. Quedan ${pesos(st.saldo)}`);
      } else if (tipo === 'meta') {
        const data = { nombre: v('mnombre').trim().slice(0, 40), objetivo: digitos(v('mobj')), fechaLimite: v('mfecha') || null };
        if (!data.nombre || !data.objetivo) { toast('Pon nombre y valor'); return; }
        await Store.poner('metas', id, data); vibrar(); cerrar(); toast('Meta guardada');
      } else if (tipo === 'aporte') {
        const monto = digitos(v('amonto')); if (!monto) { toast('Escribe el valor'); return; }
        const aid = f.dataset.aid || null, prevA = aid ? S.aportes.find(x => x.id === aid) : null;
        await Store.poner('aportes', aid, { metaId: id, monto, quien: v('aquien') === 'b' ? 'b' : 'a', fecha: v('afecha') || prevA?.fecha || hoy(), creado: prevA?.creado || Date.now() });
        vibrar(); cerrar();
        if (prevA) toast('Aporte actualizado'); else { confeti(); toast('¡Un paso más cerca!'); }
      } else if (tipo === 'ingreso') {
        const monto = digitos(v('imonto')); if (!monto) { toast('Escribe el valor'); return; }
        const prevI = id ? S.ingresos.find(x => x.id === id) : null;
        await Store.poner('ingresos', id, { monto, desc: v('idesc').trim().slice(0, 40), quien: v('iquien') === 'b' ? 'b' : 'a', fecha: v('ifecha') || hoy(), creado: prevI?.creado || Date.now() });
        vibrar(); cerrar(); toast('Ingreso guardado');
      } else if (tipo === 'ajustes') {
        const c = Object.assign(cfgBase(), S.cfg || {});
        c.nombres = { a: v('na').trim().slice(0, 20), b: v('nb').trim().slice(0, 20) };
        c.ingresos = { a: digitos(v('ia')), b: digitos(v('ib')) };
        c.reparto = ['proporcional', 'mitad', 'custom'].includes(v('reparto')) ? v('reparto') : 'proporcional';
        c.pctA = Math.min(100, Math.max(0, Number(v('pcta')) || 50));
        c.metaAhorroPct = Math.min(90, Math.max(0, Number(v('meta')) || 0));
        if (!f.dataset.inicial) { c.recordatorios = !!f.elements.rec?.checked; c.mesada = { a: digitos(v('ma')), b: digitos(v('mb')) }; ls.set('tuyyo:notifMontos', !!f.elements.notifm?.checked); recFirma = ''; }
        if (!c.nombres.a || !c.nombres.b) { toast('Escriban los dos nombres'); return; }
        await Store.guardarCfg(c); vibrar(); cerrar();
        if (f.dataset.inicial) { confeti(); toast('¡Bienvenidos a TU Y YO!'); } else toast('Ajustes guardados');
      } else if (tipo === 'consentimiento') {
        if (!f.elements.cacepta?.checked || (f.elements.cterceros && !f.elements.cterceros.checked)) { toast('Para continuar marca las casillas obligatorias'); return; }
        ls.set(CONSENT, { version: L.version, fecha: new Date().toISOString(), persona: f.dataset.sig === 'unirme' ? 'b' : yo(), mayorEdad: true, terceros: !!f.elements.cterceros?.checked, acepta: true });
        S.bloqueo = false; consentFirma = '';
        const sig = f.dataset.sig;
        if (sig === 'setup') abrir(formAjustes(true));
        else if (sig === 'unirme') abrir(PREVIEW ? `${formUnirme().replace('data-form="unirme"', 'data-form="unirmeEjemplo"')}<p class="muted" style="font-size:13px">En la vista previa no se puede vincular de verdad.</p>` : formUnirme());
        else { cerrar(); sincronizarConsentimiento(); toast('¡Gracias! Ya puedes seguir'); }
      } else if (tipo === 'eliminar') {
        if (v('confirmar').trim().toUpperCase() !== 'ELIMINAR') { toast('Escribe ELIMINAR para confirmar'); f.elements.confirmar.focus(); return; }
        const alcance = v('alcance') === 'hogar' && S.modo === 'nube' ? 'hogar' : 'local';
        boton.textContent = 'Eliminando…';
        if (alcance === 'hogar') await Store.eliminarHogar();
        await Store.borrarEsteCelular();
        S.bloqueo = false; cerrar(); toast(alcance === 'hogar' ? 'Eliminamos el hogar y los datos de este celular' : 'Eliminamos los datos de este celular');
      } else if (tipo === 'permitir') {
        $('#veredicto').innerHTML = veredicto(digitos(v('pmonto')));
      } else if (tipo === 'crearHogar') {
        let config; try { config = leerConfigFirebase(v('fbcfg')); } catch { toast('Ese texto no parece un firebaseConfig completo'); return; }
        boton.textContent = 'Creando…';
        const cod = await Store.crearHogar(config);
        vibrar(); confeti(); sheetBody.innerHTML = vistaCodigo(cod);
      } else if (tipo === 'voz') {
        const fr = v('vozFrase').trim(); if (!fr) { toast('Escribe o di el gasto'); return; }
        entenderFrase(fr);
      } else if (tipo === 'unirmeEjemplo') {
        toast('En la app Android aquí quedarían vinculados');
      } else if (tipo === 'unirme') {
        boton.textContent = 'Vinculando…';
        try { await Store.unirse(v('codigo')); }
        catch (err) { console.error(err); toast(err.message === 'codigo' ? 'Ese código no existe o ya venció. Pide uno nuevo.' : 'No pudimos vincularte: el código ya se usó o el hogar ya tiene dos personas.'); boton.textContent = 'Vincularme'; return; }
        // Espera a que llegue la configuración del hogar para nombrar a la pareja con su nombre real.
        for (let i = 0; i < 30 && (S.members.length < 2 || !S.cfg?.nombres?.[otro(yo())]); i++) await new Promise(r => setTimeout(r, 100));
        const pareja = S.cfg?.nombres?.[otro(yo())] || 'tu pareja';
        vibrar(); confeti(); cerrar(); toast(`¡Listo! Ya estás vinculado con ${pareja}`);
      }
    } catch (err) {
      console.error(err);
      if (tipo === 'eliminar') { toast('No pudimos eliminar todo. Revisa tu conexión e inténtalo de nuevo.'); if (boton) boton.textContent = 'Eliminar definitivamente'; return; }
      toast(tipo === 'crearHogar' ? 'No pudimos crear el hogar: revisa la configuración, el acceso anónimo y las reglas.' : 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.');
      if (boton && tipo === 'crearHogar') boton.textContent = 'Crear nuestro hogar en la nube';
    } finally { ocupado(false); }
  });
  function leerItemsDeForm(f) {
    const box = f.querySelector('.items'); if (!box) return null;
    return [...box.children].map(d => ({ descripcion: d.children[0].textContent, valor: digitos(d.children[1].textContent) }));
  }

  // Recordatorios de pago en el celular (un día antes y el mismo día)
  let recFirma = '', recT;
  function programarRecordatorios() {
    const LN = plugin('LocalNotifications'); if (!nativo || !LN || !S.cfg) return;
    const activas = S.deudas.filter(d => d.dia && estadoDeuda(d).saldo > 0).slice(0, 100);
    const fijosR = S.fijos.filter(f => f.dia && f.activo !== false).slice(0, 100);
    const montos = !!ls.get('tuyyo:notifMontos');
    const firma = (S.cfg.recordatorios === false ? 'off' : 'on') + (montos ? 'M' : 'm') + JSON.stringify(activas.map(d => [d.id, d.dia, d.nombre, d.cuota, bancoDe(d)])) + JSON.stringify(fijosR.map(f => [f.id, f.dia, f.nombre, f.monto]));
    if (firma === recFirma) return; recFirma = firma;
    clearTimeout(recT);
    recT = setTimeout(async () => {
      try {
        const pend = await LN.getPending();
        const viejas = (pend.notifications || []).filter(n => n.id >= 7000 && n.id < 7600);
        if (viejas.length) await LN.cancel({ notifications: viejas.map(n => ({ id: n.id })) });
        if (S.cfg.recordatorios === false || !(activas.length + fijosR.length)) return;
        let perm = await LN.checkPermissions();
        if (perm.display !== 'granted') perm = await LN.requestPermissions();
        if (perm.display !== 'granted') return;
        const nots = [];
        // Por defecto sin nombres ni montos: la notificación se ve con el celular bloqueado.
        const T0 = 'Tienes un pago próximo', B0 = 'Abre TU Y YO para ver el detalle.';
        activas.forEach((d, k) => {
          const cuerpo = `${bancoDe(d) ? bancoDe(d) + ' · ' : ''}${d.cuota ? 'Cuota de ' + pesos(d.cuota) + '. ' : ''}Cuando paguen, regístrenlo en TU Y YO.`;
          if (d.dia > 1) nots.push({ id: 7000 + k * 2, title: montos ? `Se acerca el pago de ${d.nombre}` : T0, body: montos ? `Vence el día ${d.dia}. ${cuerpo}` : B0, schedule: { on: { day: Math.min(d.dia - 1, 28), hour: 19, minute: 0 }, allowWhileIdle: true } });
          if (d.dia <= 28) nots.push({ id: 7001 + k * 2, title: montos ? `Hoy vence ${d.nombre}` : 'Hoy tienes un pago', body: montos ? cuerpo : B0, schedule: { on: { day: d.dia, hour: 8, minute: 0 }, allowWhileIdle: true } });
        });
        fijosR.forEach((f, k) => nots.push({ id: 7400 + k, title: montos ? `Hoy se paga ${f.nombre}` : 'Hoy tienes un pago', body: montos ? `${pesos(f.monto)}. Cuando lo paguen, regístrenlo en TU Y YO.` : B0, schedule: { on: { day: Math.min(f.dia, 28), hour: 9, minute: 0 }, allowWhileIdle: true } }));
        if (nots.length) await LN.schedule({ notifications: nots });
      } catch (err) { console.error('recordatorios', err); recFirma = ''; }
    }, 1500);
  }

  // Botón atrás de Android
  const AppP = plugin('App');
  if (AppP) AppP.addListener('backButton', () => {
    const lu = document.querySelector('.logro-up'); if (lu) { lu.querySelector('[data-act=cerrarLogro]')?.click(); return; }
    if (!sheet.hidden) cerrar();
    else if (S.tab !== 'inicio') { S.tab = 'inicio'; render(); }
    else AppP.exitApp();
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const lu = document.querySelector('.logro-up'); if (lu) { lu.querySelector('[data-act=cerrarLogro]')?.click(); return; }
    if (!sheet.hidden) cerrar();
  });
  // Deslizar un gasto a la izquierda abre su detalle con la opción de eliminar.
  let toque = null;
  document.addEventListener('touchstart', e => { const w = e.target.closest('.item-wrap'); toque = w ? { w, x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0 } : null; }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!toque) return; const dx = e.touches[0].clientX - toque.x, dy = e.touches[0].clientY - toque.y;
    if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) { toque.w.style.transform = ''; toque = null; return; }
    toque.dx = Math.min(0, dx); toque.w.style.transform = `translateX(${Math.max(-90, toque.dx)}px)`; toque.w.classList.toggle('deslizando', toque.dx < -20);
  }, { passive: true });
  document.addEventListener('touchend', () => {
    if (!toque) return; const { w, dx } = toque; toque = null;
    w.style.transform = ''; w.classList.remove('deslizando');
    if (dx < -80) { const g = S.gastos.find(x => x.id === w.dataset.id); if (g && !oculto(g)) { abrir(vistaGasto(g)); const z = $('#borrarZona'); if (z) z.innerHTML = borrarConfirm('gastos', g.id); vibrar(); } }
  });

  Store.iniciar();
})();
