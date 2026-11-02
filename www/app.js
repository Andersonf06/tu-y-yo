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

  const CATS = [
    { id: 'mercado', n: 'Mercado', c: '#3552E8' },
    { id: 'hogar', n: 'Hogar y servicios', c: '#5B7BE0' },
    { id: 'transporte', n: 'Transporte', c: '#2F9FB3' },
    { id: 'comida', n: 'Comida fuera', c: '#DD8436' },
    { id: 'diversion', n: 'Diversión', c: '#E2603F' },
    { id: 'salud', n: 'Salud', c: '#2B9468' },
    { id: 'ropa', n: 'Ropa y cuidado', c: '#B07A86' },
    { id: 'mascotas', n: 'Mascotas', c: '#9C7A3C' },
    { id: 'educacion', n: 'Educación', c: '#6A6FD8' },
    { id: 'regalos', n: 'Regalos', c: '#D9577A' },
    { id: 'deudas', n: 'Deudas', c: '#7A5C99' },
    { id: 'otros', n: 'Otros', c: '#8C8399' }
  ];
  const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
  const NECESIDADES = ['mercado', 'hogar', 'transporte', 'salud', 'educacion', 'mascotas'];
  const COLS = ['gastos', 'deudas', 'metas', 'aportes', 'ingresos', 'fijos', 'cuentas', 'citas'];

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
    cup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 2.5c0 1.5 1 1.5 1 3M12 2.5c0 1.5 1 1.5 1 3"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>'
  };

  /* ---------- Estado ---------- */
  const S = {
    cfg: null, members: [], uidAuth: null, modo: 'cargando',
    gastos: [], deudas: [], metas: [], aportes: [], ingresos: [],
    mes: mesDe(hoy()), tab: 'inicio', filtro: 'todos', ultimos: {}
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
      S.cfg = d.cfg;
      for (const c of COLS) S[c] = Object.entries(d.cols[c] || {}).map(([id, v]) => ({ id, ...v }));
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
        S.members = d.members || []; S.cfg = Object.assign(cfgBase(), d.cfg || {});
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
          S[c] = q.docs.map(d => ({ id: d.id, ...d.data() }));
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
      S.cfg = cfg;
      if (S.modo === 'nube') await this.hogar.update({ cfg });
      else { const d = this.leerLocal(); d.cfg = cfg; this.guardarLocal(d); render(); }
    },
    async poner(col, id, data) {
      id = id || uid();
      const previo = (S[col] || []).find(x => x.id === id);
      data = { ...data, por: previo?.por || data.por || yo() };
      if (previo && previo.por && previo.por !== yo()) data.editadoPor = yo();
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
    const autor = ch => { const d = ch.doc.data(); return ch.type === 'added' ? d.por : (d.editadoPor || d.por); };
    const suyos = cambios.filter(ch => ch.type !== 'removed' && autor(ch) && autor(ch) !== yo());
    if (!suyos.length) return;
    const x = suyos[suyos.length - 1].doc.data(), quien = nom(autor(suyos[suyos.length - 1]));
    let txt;
    if (col === 'gastos') txt = `${quien} ${suyos[0].type === 'added' ? 'registró' : 'editó'}: ${x.privado ? 'un gasto personal' : (x.desc || CAT[x.categoria]?.n || 'un gasto')} · ${pesos(x.monto)}`;
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
  function calcular(mes) {
    const g = S.gastos.filter(x => mesDe(x.fecha) === mes && x.categoria !== 'ajuste');
    const extras = S.ingresos.filter(x => mesDe(x.fecha) === mes);
    const cfg = S.cfg || cfgBase();
    const ingresos = (cfg.ingresos.a || 0) + (cfg.ingresos.b || 0) + sum(extras);
    const porCat = {}; for (const x of g) porCat[x.categoria] = (porCat[x.categoria] || 0) + (x.monto || 0);
    const gastado = sum(g);
    const ahorro = sum(S.aportes.filter(x => mesDe(x.fecha) === mes));
    const metaAhorro = ingresos * (cfg.metaAhorroPct || 0) / 100;
    const pagadoPor = { a: sum(g.filter(x => x.pagadoPor === 'a')), b: sum(g.filter(x => x.pagadoPor === 'b')) };
    const cuotasPend = S.deudas.reduce((a, d) => {
      const st = estadoDeuda(d); if (st.saldo <= 0 && !st.pagadoMes) return a;
      return st.alDia ? a : a + Math.max(0, st.cuotaMes - st.pagadoMes);
    }, 0);
    const libre = ingresos - gastado - ahorro;
    const libreReal = libre - Math.max(0, metaAhorro - ahorro) - (mes === mesDe(hoy()) ? cuotasPend : 0);
    const presDiv = cfg.presupuestos.diversion || 0;
    const divGastado = porCat.diversion || 0;
    return { g, ingresos, porCat, gastado, ahorro, metaAhorro, pagadoPor, cuotasPend, libre, libreReal, presDiv, divGastado, extras };
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
  const BANCOS = ['Bancolombia', 'Davivienda', 'Banco de Bogotá', 'BBVA', 'Banco de Occidente', 'Banco Popular', 'AV Villas', 'Scotiabank Colpatria', 'Banco Caja Social', 'Banco Agrario', 'Itaú', 'Nu Colombia', 'Banco Falabella', 'Lulo Bank', 'RappiCard', 'Banco Finandina', 'Banco Serfinanza', 'Banco W', 'Bancamía', 'Coomeva', 'Fondo de empleados', 'Cooperativa', 'Familiar o amigo', 'Almacén o tienda'];
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
      <span class="ico" style="background:${st.dias != null && st.dias < 0 ? 'var(--bad)' : 'var(--azul)'}" aria-hidden="true">${ICON.card}</span>
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
    const ahorrado = sum(ap);
    const meses = new Set(ap.map(x => mesDe(x.fecha))).size || 1;
    const ritmo = ahorrado / meses;
    const falta = Math.max(0, (m.objetivo || 0) - ahorrado);
    let eta = null;
    if (falta > 0 && ritmo > 0) eta = sumarMes(mesDe(hoy()), Math.ceil(falta / ritmo));
    return { ahorrado, pct: m.objetivo ? Math.min(1, ahorrado / m.objetivo) : 0, falta, ritmo, eta,
      porA: sum(ap.filter(x => x.quien === 'a')), porB: sum(ap.filter(x => x.quien === 'b')) };
  }

  /* ---------- Render ---------- */
  const app = $('#app'), nav = $('#nav');
  let renderPend = false;
  function render() {
    if (renderPend) return; renderPend = true;
    requestAnimationFrame(() => { renderPend = false; pintar(); });
  }
  function pintar() {
    if (S.modo === 'cargando') return;
    if (!S.cfg || !S.cfg.nombres?.a) { nav.hidden = true; app.innerHTML = vistaBienvenida(); return; }
    nav.hidden = false;
    nav.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-current', b.dataset.tab === S.tab ? 'page' : 'false'));
    const vistas = { inicio: vistaInicio, gastos: vistaGastos, deudas: vistaDeudas, ahorro: vistaPlanes };
    const clave = S.tab + S.mes;
    const nuevaVista = S._vista !== clave; S._vista = clave;
    app.innerHTML = cabecera() + `<div class="view${nuevaVista ? '' : ' quieta'}">${vistas[S.tab]()}</div>`;
    programarRecordatorios();
    if (!nuevaVista) app.querySelector('.view').style.animation = 'none';
    contar();
  }
  function contar() {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    app.querySelectorAll('[data-num]').forEach(el => {
      const fin = Number(el.dataset.num), k = el.dataset.k || '';
      const ini0 = S.ultimos[k] ?? 0; S.ultimos[k] = fin;
      if (reduce || ini0 === fin) { el.textContent = pesos(fin); return; }
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
      <button class="icon-btn" data-act="ajustes" aria-label="Ajustes">${ICON.gear}</button>
    </header>
    ${S.tab !== 'deudas' ? `<div class="month">
      <button class="icon-btn" data-act="mes" data-n="-1" aria-label="Mes anterior">${ICON.left}</button>
      <h2>${esc(nombreMes(S.mes))}</h2>
      <button class="icon-btn" data-act="mes" data-n="1" aria-label="Mes siguiente">${ICON.right}</button>
    </div>` : '<div style="height:6px"></div>'}
    ${S.modo === 'nube' && S.members.length < 2 ? `<div class="banner">${ICON.users}<span>Falta que ${esc(nom(yo() === 'a' ? 'b' : 'a'))} se vincule.</span><button class="btn soft" data-act="invitar" style="padding:8px 12px">Ver código</button></div>` : ''}
    ${S.modo === 'local' ? `<div class="banner">${ICON.link}<span>${PREVIEW ? 'Vista previa: los datos quedan solo en este dispositivo.' : 'Vincula a tu pareja para que los dos vean y editen todo.'}</span><button class="btn soft" data-act="conectar" style="padding:8px 12px">${PREVIEW ? 'Opciones' : 'Vincular'}</button></div>` : ''}`;
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
    // donut
    const partes = [];
    const cats = Object.entries(c.porCat).sort((a, b) => b[1] - a[1]);
    for (const [k, v] of cats) partes.push({ n: CAT[k]?.n || k, v, col: CAT[k]?.c || '#999' });
    if (c.ahorro > 0) partes.push({ n: 'Ahorro', v: c.ahorro, col: 'var(--ok)' });
    if (c.libre > 0) partes.push({ n: 'Sin asignar', v: c.libre, col: 'var(--surface-2)' });
    const total = Math.max(c.ingresos, sum(partes, p => p.v)) || 1;
    const R = 56, L = 2 * Math.PI * R; let acc = 0;
    const arcs = partes.map((p, i) => {
      const len = p.v / total * L; const s = `<circle class="arc" cx="75" cy="75" r="${R}" stroke="${p.col}" stroke-dasharray="${Math.max(0, len - 1.5)} ${L}" stroke-dashoffset="${-acc}" style="animation-delay:${i * 60}ms"><title>${esc(p.n)}: ${pesos(p.v)}</title></circle>`;
      acc += len; return s;
    }).join('');
    const net = balance();
    const deudor = net > 0 ? 'b' : 'a', acreedor = otro(deudor);
    // presupuestos
    const pres = S.cfg.presupuestos || {};
    const filas = CATS.filter(k => c.porCat[k.id]).map((k, i) => {
      const g = c.porCat[k.id] || 0, p = pres[k.id] || 0, r = p ? g / p : 0;
      const est = !p ? '<span class="pill azul">sin tope</span>' : r > 1 ? `<span class="pill bad">+${pesos(g - p)}</span>` : r > .85 ? '<span class="pill warn">al límite</span>' : `<span class="pill ok">quedan ${corto(p - g)}</span>`;
      return `<div class="bar-row" style="--i:${i}"><div class="lbl"><b>${esc(k.n)}</b><span class="num">${pesos(g)}${p ? ' / ' + corto(p) : ''} ${est}</span></div>
        <div class="track"><div style="width:${p ? Math.min(100, r * 100) : 100}%;background:${r > 1 ? 'var(--bad)' : k.c};animation-delay:${i * 50}ms;${!p ? 'opacity:.35' : ''}"></div></div></div>`;
    }).join('');
    // 6 meses
    const meses = [...Array(6)].map((_, i) => sumarMes(S.mes, i - 5));
    const datos = meses.map(m => { const x = calcular(m); return { m, g: x.gastado, a: x.ahorro }; });
    const maxV = Math.max(1, ...datos.map(d => d.g + d.a));
    const cols = datos.map((d, i) => `<div class="col"><div class="stack" title="${esc(nombreMes(d.m))}: gastos ${pesos(d.g)}, ahorro ${pesos(d.a)}">
      <div style="height:${d.a / maxV * 100}%;background:var(--ok);animation-delay:${i * 60}ms"></div>
      <div style="height:${d.g / maxV * 100}%;background:${d.m === S.mes ? 'var(--azul)' : 'var(--azul-soft)'};animation-delay:${i * 60}ms"></div></div>
      <small>${esc(nombreMes(d.m, { month: 'short' }).replace('.', ''))}</small></div>`).join('');
    const divRest = c.presDiv - c.divGastado;

    return `
    <section class="hero">
      <div class="eyebrow">${libreTxt}</div>
      <div class="big num" data-num="${Math.abs(Math.round(c.libreReal))}" data-k="libre">${pesos(Math.abs(c.libreReal))}</div>
      <div class="nota">${c.metaAhorro > 0 ? `Ya descontamos la meta de ahorro (${S.cfg.metaAhorroPct}%)${c.cuotasPend > 0 && S.mes === mesDe(hoy()) ? ' y las cuotas pendientes' : ''}.` : 'Configura una meta de ahorro en ajustes.'}</div>
      <div class="stats">
        <div class="stat"><span>Ingresos</span><b class="num">${corto(c.ingresos)}</b></div>
        <div class="stat"><span>Gastado</span><b class="num">${corto(c.gastado)}</b></div>
        <div class="stat"><span>Ahorrado</span><b class="num">${corto(c.ahorro)}</b></div>
      </div>
    </section>

    ${(() => {
      if (S.mes !== mesDe(hoy())) return '';
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
      return rv.length ? `<section class="card"><h3>${ICON.chat.replace('<svg', '<svg style="width:18px;height:18px;color:var(--verde)"')} Para hablar juntos</h3><div style="display:grid;gap:10px">${rv.map(x => `<div class="pago-row"><span class="ico" style="background:var(--${x.pagadoPor === 'b' ? 'verde' : 'azul'})">${esc(ini(x.pagadoPor))}</span><div class="t"><b>${esc(descDe(x))} · ${pesos(x.monto)}</b><small>${x.nota ? '«' + esc(x.nota) + '»' : esc(nombreDia(x.fecha))}</small></div><button class="btn ghost" data-act="hablado" data-id="${esc(x.id)}">Ya lo hablamos</button></div>`).join('')}</div></section>` : '';
    })()}

    <section class="card">
      <h3>¿A dónde va cada peso? <span class="sub">${c.ingresos ? Math.round(ahorroPct * 100) + '% ahorrado' : ''}</span></h3>
      ${partes.length ? `<div class="donut-wrap">
        <svg class="donut" viewBox="0 0 150 150" role="img" aria-label="Distribución del ingreso">
          <circle cx="75" cy="75" r="${R}" fill="none" stroke="var(--surface-2)" stroke-width="18"/>${arcs}
          <text x="75" y="72" text-anchor="middle" font-size="11" fill="var(--muted)" style="fill:var(--muted)">gastado</text>
          <text x="75" y="90" text-anchor="middle" font-size="17" font-weight="800">${c.ingresos ? Math.round(c.gastado / c.ingresos * 100) : 0}%</text>
        </svg>
        <div class="legend">${partes.slice(0, 8).map(p => `<div><i style="background:${p.col}"></i><span>${esc(p.n)}</span><span>${c.ingresos ? Math.round(p.v / c.ingresos * 100) : 0}% · ${corto(p.v)}</span></div>`).join('')}</div>
      </div>` : vacio('Aún no hay movimientos este mes', 'Toca el botón + para escanear una factura o anotar un gasto.')}
    </section>

    ${(() => {
      if (S.modo !== 'nube' && !PREVIEW) return '';
      const items = [
        ...S.gastos.filter(x => x.categoria !== 'ajuste').map(x => ({ t: x.creado, por: x.por || x.pagadoPor, txt: descDe(x), m: x.monto, act: 'editarGasto', id: x.id })),
        ...S.aportes.map(x => ({ t: x.creado, por: x.por || x.quien, txt: 'Aporte a ' + (S.metas.find(m => m.id === x.metaId)?.nombre || 'una meta'), m: x.monto })),
        ...S.ingresos.map(x => ({ t: x.creado, por: x.por || x.quien, txt: x.desc || 'Ingreso extra', m: x.monto, mas: true, act: 'editarIngreso', id: x.id }))
      ].filter(x => x.t).sort((a, b) => b.t - a.t).slice(0, 5);
      if (!items.length) return '';
      return `<section class="card"><h3>${ICON.users.replace('<svg', '<svg style="width:18px;height:18px;color:var(--azul)"')} Lo último de los dos</h3><div class="act">${items.map(x => `<button class="act-row" ${x.act ? `data-act="${x.act}" data-id="${esc(x.id)}"` : 'disabled'}>
        <span class="av ${esc(x.por)}">${esc(ini(x.por))}</span><span class="t"><b>${esc(x.txt)}</b><small>${esc(x.por === yo() && S.modo === 'nube' ? 'Tú' : nom(x.por))} · ${esc(haceTiempo(x.t))}</small></span>
        <span class="m num" ${x.mas ? 'style="color:var(--ok)"' : ''}>${x.mas ? '+' : ''}${pesos(x.m)}</span></button>`).join('')}</div></section>`;
    })()}

    <section class="card">
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
    </section>

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
        <div class="track"><div style="width:${Math.min(100, c.divGastado / c.presDiv * 100)}%;background:${divRest < 0 ? 'var(--bad)' : 'linear-gradient(90deg,var(--azul),var(--verde))'}"></div></div></div>
        <button class="btn ghost full" style="margin-top:12px" data-act="tab" data-tab="ahorro">Ver planes que les alcanzan</button>`
        : `<p class="muted" style="margin:0 0 12px">Pónganle un tope a la diversión y les diremos qué planes les alcanzan sin tocar el ahorro.</p><button class="btn soft full" data-act="ajustes">Definir presupuestos</button>`}
    </section>

    ${filas ? `<section class="card"><h3>Presupuesto por categoría</h3><div class="bars stagger">${filas}</div></section>` : ''}

    <section class="card">
      <h3>Últimos 6 meses <span class="sub"><span class="dot" style="background:var(--azul)"></span>gastos <span class="dot" style="background:var(--ok);margin-left:6px"></span>ahorro</span></h3>
      <div class="cols">${cols}</div>
    </section>`;
  }

  function vacio(t, d) { return `<div class="empty">${ICON.receipt}<b>${esc(t)}</b>${esc(d)}</div>`; }

  const oculto = x => x.privado && S.modo === 'nube' && x.tipo !== yo();
  const descDe = x => oculto(x) ? 'Gasto personal de ' + nom(x.tipo) : (x.desc || (CAT[x.categoria]?.n ?? 'Gasto'));
  function itemGasto(x, i) {
    const k = CAT[x.categoria] || (x.categoria === 'ajuste' ? { n: 'Saldar cuentas', c: '#8C8399' } : CAT.otros);
    const de = x.tipo === 'compartido' ? 'Compartido' : 'De ' + nom(x.tipo);
    return `<button class="item" style="--i:${i}" data-act="editarGasto" data-id="${esc(x.id)}">
      <span class="ico" style="background:${k.c}" aria-hidden="true">${esc(k.n[0])}</span>
      <span class="t"><b>${x.revisar ? `<span class="flag" title="Para hablar juntos">${ICON.chat}</span>` : ''}${x.privado ? `<span class="flag" title="Privado">${ICON.lock}</span>` : ''}${x.fijoId ? `<span class="flag" title="Gasto fijo">${ICON.repeat}</span>` : ''}${esc(descDe(x))}</b><small><span class="dot ${esc(x.pagadoPor)}"></span>Pagó ${esc(nom(x.pagadoPor))} · ${esc(de)}</small>${x.nota && !oculto(x) ? `<small class="nota">«${esc(x.nota)}»</small>` : ''}</span>
      <span class="m">${pesos(x.monto)}<small class="muted">${esc(k.n)}</small></span></button>`;
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
    return html || (q ? vacio('Nada coincide', 'Prueben con otra palabra, un valor o el nombre de una categoría.') : vacio('Sin gastos aquí', 'Escanea una factura o toca + para anotar uno.'));
  }
  const normalizarTxt = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  function vistaGastos() {
    const c = calcular(S.mes);
    const f = S.filtro;
    const html = listaGastos();
    const fijos = S.fijos.filter(x => x.activo !== false).sort((a, b) => (!!estadoFijo(a, S.mes).pago - !!estadoFijo(b, S.mes).pago) || (a.dia || 99) - (b.dia || 99));
    const totFijos = sum(fijos), pendFijos = fijos.filter(x => !estadoFijo(x, S.mes).pago);
    const subs = fijos.filter(x => x.suscripcion);
    const extras = c.extras.sort((a, b) => b.fecha.localeCompare(a.fecha));
    const chip = (v, t) => `<button class="chip" data-act="filtro" data-f="${v}" aria-pressed="${f === v}">${esc(t)}</button>`;
    return `
      <div class="card" style="padding:14px 18px"><div class="row" style="align-items:center">
        <div><div class="eyebrow">Gastado en el mes</div><div style="font:800 28px var(--f-display)" class="num" data-num="${Math.round(c.gastado)}" data-k="gmes">${pesos(c.gastado)}</div></div>
        <div style="display:flex;gap:8px;flex:none"><button class="btn soft icon-only" data-act="dictar" aria-label="Dictar gasto">${ICON.mic}</button><button class="btn" data-act="escanear">${ICON.cam} Escanear</button></div></div></div>
      <section class="card">
        <h3>${ICON.repeat.replace('<svg', '<svg style="width:18px;height:18px;color:var(--azul)"')} Gastos fijos del mes <span class="sub">${fijos.length ? (pendFijos.length ? pendFijos.length + ' pendiente' + (pendFijos.length === 1 ? '' : 's') : 'todos pagados') : ''}</span></h3>
        ${fijos.length ? `<div class="muted" style="font-size:13px;margin:-6px 0 12px">Suman ${pesos(totFijos)} al mes${subs.length ? ` · ${subs.length} suscripcion${subs.length === 1 ? '' : 'es'}: ${pesos(sum(subs))} al mes, ${pesos(sum(subs) * 12)} al año` : ''}</div>
          <div class="stagger" style="display:grid;gap:10px">${fijos.map((x, i) => filaFijo(x, i)).join('')}</div>`
          : '<p class="muted" style="margin:0 0 4px">Arriendo, servicios, internet, Netflix… anótenlos una vez y cada mes los marcan como pagados con un toque.</p>'}
        <button class="btn soft full" style="margin-top:12px" data-act="nuevoFijo">Agregar gasto fijo o suscripción</button>
      </section>
      <label class="buscar" for="buscar">${ICON.search}<input id="buscar" class="input" type="search" placeholder="Buscar en todos los gastos" value="${esc(S.buscar || '')}" autocomplete="off"></label>
      <div class="chips" role="group" aria-label="Filtrar">${chip('todos', 'Todos')}${chip('compartido', 'Compartidos')}${chip('a', 'De ' + nom('a'))}${chip('b', 'De ' + nom('b'))}</div>
      <div class="list stagger" id="listaG">${html}</div>
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
          <div class="eyebrow">${esc(tipo)}</div>
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
          <div><small>${d.plazo ? 'Cuotas pagadas' : 'Tasa'}</small><b>${d.plazo ? Math.min(st.numCuota, d.plazo) + ' de ' + d.plazo : d.tasa ? esc(d.tasa) + '% ' + (d.tasaTipo === 'mv' ? 'M.V.' : 'E.A.') : 'Sin tasa'}</b></div>
        </div>
        ${notas}${conjunta}
        <div class="row">${st.saldo > 0 ? `<button class="btn" data-act="pagarDeuda" data-id="${esc(d.id)}">Registrar pago</button>` : ''}<button class="btn ghost" data-act="verDeuda" data-id="${esc(d.id)}">Pagos y saldo</button></div>
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
      ${activas.length > 1 ? `<section class="card idea"><span class="ico">${ICON.snow}</span><div><b>Estrategia sugerida</b><p>${aval && aval.d.tasa && (aval.d.tasaTipo === 'mv' ? aval.d.tasa * 12 : aval.d.tasa) >= 20 ? `Abonen lo extra primero a «${esc(aval.d.nombre)}»: tiene la tasa más alta y es la que más intereses les cobra. En las demás paguen solo la cuota.` : `Método bola de nieve: paguen la cuota de todas y abonen lo extra a «${esc(bola.d.nombre)}», la más pequeña. Cuando la terminen, esa cuota se suma a la siguiente.`}</p></div></section>` : ''}
      <div class="stagger" style="display:grid;gap:14px">${tarjetas || `<section class="card">${vacio('Sin deudas registradas', 'Agreguen tarjetas, créditos o préstamos: banco, cuota, día de pago y si es de uno o de los dos.')}</section>`}</div>
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

    const metas = S.metas.map(m => ({ m, st: estadoMeta(m) }));
    const citaMes = S.citas.find(x => (x.mes || x.id) === S.mes && x.hecho);
    const racha = rachaCitas();
    return `
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
      </section>

      <h2 style="font:800 20px var(--f-display);margin:8px 4px 0">Metas de ahorro</h2>
      <div class="stagger" style="display:grid;gap:14px">${metas.map(({ m, st }, i) => `<section class="card debt" style="--i:${i}">
        <div class="head"><div><b>${esc(m.nombre)}</b><div class="muted" style="font-size:13px">${pesos(st.ahorrado)} de ${pesos(m.objetivo)}</div>
          <div class="muted" style="font-size:13px">${st.falta <= 0 ? '<span class="pill ok">¡Meta cumplida!</span>' : st.eta ? 'A este ritmo la logran en ' + esc(nombreMes(st.eta)) : 'Hagan el primer aporte'}</div></div>${anillo(st.pct, Math.round(st.pct * 100) + '%')}</div>
        <div class="muted" style="font-size:13px"><span class="dot a"></span>${esc(nom('a'))} ${pesos(st.porA)} · <span class="dot b"></span>${esc(nom('b'))} ${pesos(st.porB)}${m.fechaLimite && st.falta > 0 ? ` · para ${esc(nombreMes(mesDe(m.fechaLimite)))} necesitan ${pesos(st.falta / Math.max(1, mesesEntre(mesDe(hoy()), mesDe(m.fechaLimite))))} al mes` : ''}</div>
        <div class="row"><button class="btn" data-act="aportar" data-id="${esc(m.id)}">Aportar</button><button class="btn ghost" data-act="editarMeta" data-id="${esc(m.id)}">Editar</button></div>
      </section>`).join('') || `<section class="card">${vacio('Sin metas todavía', 'Un viaje, un fondo de emergencia, la cuota inicial… pónganle nombre y valor.')}</section>`}</div>
      <button class="btn soft full" data-act="nuevaMeta">Crear una meta</button>`;
  }
  const mesesEntre = (a, b) => { const [y1, m1] = a.split('-').map(Number), [y2, m2] = b.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1); };

  function veredicto(monto) {
    const c = calcular(mesDe(hoy()));
    const divRest = c.presDiv ? c.presDiv - c.divGastado : null;
    const libre = c.libreReal;
    if (monto <= 0) return '';
    if (divRest != null && monto <= divRest && monto <= libre) return `<div class="verdict ok">Sí, se lo pueden dar.<small>Les quedarían ${pesos(divRest - monto)} para diversión y la meta de ahorro sigue intacta.</small></div>`;
    if (divRest == null && monto <= libre) return `<div class="verdict ok">Sí, alcanza.<small>Les quedarían ${pesos(libre - monto)} libres después de ahorrar y pagar cuotas.</small></div>`;
    if (monto <= libre) return `<div class="verdict warn">Alcanza, pero se pasan del presupuesto de diversión.<small>Excede el tope por ${pesos(monto - Math.max(0, divRest))}. Sale del margen libre (${pesos(libre)}); su ahorro no se toca.</small></div>`;
    const falta = monto - Math.max(0, libre);
    const semanal = Math.max(20000, Math.round((c.ingresos * .05 / 4.3) / 1000) * 1000);
    const semanas = Math.ceil(falta / semanal);
    return `<div class="verdict bad">Mejor esperar un poco.<small>Hoy les faltan ${pesos(falta)} sin tocar el ahorro. Si apartan ${pesos(semanal)} por semana, lo tienen en ${semanas} semana${semanas === 1 ? '' : 's'}. ¿Y si lo vuelven meta?</small></div>`;
  }

  /* ---------- Gastos fijos y suscripciones ---------- */
  function estadoFijo(f, mes) {
    const pago = S.gastos.find(x => x.fijoId === f.id && mesDe(x.fecha) === mes);
    const actual = mes === mesDe(hoy());
    const fecha = f.dia ? diaEn(mes, f.dia) : null;
    const futuro = mes > mesDe(hoy());
    return { pago, fecha, actual, dias: (actual || futuro) && fecha ? diasEntre(hoy(), fecha) : null, pasado: mes < mesDe(hoy()) };
  }
  function chipFijo(st) {
    if (st.pago) return `<span class="pill ok">Pagado ${fechaCorta(st.pago.fecha)}</span>`;
    if (st.pasado) return '<span class="pill bad">No se registró</span>';
    if (st.dias == null) return st.fecha ? `<span class="pill azul">El ${fechaCorta(st.fecha)}</span>` : '<span class="pill azul">Pendiente</span>';
    if (st.dias < 0) return `<span class="pill bad">Vencido hace ${-st.dias} día${st.dias === -1 ? '' : 's'}</span>`;
    if (st.dias === 0) return '<span class="pill bad">Vence hoy</span>';
    if (st.dias <= 5) return `<span class="pill warn">En ${st.dias} día${st.dias === 1 ? '' : 's'}</span>`;
    return `<span class="pill azul">El ${fechaCorta(st.fecha)}</span>`;
  }
  function filaFijo(f, i, mes = S.mes) {
    const st = estadoFijo(f, mes), k = CAT[f.categoria] || CAT.otros;
    return `<div class="pago-row" style="--i:${i}"><span class="ico" style="background:${k.c}" aria-hidden="true">${esc(k.n[0])}</span>
      <div class="t"><b>${esc(f.nombre)}</b><small>${pesos(f.monto)}${f.suscripcion ? ' · suscripción' : ''} · paga ${esc(nom(f.pagadoPor))}</small><div>${chipFijo(st)}</div></div>
      ${st.pago ? `<button class="btn ghost" data-act="editarFijo" data-id="${esc(f.id)}" aria-label="Editar ${esc(f.nombre)}">Editar</button>` : `<button class="btn soft" data-act="pagarFijo" data-id="${esc(f.id)}" data-mes="${esc(mes)}">Pagado</button>`}</div>`;
  }
  function formFijo(f = {}) {
    return `<h2>${f.id ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}</h2>
      <p class="muted" style="margin-top:-6px">Se repite cada mes. Cuando lo paguen, lo marcan como pagado y queda en los gastos.</p>
      <form data-form="fijo" data-id="${esc(f.id || '')}">
        <div class="field"><label for="fnombre">Nombre</label><input id="fnombre" name="fnombre" class="input" maxlength="40" required value="${esc(f.nombre || '')}" placeholder="Ej: Arriendo, Netflix, Gimnasio"></div>
        <div class="row"><div class="field"><label for="fmonto">Valor aproximado</label>${dinero('fmonto', f.monto, 'required')}</div>
          <div class="field"><label for="fdia">Día del mes</label><input id="fdia" name="fdia" class="input" inputmode="numeric" maxlength="2" value="${esc(f.dia || '')}" placeholder="1 a 31"></div></div>
        <div class="field"><label for="fcat">Categoría</label><select id="fcat" name="fcat" class="input">${CATS.filter(k => k.id !== 'deudas').map(k => `<option value="${k.id}" ${k.id === (f.categoria || 'hogar') ? 'selected' : ''}>${esc(k.n)}</option>`).join('')}</select></div>
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
        <span class="t"><b>${esc(x.nombre)}</b><small>${esc(TIPOS_CUENTA[x.tipo] || 'Cuenta')} · ${esc((x.dueno || 'ambos') === 'ambos' ? 'De los dos' : 'De ' + nom(x.dueno))} · ${esc(haceDias(x.actualizado))}</small></span>
        <span class="m">${pesos(x.saldo)}</span></button>`).join('') || '<p class="muted">Agreguen sus cuentas, ahorros, CDT o cesantías.</p>'}</div>
      <button class="btn full" style="margin-top:14px" data-act="nuevaCuenta">Agregar cuenta o bien</button>`;
  }
  function formCuenta(x = {}) {
    return `<h2>${x.id ? 'Actualizar cuenta' : 'Nueva cuenta'}</h2>
      <form data-form="cuenta" data-id="${esc(x.id || '')}">
        <div class="field"><label for="cnombre">Nombre</label><input id="cnombre" name="cnombre" class="input" maxlength="40" required value="${esc(x.nombre || '')}" placeholder="Ej: Ahorros Nu, CDT Bancolombia"></div>
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
    const gastado = p => sum(S.gastos.filter(x => x.tipo === p && mesDe(x.fecha) === mes && x.categoria !== 'deudas' && x.categoria !== 'ajuste'));
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
        ${revisar.length ? `<p style="margin:6px 0 0"><b>${revisar.length} gasto${revisar.length === 1 ? '' : 's'} para conversar:</b> ${revisar.slice(0, 5).map(x => esc(descDe(x)) + ' (' + pesos(x.monto) + ')').join(', ')}</p>` : ''}
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
    sheet.classList.remove('open');
    $('#fab').setAttribute('aria-expanded', 'false');
    clearTimeout(cierreT);
    cierreT = setTimeout(() => { sheet.hidden = true; sheetBody.innerHTML = ''; if (alCerrar) { const f = alCerrar; alCerrar = null; f(); } }, 300);
  }
  let toastT;
  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2800); }
  function confeti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
        <div class="field"><span class="lab">Categoría</span><div class="cats">${CATS.map(k => `<label><input type="radio" name="gcat" value="${k.id}" ${k.id === cat ? 'checked' : ''}><i style="background:${k.c}"></i>${esc(k.n)}</label>`).join('')}</div></div>
        <div class="field" id="campoDeuda" ${cat === 'deudas' ? '' : 'hidden'}><label for="gdeuda">¿Qué deuda pagaron?</label>
          <select id="gdeuda" name="gdeuda" class="input"><option value="">Ninguna en particular</option>${deudas.map(d => `<option value="${esc(d.id)}" ${d.id === g.deudaId ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('')}</select></div>
        <div class="field"><span class="lab">¿Quién pagó?</span>${seg('gpago', quienes(), g.pagadoPor || yo())}</div>
        <div class="field"><span class="lab">¿De quién es el gasto?</span>${seg('gtipo', [['compartido', 'De los dos'], ['a', nom('a')], ['b', nom('b')]], g.tipo || 'compartido')}</div>
        <div class="field"><label for="gfecha">Fecha</label><input id="gfecha" name="gfecha" type="date" class="input" value="${esc(g.fecha || hoy())}" required></div>
        <div class="field"><label for="gnota">Nota para los dos (opcional)</label><input id="gnota" name="gnota" class="input" maxlength="120" value="${esc(g.nota || '')}" placeholder="Ej: era para el cumpleaños de mi papá"></div>
        <label class="check" for="grev"><input type="checkbox" id="grev" name="grev" ${g.revisar ? 'checked' : ''}><span>Marcar para hablarlo juntos</span></label>
        <label class="check" for="gpriv" id="campoPriv" ${(g.tipo || 'compartido') === 'compartido' ? 'hidden' : ''}><input type="checkbox" id="gpriv" name="gpriv" ${g.privado ? 'checked' : ''}><span>Privado: mi pareja ve el valor pero no el detalle (ideal para regalos sorpresa)</span></label>
        ${g.fijoId ? `<input type="hidden" name="gfijo" value="${esc(g.fijoId)}">` : ''}
        ${g.items?.length ? `<div class="field"><span class="lab">Productos leídos de la factura</span><div class="items">${g.items.map(it => `<div><span>${esc(it.descripcion)}</span><span class="num">${pesos(it.valor)}</span></div>`).join('')}</div></div>` : ''}
        <button class="btn full">${nuevo ? 'Guardar gasto' : 'Guardar cambios'}</button>
        ${nuevo ? '' : `<div id="borrarZona"><button type="button" class="btn danger full" data-act="pedirBorrar" data-col="gastos" data-id="${esc(g.id)}">Eliminar</button></div>`}
      </form>`;
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
      <div class="list">${lista.map((x, i) => `<button class="item" style="--i:${i}" data-act="editarGasto" data-id="${esc(x.id)}">
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
        ${m.id ? `<div id="borrarZona"><button type="button" class="btn danger full" data-act="pedirBorrar" data-col="metas" data-id="${esc(m.id)}">Eliminar meta</button></div>` : ''}
      </form>`;
  }
  function formAporte(m) {
    return `<h2>Aporte a ${esc(m.nombre)}</h2>
      <form data-form="aporte" data-id="${esc(m.id)}">
        <div class="field"><label for="amonto">Valor</label>${dinero('amonto', 0, 'required autofocus')}</div>
        <div class="field"><span class="lab">¿Quién aporta?</span>${seg('aquien', quienes(), yo())}</div>
        <button class="btn full">Aportar</button>
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
        ${inicial ? '' : `<label class="check" for="rec"><input type="checkbox" id="rec" name="rec" ${c.recordatorios === false ? '' : 'checked'}><span>Avisarme en el celular cuando venzan deudas y gastos fijos</span></label>`}
        ${inicial ? '' : `<div class="field"><span class="lab">Presupuesto mensual por categoría</span>
          <button type="button" class="btn soft" data-act="sugerir">${ICON.spark} Sugerir con la regla 50/30/20</button>
          <div style="display:grid;gap:8px">${CATS.filter(k => k.id !== 'deudas').map(k => `<div style="display:grid;grid-template-columns:1fr 140px;gap:10px;align-items:center"><label for="p_${k.id}" style="font-size:14px;font-weight:600"><span class="dot" style="background:${k.c}"></span>${esc(k.n)}</label><input id="p_${k.id}" name="p_${k.id}" class="input money" style="font-size:16px;padding:9px 12px" inputmode="numeric" value="${p[k.id] ? pesos(p[k.id]) : ''}" placeholder="Sin tope"></div>`).join('')}</div></div>`}
        <button class="btn full">${inicial ? 'Empezar' : 'Guardar ajustes'}</button>
      </form>
      ${inicial ? '' : `<div style="display:grid;gap:10px;margin-top:18px">
        <button class="btn ghost full" data-act="exportar">Exportar todos los movimientos (Excel)</button>
        ${S.modo === 'nube' ? `<button class="btn ghost full" data-act="desconectar">Dejar de sincronizar en este celular</button>` : ''}
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
      <p class="muted" style="margin-top:-6px">${corto ? 'En su celular, tu pareja instala TU Y YO, toca «Mi pareja ya lo creó» y escribe este código. Vence en 48 horas y sirve para una sola persona.' : 'Envíale este código. En su celular abre TU Y YO, toca «Mi pareja ya lo creó» y lo pega. Solo entran dos personas.'}</p>
      ${corto ? `<div class="code-big" id="codTxt" tabindex="0" aria-label="Código ${esc(cod.split('').join(' '))}">${esc(conGuion(cod))}</div>${ejemplo ? '<p class="muted" style="text-align:center;margin:-4px 0 8px;font-size:12px">Código de ejemplo: en la app se genera uno real.</p>' : ''}`
        : `<div class="code" id="codTxt" tabindex="0">${esc(cod)}</div>`}
      <div class="row" style="margin-top:12px"><button class="btn" data-act="compartirCod" ${ejemplo ? 'disabled' : ''}>Compartir</button><button class="btn soft" data-act="copiarCod">Copiar</button></div>
      <p class="muted" style="font-size:13px;margin-top:14px">Cuando tu pareja entre, verás aquí: «${esc(nom('b'))} se unió».</p>`;
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
    const g = { monto: r.monto, desc: r.desc, categoria: r.categoria, pagadoPor: r.pagadoPor, tipo: r.de, fecha: r.fecha };
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
      sheetBody.innerHTML = formGasto({ monto: r.total || 0, desc: r.comercio || '', fecha: r.fecha && r.fecha <= hoy() ? r.fecha : hoy(), categoria: r.categoria, items: r.items }, aviso);
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
      case 'setup': abrir(formAjustes(true)); break;
      case 'unirme': abrir(PREVIEW ? `${formUnirme().replace('data-form="unirme"', 'data-form="unirmeEjemplo"')}<p class="muted" style="font-size:13px">En la vista previa no se puede vincular de verdad.</p>` : formUnirme()); break;
      case 'conectar': abrir(PREVIEW ? soloApp() : CONFIG_APP ? vistaVincular() : formConectar()); break;
      case 'dictar': abrir(vistaVoz(), () => { if (escuchando) detenerVoz(); }); setTimeout(() => { if (nativo) escuchar(); }, 450); break;
      case 'escuchar': escuchar(); break;
      case 'ejemploVoz': { const i = $('#vozFrase'); if (i) i.value = t.dataset.t; entenderFrase(t.dataset.t); break; }
      case 'codigoEjemplo': abrir(vistaCodigo('K7M4QP', true)); break;
      case 'crearCodigo': {
        t.disabled = true; t.textContent = 'Creando código…';
        try { const cod = await Store.crearHogar(CONFIG_APP); vibrar(); confeti(); sheetBody.innerHTML = vistaCodigo(cod); }
        catch (err) { console.error(err); toast('No pudimos crear el código. Revisa tu conexión a internet.'); t.disabled = false; t.textContent = 'Crear código para mi pareja'; }
        break;
      }
      case 'pedirReinvitar': $('#reZona').innerHTML = `<p class="muted" style="font-size:13px;margin:0 0 8px">${esc(nom(yo() === 'a' ? 'b' : 'a'))} saldrá del celular anterior y entrará con un código nuevo. Los datos no se borran.</p><div class="row"><button class="btn ghost" data-act="cancelReinvitar">Cancelar</button><button class="btn" data-act="reinvitar">Crear código nuevo</button></div>`; break;
      case 'cancelReinvitar': $('#reZona').innerHTML = '<button class="btn ghost full" data-act="pedirReinvitar">Mi pareja cambió de celular</button>'; break;
      case 'reinvitar': try { const cod = await Store.reinvitar(); abrir(vistaCodigo(cod)); } catch (err) { console.error(err); toast('No pudimos crear el código nuevo.'); } break;
      case 'ejemplo': cargarEjemplo(); break;
      case 'reiniciar': ls.del(LOCAL); S.tab = 'inicio'; cerrar(); Store.iniciarLocal(); break;
      case 'escanear': cerrarMenu(); tomarFoto('camara'); break;
      case 'galeria': cerrarMenu(); tomarFoto('galeria'); break;
      case 'nuevoGasto': abrir(formGasto()); break;
      case 'nuevaDeuda': abrir(formDeuda()); break;
      case 'nuevaMeta': abrir(formMeta()); break;
      case 'nuevoIngreso': abrir(formIngreso()); break;
      case 'elegirDeuda': abrir(`<h2>¿Qué deuda pagaron?</h2><div class="menu">${S.deudas.filter(d => estadoDeuda(d).saldo > 0).map((d, i) => `<button style="--i:${i}" data-act="pagarDeuda" data-id="${esc(d.id)}"><span class="ico" style="background:var(--azul)">${ICON.card}</span><span><b>${esc(d.nombre)}</b><small>Saldo ${pesos(estadoDeuda(d).saldo)}</small></span></button>`).join('') || '<p class="muted">No hay deudas activas.</p>'}</div>`); break;
      case 'elegirMeta': abrir(`<h2>¿A qué meta aportan?</h2><div class="menu">${S.metas.map((m, i) => `<button style="--i:${i}" data-act="aportar" data-id="${esc(m.id)}"><span class="ico" style="background:var(--ok)">${ICON.piggy}</span><span><b>${esc(m.nombre)}</b><small>${Math.round(estadoMeta(m).pct * 100)}% logrado</small></span></button>`).join('') || '<p class="muted">Aún no hay metas. Créenlas en Planes.</p>'}</div>`); break;
      case 'editarGasto': { const g = S.gastos.find(x => x.id === id); if (g) abrir(oculto(g) ? `<h2>Gasto personal</h2><p class="muted">${esc(nom(g.tipo))} marcó este gasto como privado: ves el valor (${pesos(g.monto)}), no el detalle.</p>` : formGasto(g)); break; }
      case 'editarDeuda': { const d = S.deudas.find(x => x.id === id); if (d) abrir(formDeuda(d)); break; }
      case 'pagarDeuda': { const d = S.deudas.find(x => x.id === id); if (d) { abrir(formPagoDeuda(d)); resumenPago($('form[data-form=pagoDeuda]')); } break; }
      case 'editarMeta': { const m = S.metas.find(x => x.id === id); if (m) abrir(formMeta(m)); break; }
      case 'aportar': { const m = S.metas.find(x => x.id === id); if (m) abrir(formAporte(m)); break; }
      case 'editarIngreso': { const x = S.ingresos.find(y => y.id === id); if (x) abrir(formIngreso(x)); break; }
      case 'nuevoFijo': abrir(formFijo()); break;
      case 'editarFijo': { const x = S.fijos.find(y => y.id === id); if (x) abrir(formFijo(x)); break; }
      case 'pagarFijo': { const x = S.fijos.find(y => y.id === id); if (!x) break; const mes = t.dataset.mes || mesDe(hoy());
        abrir(formGasto({ desc: x.nombre, monto: x.monto, categoria: x.categoria, pagadoPor: x.pagadoPor, tipo: x.tipo, fecha: mes === mesDe(hoy()) ? hoy() : diaEn(mes, x.dia || 1), fijoId: x.id }, 'Confirma el valor: si este mes cambió (por ejemplo, los servicios), corrígelo.')); break; }
      case 'cuentas': abrir(vistaCuentas()); break;
      case 'nuevaCuenta': abrir(formCuenta()); break;
      case 'editarCuenta': { const x = S.cuentas.find(y => y.id === id); if (x) abrir(formCuenta(x)); break; }
      case 'cita': abrir(vistaCita(S.mes)); break;
      case 'hablado': { const g = S.gastos.find(x => x.id === id); if (!g) break; const d = { ...g }; delete d.id; delete d.revisar; await Store.poner('gastos', id, d); toast('Listo, ya lo hablaron'); break; }
      case 'exportar': try { await exportarCSV(); } catch (err) { console.error(err); toast('No se pudo exportar'); } break;
      case 'verDeuda': { const d = S.deudas.find(x => x.id === id); if (d) abrir(vistaDeuda(d)); break; }
      case 'pedirBorrar': $('#borrarZona').innerHTML = borrarConfirm(t.dataset.col, id); break;
      case 'cancelBorrar': $('#borrarZona').innerHTML = `<button type="button" class="btn danger full" data-act="pedirBorrar" data-col="${esc(t.dataset.col)}" data-id="${esc(id)}">Eliminar</button>`; break;
      case 'borrar':
        try {
          await Store.quitar(t.dataset.col, id);
          if (t.dataset.col === 'metas') for (const a of S.aportes.filter(x => x.metaId === id)) await Store.quitar('aportes', a.id);
          cerrar(); toast('Eliminado');
        } catch (err) { console.error(err); toast('No se pudo eliminar. Revisa tu conexión.'); }
        break;
      case 'saldar': {
        const net = balance(); if (!net) break;
        const deudor = net > 0 ? 'b' : 'a';
        await Store.poner('gastos', null, { desc: `${nom(deudor)} saldó cuentas`, monto: Math.abs(net), fecha: hoy(), categoria: 'ajuste', pagadoPor: deudor, tipo: otro(deudor), creado: Date.now() });
        vibrar(); confeti(); toast('¡Cuentas saldadas!'); break;
      }
      case 'sugerir': {
        const ing = digitos($('#ia').value) + digitos($('#ib').value);
        if (!ing) { toast('Primero escribe los ingresos'); break; }
        const reparto = { mercado: .15, hogar: .22, transporte: .07, salud: .03, educacion: .02, mascotas: .01, comida: .06, diversion: .08, ropa: .05, regalos: .03, otros: .08 };
        for (const [k, v] of Object.entries(reparto)) { const el = $('#p_' + k); if (el) el.value = pesos(Math.round(ing * v / 10000) * 10000); }
        $('#meta').value = 20; toast('50% necesidades, 30% gustos, 20% ahorro'); break;
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
    if (el.id === 'buscar') { S.buscar = el.value; const l = $('#listaG'); if (l) l.innerHTML = listaGastos(); }
  });
  document.addEventListener('change', e => {
    if (e.target.name === 'reparto') { const c = $('#campoPct'); if (c) c.hidden = e.target.value !== 'custom'; }
    if (e.target.name === 'dtipo') { const t = e.target.value === 'tarjeta'; $('#campoCupo').hidden = !t; $('#campoPlazo').hidden = t; $('#lblCuota').textContent = t ? 'Pago mínimo o lo que pagan al mes' : 'Cuota mensual'; }
    if (e.target.name === 'gtipo') { const c = $('#campoPriv'); if (c) c.hidden = e.target.value === 'compartido'; }
    if (e.target.name === 'dresp') { const n = $('#notaConjunta'); if (n) n.hidden = e.target.value !== 'ambos'; }
    if (e.target.name === 'ptipo') { const c = $('#campoInt'), f = e.target.form; if (c) c.hidden = e.target.value === 'abono' || Number(f.dataset.i) === 0; }
    if (e.target.form?.dataset.form === 'pagoDeuda') resumenPago(e.target.form);
    if (e.target.name === 'gcat') { const c = $('#campoDeuda'); if (c) c.hidden = e.target.value !== 'deudas'; }
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
        if (f.elements.grev?.checked) data.revisar = true;
        if (data.tipo !== 'compartido' && f.elements.gpriv?.checked) data.privado = true;
        const fijoId = v('gfijo') || prev?.fijoId; if (fijoId) data.fijoId = fijoId;
        if (data.deudaId) {
          const interes = prev && prev.deudaId === data.deudaId ? Math.min(monto, prev.interes || 0) : 0;
          data.interes = interes; data.capital = monto - interes; data.abono = !!prev?.abono;
        }
        await Store.poner('gastos', id, data);
        vibrar(); cerrar(); toast(id ? 'Gasto actualizado' : 'Gasto guardado');
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
      } else if (tipo === 'fijo') {
        const dia = Math.round(Number(v('fdia')));
        const data = { nombre: v('fnombre').trim().slice(0, 40), monto: digitos(v('fmonto')), dia: dia >= 1 && dia <= 31 ? dia : null,
          categoria: CAT[v('fcat')] ? v('fcat') : 'hogar', pagadoPor: v('fpago') === 'b' ? 'b' : 'a',
          tipo: ['a', 'b'].includes(v('ftipo')) ? v('ftipo') : 'compartido', suscripcion: !!f.elements.fsub?.checked, activo: true };
        if (!data.nombre || !data.monto) { toast('Pon nombre y valor'); return; }
        await Store.poner('fijos', id, data); vibrar(); cerrar(); toast('Gasto fijo guardado');
      } else if (tipo === 'cuenta') {
        const data = { nombre: v('cnombre').trim().slice(0, 40), tipo: TIPOS_CUENTA[v('ctipo')] ? v('ctipo') : 'otro', saldo: digitos(v('csaldo')),
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
        await Store.poner('aportes', null, { metaId: id, monto, quien: v('aquien') === 'b' ? 'b' : 'a', fecha: hoy(), creado: Date.now() });
        vibrar(); confeti(); cerrar(); toast('¡Un paso más cerca!');
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
        if (!f.dataset.inicial) { c.recordatorios = !!f.elements.rec?.checked; c.mesada = { a: digitos(v('ma')), b: digitos(v('mb')) }; }
        if (!f.dataset.inicial) { const p = {}; for (const k of CATS) { const n = digitos(v('p_' + k.id)); if (n) p[k.id] = n; } c.presupuestos = p; }
        if (!c.nombres.a || !c.nombres.b) { toast('Escriban los dos nombres'); return; }
        await Store.guardarCfg(c); vibrar(); cerrar();
        if (f.dataset.inicial) { confeti(); toast('¡Bienvenidos a TU Y YO!'); } else toast('Ajustes guardados');
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
        vibrar(); confeti(); cerrar(); toast(`¡Listo! Ya estás vinculado con ${nom(yo() === 'a' ? 'b' : 'a')}`);
      }
    } catch (err) {
      console.error(err);
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
    const firma = (S.cfg.recordatorios === false ? 'off' : 'on') + JSON.stringify(activas.map(d => [d.id, d.dia, d.nombre, d.cuota, bancoDe(d)])) + JSON.stringify(fijosR.map(f => [f.id, f.dia, f.nombre, f.monto]));
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
        activas.forEach((d, k) => {
          const cuerpo = `${bancoDe(d) ? bancoDe(d) + ' · ' : ''}${d.cuota ? 'Cuota de ' + pesos(d.cuota) + '. ' : ''}Cuando paguen, regístrenlo en TU Y YO.`;
          if (d.dia > 1) nots.push({ id: 7000 + k * 2, title: `Se acerca el pago de ${d.nombre}`, body: `Vence el día ${d.dia}. ${cuerpo}`, schedule: { on: { day: Math.min(d.dia - 1, 28), hour: 19, minute: 0 }, allowWhileIdle: true } });
          if (d.dia <= 28) nots.push({ id: 7001 + k * 2, title: `Hoy vence ${d.nombre}`, body: cuerpo, schedule: { on: { day: d.dia, hour: 8, minute: 0 }, allowWhileIdle: true } });
        });
        fijosR.forEach((f, k) => nots.push({ id: 7400 + k, title: `Hoy se paga ${f.nombre}`, body: `${pesos(f.monto)}. Cuando lo paguen, márquenlo como pagado en TU Y YO.`, schedule: { on: { day: Math.min(f.dia, 28), hour: 9, minute: 0 }, allowWhileIdle: true } }));
        if (nots.length) await LN.schedule({ notifications: nots });
      } catch (err) { console.error('recordatorios', err); recFirma = ''; }
    }, 1500);
  }

  // Botón atrás de Android
  const AppP = plugin('App');
  if (AppP) AppP.addListener('backButton', () => {
    if (!sheet.hidden) cerrar();
    else if (S.tab !== 'inicio') { S.tab = 'inicio'; render(); }
    else AppP.exitApp();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) cerrar(); });

  Store.iniciar();
})();
