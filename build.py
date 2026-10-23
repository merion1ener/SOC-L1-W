#!/usr/bin/env python3
"""Genera data/curso.js a partir de content/.

Uso:  python3 build.py
Requiere:  pip install markdown

Contenido:
  content/estructura.json     meses, semanas y días (títulos y descripciones breves)
  content/dias-*.md           teoría y práctica detalladas por día
  content/quizzes.json        exámenes por día (clave "mes-semana-dia", por ejemplo "1-2-3")
"""
import glob
import json
import os
import re
import sys

try:
    import markdown
except ImportError:
    sys.exit("Falta la librería markdown. Instálala con:  pip install markdown")

BASE = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(BASE, "content")


def md(text):
    html = markdown.markdown(text, extensions=["tables", "fenced_code", "sane_lists"])
    html = html.replace("<table>", '<div class="tbl"><table>').replace("</table>", "</table></div>")
    return html


def leer_dias():
    """Lee content/dias-*.md. Formato:
    === 1-1-3 ===
    @@teoria
    ...markdown...
    @@practica
    ...markdown...
    """
    dias = {}
    for ruta in sorted(glob.glob(os.path.join(CONTENT, "dias-*.md"))):
        with open(ruta, encoding="utf-8") as f:
            texto = f.read()
        bloques = re.split(r"^=== (\d+-\d+-\d+) ===\s*$", texto, flags=re.M)
        for i in range(1, len(bloques), 2):
            clave, cuerpo = bloques[i], bloques[i + 1]
            partes = re.split(r"^@@(teoria|practica)\s*$", cuerpo, flags=re.M)
            d = {}
            for j in range(1, len(partes), 2):
                d[partes[j]] = partes[j + 1].strip()
            dias[clave] = d
    return dias


def armar_thea(dia, sem, t, quiz, detalle):
    """Material pensado para Thea (sube archivos/notas y genera guías, flashcards y tests)."""
    if not t:
        return None
    n = dia["t"]
    L = [f"# {n}", "",
         "Materia: Ciberseguridad, preparación para Analista SOC de Nivel 1.", "",
         "## Objetivo", t["obj"], "", "## Conceptos clave"]
    for a, b in t["conceptos"]:
        L += [f"### {a}", b, ""]
    L += ["## Datos que hay que memorizar"]
    L += [f"- {m}" for m in t["memorizar"]]
    L += ["", "## Por qué importa en un SOC", t["soc"]]
    nota = "\n".join(L)

    F = [f"Flashcards: {n}", ""]
    for a, b in t["conceptos"]:
        F += [f"Pregunta: ¿Qué es o qué significa «{a}»?", f"Respuesta: {b}", ""]
    for m in t["memorizar"]:
        F += [f"Pregunta: Completa de memoria: {m.split(':')[0].split(' = ')[0].strip()}", f"Respuesta: {m}", ""]
    if quiz:
        for p in quiz["preguntas"]:
            if p["t"] == "mc":
                F += [f"Pregunta: {p['q']}", f"Respuesta: {p['o'][p['c']]}. {p['w']}", ""]
            else:
                F += [f"Pregunta: {p['q']}", f"Respuesta: {p['m']}", ""]
    flash = "\n".join(F).strip()

    foco = "; ".join(a for a, _ in t["conceptos"][:5])
    test = (
        "CONFIGURACIÓN SUGERIDA PARA EL TEST EN THEA\n"
        f"- Material: la nota «{n}» (y las flashcards si quieres más preguntas).\n"
        "- Tipo de preguntas: opción múltiple y verdadero/falso.\n"
        "- Cantidad: 10 preguntas.\n"
        "- Tiempo: 10 minutos (sin buscar en tus notas).\n"
        "- Retroalimentación inmediata: activada.\n"
        f"- Temas a cubrir: {foco}.\n"
        "- Repetición: repite el test al día siguiente y de nuevo a los 3 días; revisa solo lo que falles.\n"
        "- Las preguntas abiertas hazlas en este sitio (sección Examen) y compáralas con la referencia."
    )
    notas = ""
    if "teoria" in detalle:
        notas = f"# Notas completas: {n}\n\n" + detalle["teoria"].strip()
    return {"nota": nota, "flash": flash, "test": test, "notas": notas}


def main():
    with open(os.path.join(CONTENT, "estructura.json"), encoding="utf-8") as f:
        estructura = json.load(f)
    quizzes = {}
    import glob
    for ruta_q in sorted(glob.glob(os.path.join(CONTENT, "quizzes*.json"))):
        with open(ruta_q, encoding="utf-8") as f:
            quizzes.update(json.load(f))
    thea_data = {}
    ruta_t = os.path.join(CONTENT, "thea.json")
    if os.path.exists(ruta_t):
        with open(ruta_t, encoding="utf-8") as f:
            thea_data = json.load(f)
    dias_md = leer_dias()

    n_dias = n_teoria = n_quiz = 0
    for mes in estructura["meses"]:
        for sem in mes["semanas"]:
            for dia in sem["dias"]:
                clave = f'{mes["n"]}-{sem["n"]}-{dia["n"]}'
                n_dias += 1
                detalle = dias_md.get(clave, {})

                if "teoria" in detalle:
                    dia["teoria"] = md(detalle["teoria"])
                    dia["teoriaCompleta"] = True
                    n_teoria += 1
                else:
                    temas = "".join(f"<li>{t}</li>" for t in dia.get("temas", []))
                    dia["teoria"] = (
                        '<div class="aviso">La teoría detallada de este día aún no está cargada. '
                        'Pídele a Claude «vamos con el día {n} de la semana {s}» y pega el resultado en '
                        '<code>content/dias-*.md</code> bajo la clave <code>{c}</code>. Mientras tanto, estos son los temas:</div>'
                        "<ul>{t}</ul>"
                    ).format(n=dia["n"], s=sem["n"], c=clave, t=temas)
                    dia["teoriaCompleta"] = False

                if "practica" in detalle:
                    dia["practica"] = md(detalle["practica"])
                else:
                    items = "\n".join(f"- {p}" for p in dia.get("prac", []))
                    dia["practica"] = md(items) if items else "<p>Sin práctica definida.</p>"

                if clave in quizzes:
                    dia["quiz"] = quizzes[clave]
                    n_quiz += 1
                else:
                    dia["quiz"] = None

                dia["thea"] = armar_thea(dia, sem, thea_data.get(clave), quizzes.get(clave), detalle)
                dia.pop("temas", None)
                dia.pop("prac", None)

    os.makedirs(os.path.join(BASE, "data"), exist_ok=True)
    with open(os.path.join(BASE, "data", "curso.js"), "w", encoding="utf-8") as f:
        f.write("window.CURSO = ")
        json.dump(estructura, f, ensure_ascii=False)
        f.write(";\n")
    print(f"OK: {n_dias} días, {n_teoria} con teoría completa, {n_quiz} con examen -> data/curso.js")


if __name__ == "__main__":
    main()
