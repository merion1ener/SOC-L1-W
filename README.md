# Ruta SOC L1 — sitio de estudio

Sitio estático (HTML + CSS + JavaScript, sin dependencias) para estudiar día por día.

**Estructura:** Mes → Semana → Día. Cada día tiene Teoría, Práctica y Examen.
Tus respuestas, el resultado y los días completados se guardan en el navegador (`localStorage`).
«Reintentar examen» borra las respuestas de ese examen.

## Verlo en tu computadora

Abre `index.html` con doble clic. No necesita servidor ni instalar nada.

## Publicarlo gratis en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `ruta-soc-l1`) y sube **todo el contenido de esta carpeta**.
2. En el repositorio: **Settings → Pages**.
3. En **Build and deployment**, elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guarda.
4. En uno o dos minutos tendrás la URL `https://TU_USUARIO.github.io/ruta-soc-l1/`.

Nota: el progreso se guarda por navegador y por dirección. Si lo abres desde otro navegador o equipo, empieza vacío.

## Agregar o editar contenido

Todo vive en `content/`. Después de editar, genera los datos del sitio:

```
pip install markdown
python3 build.py
```

Y sube los cambios a GitHub (incluido `data/curso.js`, que es el archivo que genera el script).

| Qué quieres hacer | Dónde |
|---|---|
| Cambiar títulos o descripciones de mes, semana o día | `content/estructura.json` |
| Cargar la teoría y práctica detalladas de un día | `content/dias-*.md` |
| Agregar o cambiar un examen | `content/quizzes*.json` |
| Texto de Thea (objetivo, conceptos, datos a memorizar) | `content/thea.json` |

### Formato de `content/dias-*.md`

La clave de cada día es `mes-semana-día` (por ejemplo `1-2-4` es mes 1, semana 2, día 4):

```
=== 1-2-4 ===
@@teoria
Texto en Markdown...

@@practica
- Paso 1
- Paso 2
```

### Formato de un examen en `content/quizzes.json`

```json
"1-2-4": {
  "titulo": "Examen · HTTP y TLS",
  "intro": "Contéstalo sin mirar tus notas.",
  "preguntas": [
    {"t": "mc", "q": "Pregunta", "o": ["A", "B", "C", "D"], "c": 1, "w": "Explicación"},
    {"t": "open", "q": "Pregunta abierta", "m": "Respuesta de referencia"}
  ]
}
```

- `mc` = opción múltiple. `c` es el índice de la correcta (0 es la primera).
- `open` = respuesta abierta. Tras enviar, ves tu respuesta junto a la de referencia.

## Sección Thea

Cada día tiene una sección **🤖 Thea** con texto listo para copiar (botón Copiar) o bajar como .txt:
resumen con conceptos y datos a memorizar, la instrucción para pedirle a Thea flashcards/examen, y las notas completas del día.
Se genera con `build.py` a partir de `content/thea.json` y de los exámenes.

## Estado actual

- Mes 1 completo: 30 días con teoría, práctica, examen y sección Thea.
- Archivos de exámenes: `content/quizzes*.json` (se combinan solos al ejecutar `build.py`).
