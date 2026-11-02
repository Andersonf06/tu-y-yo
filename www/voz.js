/* Entiende frases habladas en español colombiano: "gasté 45 mil en mercado, pagó Camila, entre los dos" */
(function (global) {
  'use strict';

  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/(?<!\d),|,(?!\d)/g, ' ').replace(/[¿?¡!;:"“”()]/g, ' ').replace(/\.(?!\d)/g, ' ').replace(/\s+/g, ' ').trim();

  const UNIDADES = { cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
    diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
    veinte: 20, veintiun: 21, veintiuno: 21, veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25,
    veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60,
    setenta: 70, ochenta: 80, noventa: 90, cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300,
    cuatrocientos: 400, cuatrocientas: 400, quinientos: 500, quinientas: 500, seiscientos: 600, seiscientas: 600, setecientos: 700,
    setecientas: 700, ochocientos: 800, ochocientas: 800, novecientos: 900, novecientas: 900 };
  const MIL = new Set(['mil', 'lucas', 'luca', 'barras', 'barra', 'k']);
  const MILLON = new Set(['millon', 'millones', 'palo', 'palos', 'melon', 'melones']);

  function esNumero(t) { return /^\d/.test(t) || t in UNIDADES || MIL.has(t) || MILLON.has(t); }

  /* Devuelve las cantidades encontradas: [{valor, ini, fin}] (índices de token) */
  function cantidades(tokens) {
    const out = [];
    let i = 0;
    while (i < tokens.length) {
      if (!(/^\d/.test(tokens[i]) || tokens[i] in UNIDADES) || (tokens[i] === 'una' && !esNumero(tokens[i + 1] || ''))
        || (tokens[i] === 'un' && !esNumero(tokens[i + 1] || ''))) { i++; continue; }
      const ini = i; let total = 0, actual = 0, hubo = false;
      while (i < tokens.length) {
        const t = tokens[i], sig = tokens[i + 1] || '';
        if (/^\d/.test(t)) {
          if (/^\d{1,3}(?:[.,]\d{3}){2,}$/.test(t)) { actual += Number(t.replace(/[.,]/g, '')); hubo = true; i++; continue; }
          const m = t.match(/^(\d+)(?:[.,](\d+))?(k)?$/);
          if (!m) break;
          let v;
          if (m[2] && (MIL.has(sig) || MILLON.has(sig)) && m[2].length <= 2) v = Number(m[1] + '.' + m[2]);
          else if (m[2] && m[2].length === 3) v = Number(t.replace(/[.,]/g, '').replace(/k$/, ''));
          else v = Number(m[1]);
          actual += v; hubo = true;
          if (m[3]) { actual *= 1000; }
        } else if (t in UNIDADES) { actual += UNIDADES[t]; hubo = true; }
        else if (MIL.has(t)) { if (!hubo && t !== 'mil') break; actual = (actual || 1) * 1000; hubo = true; }
        else if (MILLON.has(t)) { total += (actual || 1) * 1e6; actual = 0; hubo = true;
          if (sig === 'y' && tokens[i + 2] === 'medio') { total += 5e5; i += 2; } }
        else if (t === 'y' && hubo && (sig in UNIDADES || /^\d/.test(sig))) { /* "cuarenta y cinco" */ }
        else if (t === 'y' && hubo && sig === 'medio' && actual >= 1000) { actual += 500; i++; }
        else break;
        i++;
      }
      const valor = Math.round(total + actual);
      if (hubo && valor > 0) out.push({ valor, ini, fin: i });
      if (i === ini) i++;
    }
    return out;
  }

  const CATEGORIAS = [
    ['deudas', /\b(cuota|tarjeta de credito|abono a la tarjeta|credito|prestamo|deuda)\b/],
    ['mercado', /\b(mercado|supermercado|exito|carulla|jumbo|olimpica|d1|ara|isimo|tienda|verduras|fruta|frutas|carne|pollo|leche|huevos|pan|plaza|surtido|viveres)\b/],
    ['comida', /\b(almuerzo|almorzamos|desayuno|cena|cenamos|comida|comimos|domicilio|domicilios|rappi|restaurante|pizza|hamburguesa|empanadas|perro caliente|sushi|cafe|tinto|helado|onces|postre|corrientazo|ifood)\b/],
    ['transporte', /\b(taxi|uber|didi|cabify|indriver|bus|buseta|transmilenio|metro|sitp|gasolina|tanqueada|tanquear|peaje|parqueadero|parqueo|pasaje|pasajes|moto|carro|lavada|mecanico|soat)\b/],
    ['hogar', /\b(arriendo|alquiler|administracion|luz|agua|gas|energia|servicios|internet|wifi|celular|plan de datos|recarga|aseo|detergente|muebles|casa|epm|codensa|enel|vanti|claro|movistar|tigo)\b/],
    ['diversion', /\b(cine|pelicula|fiesta|rumba|bar|cerveza|cervezas|trago|tragos|concierto|paseo|plan|salida|parque|teatro|bolos|juego|videojuego|netflix|spotify|disney|karaoke|discoteca|viaje|hotel|piscina)\b/],
    ['salud', /\b(drogueria|farmacia|medicina|medicamento|medicamentos|pastillas|medico|doctor|cita|odontologo|dentista|examen|examenes|laboratorio|eps|gafas|optica|terapia)\b/],
    ['ropa', /\b(ropa|camisa|camiseta|pantalon|jean|zapatos|tenis|vestido|chaqueta|peluqueria|barberia|corte de pelo|unas|manicure|maquillaje|crema|perfume)\b/],
    ['mascotas', /\b(perro|perrita|perrito|gato|gata|gatito|mascota|veterinario|veterinaria|concentrado|cuido|arena)\b/],
    ['educacion', /\b(colegio|universidad|semestre|matricula|curso|clase|clases|libro|libros|cuaderno|utiles|pension)\b/],
    ['regalos', /\b(regalo|regalos|cumpleanos|detalle|flores|sorpresa|aniversario)\b/]
  ];
  const INGRESO = /\b(me pagaron|nos pagaron|recibi|recibimos|me llego|nos llego|me consignaron|ingreso|ingresaron|vendi|vendimos|cobre|me gane|prima|sueldo|salario|quincena)\b/;
  const RELLENO = new Set(['gaste', 'gastamos', 'gasto', 'pague', 'pagamos', 'pago', 'pagaste', 'compre', 'compramos', 'compro', 'costo', 'valio',
    'pesos', 'peso', 'en', 'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'por', 'para', 'con', 'lo', 'le', 'me', 'nos', 'yo',
    'hoy', 'ayer', 'antier', 'anteayer', 'antes', 'fue', 'fueron', 'que', 'y', 'a', 'al', 'mi', 'mis', 'su', 'sus', 'se', 'entre', 'dos', 'ambos',
    'compartido', 'compartida', 'medias', 'mio', 'mia', 'personal', 'solo', 'sola', 'tarjeta', 'efectivo', 'nequi', 'daviplata', 'registra', 'anota',
    'agrega', 'ponle', 'pon', 'gastos', 'gaste', 'como', 'unos', 'mas', 'menos', 'o', 'sea', 'eh', 'este', 'esta', 'bueno', 'listo', 'casi',
    'recibi', 'recibimos', 'pagaron', 'llego', 'consignaron', 'ingreso', 'vendi', 'vendimos', 'cobre', 'gane']);

  /**
   * frase: texto dictado. nombres: {a:'Andrés', b:'Camila'}. yo: 'a'|'b'. hoy: 'AAAA-MM-DD'.
   * Devuelve {tipo:'gasto'|'ingreso', monto, desc, categoria, pagadoPor, de, fecha, quien}
   */
  function interpretar(frase, nombres, yo, hoy) {
    const txt = norm(frase).replace(/\$\s?/g, '').replace(/(\d)\s?k\b/g, '$1 mil');
    const tokens = txt.split(' ').filter(Boolean);
    const cs = cantidades(tokens);
    const mejor = cs.filter(c => c.valor >= 100).sort((a, b) => b.valor - a.valor)[0] || cs.sort((a, b) => b.valor - a.valor)[0] || null;
    const otro = yo === 'a' ? 'b' : 'a';
    const nA = norm(nombres?.a).split(' ')[0], nB = norm(nombres?.b).split(' ')[0];
    const quienEs = w => (nA && w === nA) ? 'a' : (nB && w === nB) ? 'b' : null;

    // ¿Quién pagó?
    let pagadoPor = yo;
    const mPago = [txt.match(/\b(?:pago|pagaste|lo pago|la pago|puso|invito)\s+(\w+)/), txt.match(/\b(\w+)\s+(?:pago|lo pago|la pago|puso|invito)\b/)]
      .map(m => m && quienEs(m[1])).find(Boolean);
    if (mPago) pagadoPor = mPago;
    else if (/\b(pago ella|pago el|lo pago ella|lo pago el|pagaste|lo pagaste|tu pagaste|pago mi (novia|novio|esposa|esposo|pareja|amor))\b/.test(txt)) pagadoPor = otro;
    else if (/\b(pague|lo pague|yo pague|pague yo)\b/.test(txt)) pagadoPor = yo;

    // ¿De quién es?
    let de = 'compartido';
    if (/\b(para mi|mio|mia|personal|solo mio|solo mia|mi gusto|un gusto mio|para yo)\b/.test(txt)) de = yo;
    else {
      const mDe = txt.match(/\b(?:para|de)\s+(\w+)\b/g) || [];
      for (const x of mDe) { const w = x.split(' ')[1]; if (quienEs(w)) { de = quienEs(w); break; } }
      if (/\b(para ella|para el$|tuyo|tuya|para ti)\b/.test(txt)) de = otro;
    }
    if (/\b(compartido|compartida|entre los dos|de los dos|para los dos|a medias|mitad y mitad|para la casa|del hogar|de la casa)\b/.test(txt)) de = 'compartido';

    // Fecha
    let fecha = hoy;
    const dias = /\b(antier|anteayer|antes de ayer|antesdeayer)\b/.test(txt) ? 2 : /\bayer\b/.test(txt) ? 1 : 0;
    if (dias && hoy) { const d = new Date(hoy + 'T12:00:00'); d.setDate(d.getDate() - dias); fecha = d.toISOString().slice(0, 10); }

    // Categoría
    let categoria = 'otros';
    for (const [c, re] of CATEGORIAS) if (re.test(txt)) { categoria = c; break; }

    // Descripción: palabras con significado, sin cantidades, nombres ni relleno
    const fuera = new Set(); if (mejor) for (let i = mejor.ini; i < mejor.fin; i++) fuera.add(i);
    for (const c of cs) for (let i = c.ini; i < c.fin; i++) fuera.add(i);
    const palabras = tokens.filter((w, i) => !fuera.has(i) && !RELLENO.has(w) && !quienEs(w) && !/^\d/.test(w) && w.length > 1
      && !['ella', 'el', 'ti', 'tu', 'novia', 'novio', 'esposa', 'esposo', 'pareja', 'amor', 'casa', 'hogar', 'mitad', 'puso', 'invito'].includes(w));
    let desc = palabras.slice(0, 5).join(' ');
    desc = desc ? desc.charAt(0).toUpperCase() + desc.slice(1) : '';

    const esIngreso = INGRESO.test(txt) && !/\b(gaste|pague|compre|gastamos|pagamos|compramos)\b/.test(txt);
    let quien = yo;
    for (const w of tokens) if (quienEs(w)) { quien = quienEs(w); break; }
    if (/\b(me pagaron|recibi|me llego|me consignaron|vendi|cobre|me gane)\b/.test(txt)) quien = yo;

    return { tipo: esIngreso ? 'ingreso' : 'gasto', monto: mejor ? mejor.valor : 0, desc, categoria, pagadoPor, de, fecha, quien };
  }

  global.VOZ = { interpretar, cantidades: t => cantidades(norm(t).split(' ')), norm };
  if (typeof module !== 'undefined') module.exports = global.VOZ;
})(typeof window !== 'undefined' ? window : globalThis);
