/* Lectura de facturas en el celular: OCR con Tesseract + interpretación de facturas colombianas */
(function (global) {
  'use strict';

  const CATS_CLAVE = [
    ['mercado', /(exito|éxito|carulla|jumbo|olimpica|olímpica|\bd1\b|\bara\b|isimo|ísimo|makro|metro|supermercado|mercado|euro|colsubsidio|surtimax|pricesmart|alkosto|tienda)/],
    ['comida', /(restaurante|rappi|pizza|burger|hamburgues|crepes|frisby|kfc|mcdonald|el corral|subway|juan valdez|tostao|panader|cafeter|asadero|sushi|wok|ifood|domicilio)/],
    ['diversion', /(cine|cinecolombia|cinemark|procinal|teatro|bar\b|discoteca|bolera|parque|entrada|boleta|tuboleta|spotify|netflix|museo|concierto|karaoke|gamer)/],
    ['salud', /(drogu|farmac|cruz verde|farmatodo|locatel|cafam|clinica|clínica|odonto|laboratorio|optica|óptica)/],
    ['transporte', /(terpel|esso|primax|texaco|biomax|gasolina|combustible|uber|didi|cabify|peaje|parqueadero|transmilenio|metro de|taxi|mobil)/],
    ['hogar', /(homecenter|easy|ferreter|epm|codensa|enel|vanti|acueducto|claro|movistar|tigo|etb|internet|arriendo|administracion|administración)/],
    ['ropa', /(falabella|zara|h&m|arturo calle|studio f|koaj|tennis|adidas|nike|ropa|calzado|peluquer|barber|spa)/],
    ['mascotas', /(veterin|mascota|pet|laika|agrocampo)/],
    ['educacion', /(libreria|librería|panamericana|universidad|colegio|curso|matricula|matrícula)/],
  ];
  const NO_ITEM = /(sub\s*total|total|iva|impuesto|cambio|efectivo|tarjeta|nit|factura|resoluci|redondeo|propina|descuento|saldo|pago|recibido|devuelta|vuelto|base|consumo|ico|tel[eé]fono|direcci)/i;

  function normalizar(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /* "12.500" -> 12500, "$ 1.234.567,00" -> 1234567, "45,900" -> 45900, "8.50" -> 9 */
  function parseValor(raw) {
    let s = String(raw).replace(/[\s$]/g, '').replace(/[oO](?=\d)|(?<=\d)[oO]/g, '0');
    if (!/\d/.test(s)) return null;
    const m = s.match(/^(\d{1,3}(?:[.,]\d{3})+|\d+)(?:([.,])(\d{1,2}))?$/);
    if (!m) return null;
    const entero = Number(m[1].replace(/[.,]/g, ''));
    const dec = m[3] ? Number(m[3]) / Math.pow(10, m[3].length) : 0;
    return Math.round(entero + dec);
  }

  function valoresEnLinea(linea) {
    const out = [];
    const re = /\$?\s?\d{1,3}(?:[.,]\s?\d{3})+(?:[.,]\d{2})?|\$?\s?\d{3,9}(?:[.,]\d{2})?/g;
    let m;
    while ((m = re.exec(linea))) {
      const v = parseValor(m[0].replace(/\s/g, ''));
      if (v != null && v >= 50) out.push(v);
    }
    return out;
  }

  function buscarFecha(texto) {
    let m = texto.match(/\b(20\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/);
    if (m) return valida(+m[1], +m[2], +m[3]);
    m = texto.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
    if (m) {
      let y = +m[3]; if (y < 100) y += 2000;
      return valida(y, +m[2], +m[1]);
    }
    const meses = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12 };
    m = normalizar(texto).match(/\b(\d{1,2})\s*(?:de\s*)?(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\.?\s*(?:de\s*)?(20\d{2})/);
    if (m) return valida(+m[3], meses[m[2]], +m[1]);
    return null;
    function valida(y, mo, d) {
      if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 2015 || y > 2100) return null;
      return y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    }
  }

  function interpretar(texto) {
    const lineas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const norm = normalizar(texto);

    // Total: línea con "total" (no subtotal) → mayor valor; si no, el mayor valor del documento
    let total = null;
    const prioridad = [/total\s*a\s*pagar/, /valor\s*total/, /total\s*factura/, /\btotal\b/, /neto/, /pagar/];
    for (const re of prioridad) {
      for (let i = 0; i < lineas.length && total == null; i++) {
        const ln = normalizar(lineas[i]);
        if (re.test(ln) && !/sub\s*total|total\s*items|total\s*art/.test(ln)) {
          let vals = valoresEnLinea(lineas[i]);
          if (!vals.length && lineas[i + 1]) vals = valoresEnLinea(lineas[i + 1]);
          if (vals.length) total = Math.max(...vals);
        }
      }
      if (total != null) break;
    }
    const todos = lineas.flatMap(valoresEnLinea).filter(v => v < 100000000);
    if (total == null && todos.length) total = Math.max(...todos);

    // Comercio: primera línea con letras que no sea NIT/dirección
    let comercio = '';
    for (const l of lineas.slice(0, 8)) {
      const n = normalizar(l);
      if (/[a-z]{3,}/.test(n) && !/(nit|calle|cra|carrera|av\b|avenida|tel|regimen|régimen|factura|www|resol)/.test(n)) {
        comercio = l.replace(/[^\p{L}\p{N}&.' -]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 40);
        if (comercio.length >= 3) break;
      }
    }

    // Ítems: texto + valor al final
    const items = [];
    for (const l of lineas) {
      if (NO_ITEM.test(normalizar(l))) continue;
      const m = l.match(/^(.*?[A-Za-zÁÉÍÓÚÑáéíóúñ]{3,}.*?)\s+\$?\s?(\d{1,3}(?:[.,]\d{3})+|\d{3,7})(?:[.,]\d{2})?\s*[A-Z]?$/);
      if (m) {
        const v = parseValor(m[2]);
        const d = m[1].replace(/^\d+\s*(x|un|und)?\s*/i, '').replace(/\s+/g, ' ').trim();
        if (v && v >= 50 && (!total || v <= total) && d.length >= 3) items.push({ descripcion: d.slice(0, 40), valor: v });
      }
      if (items.length >= 40) break;
    }

    let categoria = 'otros';
    for (const [cat, re] of CATS_CLAVE) if (re.test(norm)) { categoria = cat; break; }

    return { comercio, fecha: buscarFecha(texto), total, categoria, items };
  }

  async function prepararImagen(src) {
    const img = await new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
    });
    const max = 1800;
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const d = ctx.getImageData(0, 0, c.width, c.height); const p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      let g = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
      g = Math.max(0, Math.min(255, (g - 128) * 1.45 + 140));
      p[i] = p[i + 1] = p[i + 2] = g;
    }
    ctx.putImageData(d, 0, 0);
    return c;
  }

  let workerP = null, progresoCb = null;
  async function leerFactura(src, onProgreso) {
    if (!global.Tesseract) throw new Error('sin_ocr');
    progresoCb = onProgreso;
    const lienzo = await prepararImagen(src);
    if (!workerP) {
      workerP = global.Tesseract.createWorker('spa', 1, {
        workerPath: 'vendor/worker.min.js',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1',
        logger: m => { if (m.status === 'recognizing text' && progresoCb) progresoCb(m.progress); }
      });
      workerP.catch(() => { workerP = null; });
    }
    const worker = await workerP;
    const { data } = await worker.recognize(lienzo);
    return interpretar(data.text || '');
  }

  global.OCR = { interpretar, parseValor, buscarFecha, leerFactura };
  if (typeof module !== 'undefined') module.exports = global.OCR;
})(typeof window !== 'undefined' ? window : globalThis);
