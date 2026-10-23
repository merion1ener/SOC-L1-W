(function () {
  'use strict';

  var CURSO = window.CURSO || { meses: [] };
  var app = document.getElementById('app');
  var PREFIX = 'soc1:';

  /* ---------- almacenamiento (localStorage con respaldo en memoria) ---------- */
  var mem = {};
  var store = {
    get: function (k, def) {
      try {
        var v = localStorage.getItem(PREFIX + k);
        return v ? JSON.parse(v) : def;
      } catch (e) {
        return mem.hasOwnProperty(k) ? mem[k] : def;
      }
    },
    set: function (k, v) {
      mem[k] = v;
      try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) {}
    },
    del: function (k) {
      delete mem[k];
      try { localStorage.removeItem(PREFIX + k); } catch (e) {}
    }
  };

  /* ---------- utilidades ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function dayId(m, w, d) { return m + '-' + w + '-' + d; }
  function getMes(n) { return CURSO.meses.filter(function (x) { return x.n === n; })[0]; }
  function getSemana(mes, n) { return mes && mes.semanas.filter(function (x) { return x.n === n; })[0]; }
  function getDia(sem, n) { return sem && sem.dias.filter(function (x) { return x.n === n; })[0]; }
  function quizState(id) { return store.get('quiz:' + id, { a: {}, sent: false, score: null }); }
  function isDone(id) { return !!store.get('done:' + id, false); }

  function diaBadges(id, dia) {
    var b = [];
    if (isDone(id)) b.push('<span class="badge ok">✔ Completado</span>');
    if (dia.quiz && dia.quiz.preguntas.length) {
      var st = quizState(id);
      if (st.sent && st.score && st.score.total) {
        b.push('<span class="badge ok">Examen ' + st.score.ok + '/' + st.score.total + '</span>');
      } else if (st.sent) {
        b.push('<span class="badge ok">Examen enviado</span>');
      } else {
        b.push('<span class="badge">Con examen</span>');
      }
    } else {
      b.push('<span class="badge gray">Sin examen aún</span>');
    }
    if (dia.teoriaCompleta) b.push('<span class="badge">Teoría completa</span>');
    return b.join('');
  }

  function progresoSemana(m, sem) {
    var total = sem.dias.length, hechos = 0;
    sem.dias.forEach(function (d) { if (isDone(dayId(m, sem.n, d.n))) hechos++; });
    return { hechos: hechos, total: total };
  }
  function progresoMes(mes) {
    var total = 0, hechos = 0;
    mes.semanas.forEach(function (s) {
      var p = progresoSemana(mes.n, s);
      total += p.total; hechos += p.hechos;
    });
    return { hechos: hechos, total: total };
  }
  function barra(p) {
    var pct = p.total ? Math.round(100 * p.hechos / p.total) : 0;
    return '<div class="bar" title="' + pct + '%"><i style="width:' + pct + '%"></i></div>' +
      '<div class="desc" style="font-size:.82rem">' + p.hechos + ' de ' + p.total + ' días completados</div>';
  }

  /* ---------- vistas ---------- */
  function vistaInicio() {
    var h = '<h1>Tu ruta hacia SOC Analyst L1</h1>' +
      '<p class="lead">Elige un mes. Dentro de cada mes entras a una semana y luego a un día, con su teoría, su práctica y su examen.</p>' +
      '<div class="grid">';
    CURSO.meses.forEach(function (mes) {
      if (mes.activo) {
        h += '<a class="card" href="#/mes/' + mes.n + '">' +
          '<span class="kicker">Mes ' + mes.n + '</span>' +
          '<span class="title">' + esc(mes.t) + '</span>' +
          '<span class="desc">' + esc(mes.d) + '</span>' +
          barra(progresoMes(mes)) +
          '<span class="meta"><span class="badge">' + mes.semanas.length + ' semanas</span></span></a>';
      } else {
        h += '<div class="card off">' +
          '<span class="kicker">Mes ' + mes.n + '</span>' +
          '<span class="title">' + esc(mes.t) + '</span>' +
          '<span class="desc">' + esc(mes.d) + '</span>' +
          '<span class="meta"><span class="badge gray">Próximamente</span></span></div>';
      }
    });
    h += '</div>';
    app.innerHTML = h;
  }

  function vistaMes(n) {
    var mes = getMes(n);
    if (!mes || !mes.activo) return vista404();
    var h = '<div class="crumbs"><a href="#/">Inicio</a> › Mes ' + mes.n + '</div>' +
      '<h1>Mes ' + mes.n + ': ' + esc(mes.t) + '</h1>' +
      '<p class="lead">' + esc(mes.d) + '</p><div class="grid">';
    mes.semanas.forEach(function (s) {
      h += '<a class="card" href="#/mes/' + mes.n + '/semana/' + s.n + '">' +
        '<span class="kicker">Semana ' + s.n + '</span>' +
        '<span class="title">' + esc(s.t) + '</span>' +
        '<span class="desc">' + esc(s.d) + '</span>' +
        barra(progresoSemana(mes.n, s)) + '</a>';
    });
    h += '</div>';
    app.innerHTML = h;
  }

  function vistaSemana(m, n) {
    var mes = getMes(m), sem = getSemana(mes, n);
    if (!sem) return vista404();
    var h = '<div class="crumbs"><a href="#/">Inicio</a> › <a href="#/mes/' + m + '">Mes ' + m +
      '</a> › Semana ' + n + '</div>' +
      '<h1>Semana ' + n + ': ' + esc(sem.t) + '</h1>' +
      '<p class="lead">' + esc(sem.d) + '</p><div class="grid">';
    sem.dias.forEach(function (d) {
      var id = dayId(m, n, d.n);
      h += '<a class="card" href="#/mes/' + m + '/semana/' + n + '/dia/' + d.n + '">' +
        '<span class="kicker">Día ' + d.n + ' · ' + esc(d.nombre) + '</span>' +
        '<span class="title">' + esc(d.t) + '</span>' +
        '<span class="desc">' + esc(d.d) + '</span>' +
        '<span class="meta">' + diaBadges(id, d) + '</span></a>';
    });
    h += '</div><p class="lead" style="margin-top:18px">Domingo: descanso o 30-60 min de flashcards (puertos, capas, handshake, Event IDs).</p>';
    app.innerHTML = h;
  }

  function resultadoHtml(dia, st) {
    if (!st.sent) return '';
    var q = dia.quiz.preguntas;
    var abiertas = q.filter(function (x) { return x.t === 'open'; }).length;
    var cls = 'result', msg;
    if (st.score && st.score.total) {
      var pct = st.score.ok / st.score.total;
      cls += pct >= 0.85 ? ' good' : (pct >= 0.6 ? ' mid' : '');
      msg = '<strong>Opción múltiple: ' + st.score.ok + ' de ' + st.score.total + ' correctas.</strong>';
    } else {
      msg = '<strong>Examen enviado.</strong>';
    }
    if (abiertas) {
      msg += '<br>Preguntas abiertas: compara tu respuesta con la de referencia en cada una. ' +
        'Si te quedaste en blanco en 2 o más, repite el ejercicio mañana antes de seguir.';
    }
    return '<div class="' + cls + '" id="resultado">' + msg +
      '<div class="row"><button class="btn sec" data-go="examen">Ver mis respuestas</button>' +
      '<button class="btn sec" data-act="reintentar">Reintentar examen</button></div></div>';
  }

  function examenHtml(id, dia) {
    var qz = dia.quiz;
    if (!qz || !qz.preguntas.length) {
      return '<div class="aviso">Este día todavía no tiene examen. Pídeselo a Claude (por ejemplo: «hazme un examen del día ' +
        dia.n + ' de la semana») y agrégalo en <code>content/quizzes.json</code> con la clave de este día.</div>';
    }
    var st = quizState(id);
    var h = '<h2>' + esc(qz.titulo || 'Examen') + '</h2>';
    if (qz.intro) h += '<p class="lead">' + esc(qz.intro) + '</p>';
    qz.preguntas.forEach(function (p, i) {
      var key = 'q' + i;
      var ans = st.a[key];
      h += '<div class="q"><div class="qn">Pregunta ' + (i + 1) + ' de ' + qz.preguntas.length +
        (p.t === 'open' ? ' · respuesta abierta' : ' · opción múltiple') + '</div>' +
        '<div class="qt">' + esc(p.q) + '</div>';
      if (p.t === 'mc') {
        p.o.forEach(function (o, j) {
          var cls = 'opt', chk = (ans === j) ? ' checked' : '';
          if (st.sent) {
            cls += ' locked';
            if (j === p.c) cls += ' right';
            else if (ans === j) cls += ' wrong';
          }
          h += '<label class="' + cls + '"><input type="radio" name="' + key + '" value="' + j + '"' + chk +
            (st.sent ? ' disabled' : '') + '><span>' + esc(o) + '</span></label>';
        });
        if (st.sent) {
          var tu = (ans === undefined) ? 'Sin responder' : p.o[ans];
          var ok = ans === p.c;
          h += '<div class="fb"><strong style="color:var(--' + (ok ? 'ok' : 'bad') + ')">' +
            (ok ? '✔ Correcta' : '✘ Incorrecta') + '</strong>' +
            (ok ? '' : '<br><span class="lbl">Tu respuesta</span>' + esc(tu) +
              '<br><span class="lbl" style="margin-top:6px">Respuesta correcta</span>' + esc(p.o[p.c])) +
            (p.w ? '<div class="ref"><span class="lbl">Por qué</span>' + esc(p.w) + '</div>' : '') + '</div>';
        }
      } else {
        h += '<textarea data-key="' + key + '" placeholder="Escribe con tus palabras, sin mirar tus notas..."' +
          (st.sent ? ' readonly' : '') + '>' + esc(ans || '') + '</textarea>';
        if (st.sent) {
          h += '<div class="fb"><span class="lbl">Tu respuesta</span><div class="yours">' +
            (ans && String(ans).trim() ? esc(ans) : '(en blanco)') + '</div>' +
            '<div class="ref"><span class="lbl">Respuesta de referencia</span>' + esc(p.m) + '</div></div>';
        }
      }
      h += '</div>';
    });
    if (st.sent) {
      h += '<div class="row"><button class="btn sec" data-act="reintentar">Reintentar examen</button></div>';
    } else {
      h += '<div class="row"><button class="btn" data-act="responder">Responder</button>' +
        '<span class="lead" style="margin:0;font-size:.88rem">Tu borrador se guarda solo. Al responder volverás al inicio de la página con tu resultado.</span></div>';
    }
    return h;
  }

  function theaBloque(key, titulo, ayuda, texto) {
    if (!texto) return '';
    return '<div class="thea-box"><h3>' + titulo + '</h3><p class="muted">' + ayuda + '</p>' +
      '<textarea class="thea-txt" id="thea-' + key + '" readonly rows="10">' + esc(texto) + '</textarea>' +
      '<div class="thea-btns"><button class="btn" data-copy="thea-' + key + '">📋 Copiar</button>' +
      '<button class="btn sec" data-dl="thea-' + key + '">⬇️ Descargar .txt</button>' +
      '<span class="copied" id="copied-' + key + '" aria-live="polite"></span></div></div>';
  }

  function theaHtml(dia) {
    var t = dia.thea;
    return '<section class="panel" id="thea"><h2>🤖 Thea</h2>' +
      '<p>Contenido listo para pasar a <strong>Thea</strong>. Copia el texto y pégalo (o descárgalo como .txt y súbelo como nota/archivo) en el curso de este tema. Orden sugerido: 1) resumen, 2) instrucción.</p>' +
      theaBloque('resumen', '1 · Resumen para estudiar', 'Conceptos clave, datos a memorizar y preguntas con respuesta. Es lo más compacto y eficiente.', t.resumen) +
      theaBloque('instr', '2 · Qué pedirle a Thea', 'Pégalo después de subir el material.', t.instruccion) +
      theaBloque('notas', '3 · Notas completas (opcional)', 'La teoría completa del día, por si quieres que Thea tenga todo el detalle.', t.notas) +
      '</section>';
  }

  function copiar(texto, done) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = texto; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); done(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(function () { done(true); }, fallback);
    } else fallback();
  }

  function descargar(nombre, texto) {
    var blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click();
    document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function vistaDia(m, w, d) {
    var mes = getMes(m), sem = getSemana(mes, w), dia = getDia(sem, d);
    if (!dia) return vista404();
    var id = dayId(m, w, d);
    var st = dia.quiz ? quizState(id) : { sent: false };

    var h = '<div class="crumbs"><a href="#/">Inicio</a> › <a href="#/mes/' + m + '">Mes ' + m +
      '</a> › <a href="#/mes/' + m + '/semana/' + w + '">Semana ' + w + '</a> › Día ' + d + '</div>' +
      '<h1>Semana ' + w + ' · Día ' + d + ' (' + esc(dia.nombre) + '): ' + esc(dia.t) + '</h1>' +
      '<p class="lead">' + esc(dia.d) + '</p>' +
      '<label class="done-toggle"><input type="checkbox" id="done"' + (isDone(id) ? ' checked' : '') +
      '> Marcar este día como completado</label>';

    if (dia.quiz) h += resultadoHtml(dia, st);

    h += '<div class="pills">' +
      '<button class="pill" data-go="teoria">📖 Teoría</button>' +
      '<button class="pill" data-go="practica">🛠️ Práctica</button>' +
      '<button class="pill" data-go="examen">📝 Examen</button>' +
      (dia.thea ? '<button class="pill" data-go="thea">🤖 Thea</button>' : '') + '</div>';

    h += '<section class="panel" id="teoria"><h2>📖 Teoría</h2>' + dia.teoria + '</section>' +
      '<section class="panel" id="practica"><h2>🛠️ Práctica</h2>' + dia.practica + '</section>' +
      '<section class="panel" id="examen">' + examenHtml(id, dia) + '</section>';
    if (dia.thea) h += theaHtml(dia);

    // navegación día anterior / siguiente
    var prev = null, next = null, idx = sem.dias.indexOf(dia);
    if (idx > 0) prev = { w: w, d: sem.dias[idx - 1].n };
    else if (w > 1) { var ps = getSemana(mes, w - 1); if (ps) prev = { w: w - 1, d: ps.dias[ps.dias.length - 1].n }; }
    if (idx < sem.dias.length - 1) next = { w: w, d: sem.dias[idx + 1].n };
    else { var ns = getSemana(mes, w + 1); if (ns) next = { w: w + 1, d: ns.dias[0].n }; }
    h += '<div class="nav-days">' +
      (prev ? '<a class="btn sec" style="text-decoration:none" href="#/mes/' + m + '/semana/' + prev.w + '/dia/' + prev.d + '">← Día anterior</a>' : '<span></span>') +
      (next ? '<a class="btn sec" style="text-decoration:none" href="#/mes/' + m + '/semana/' + next.w + '/dia/' + next.d + '">Día siguiente →</a>' : '<span></span>') +
      '</div>';

    app.innerHTML = h;
    bindDia(id, dia);
  }

  function bindDia(id, dia) {
    var chk = document.getElementById('done');
    if (chk) chk.addEventListener('change', function () { store.set('done:' + id, chk.checked); });

    app.querySelectorAll('[data-go]').forEach(function (b) {
      b.addEventListener('click', function () {
        var el = document.getElementById(b.getAttribute('data-go'));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    app.querySelectorAll('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-copy'), ta = document.getElementById(k);
        copiar(ta.value, function (ok) {
          var el = document.getElementById('copied-' + k.replace('thea-', ''));
          if (el) { el.textContent = ok ? '✅ Copiado' : 'No se pudo copiar: selecciona el texto manualmente'; }
        });
      });
    });
    app.querySelectorAll('[data-dl]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-dl');
        descargar('thea-' + id + '-' + k.replace('thea-', '') + '.txt', document.getElementById(k).value);
      });
    });

    if (!dia.quiz) return;
    var st = quizState(id);

    if (!st.sent) {
      app.querySelectorAll('#examen input[type=radio]').forEach(function (r) {
        r.addEventListener('change', function () {
          var cur = quizState(id);
          cur.a[r.name] = parseInt(r.value, 10);
          store.set('quiz:' + id, cur);
        });
      });
      app.querySelectorAll('#examen textarea').forEach(function (t) {
        t.addEventListener('input', function () {
          var cur = quizState(id);
          cur.a[t.getAttribute('data-key')] = t.value;
          store.set('quiz:' + id, cur);
        });
      });
    }

    app.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.getAttribute('data-act');
        if (act === 'responder') enviar(id, dia);
        if (act === 'reintentar') reintentar(id);
      });
    });
  }

  function enviar(id, dia) {
    var cur = quizState(id);
    var mcs = dia.quiz.preguntas.map(function (p, i) { return { p: p, i: i }; })
      .filter(function (x) { return x.p.t === 'mc'; });
    var sinResp = mcs.filter(function (x) { return cur.a['q' + x.i] === undefined; }).length;
    if (sinResp && !confirm('Tienes ' + sinResp + ' pregunta(s) de opción múltiple sin responder. ¿Enviar de todos modos?')) return;
    var ok = 0;
    mcs.forEach(function (x) { if (cur.a['q' + x.i] === x.p.c) ok++; });
    cur.sent = true;
    cur.score = { ok: ok, total: mcs.length };
    store.set('quiz:' + id, cur);
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function reintentar(id) {
    if (!confirm('Se borrarán tus respuestas y el resultado de este examen. ¿Reintentar?')) return;
    store.del('quiz:' + id);
    render();
    var ex = document.getElementById('examen');
    if (ex) ex.scrollIntoView({ block: 'start' });
  }

  function vista404() {
    app.innerHTML = '<h1>No encontrado</h1><p class="lead">Esa página no existe o todavía no está disponible.</p>' +
      '<a class="btn" style="text-decoration:none" href="#/">Volver al inicio</a>';
  }

  /* ---------- enrutador ---------- */
  function render() {
    var p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    var n = function (i) { return parseInt(p[i], 10); };
    if (p.length === 0) vistaInicio();
    else if (p[0] === 'mes' && p.length === 2) vistaMes(n(1));
    else if (p[0] === 'mes' && p[2] === 'semana' && p.length === 4) vistaSemana(n(1), n(3));
    else if (p[0] === 'mes' && p[2] === 'semana' && p[4] === 'dia' && p.length === 6) vistaDia(n(1), n(3), n(5));
    else vista404();
  }

  var lastHash = null;
  window.addEventListener('hashchange', function () {
    render();
    if (location.hash !== lastHash) window.scrollTo(0, 0);
    lastHash = location.hash;
  });
  lastHash = location.hash;
  render();
})();
