=== 1-1-1 ===
@@teoria
**Método:** lee una sección, ciérrala, escribe de memoria lo que recuerdes, compara y pasa a la siguiente. Al final, un resumen del día sin mirar.

### 1. Por qué existen los modelos

Para que equipos de fabricantes distintos se entiendan, la comunicación se divide en **capas**. Cada capa hace una sola tarea y le habla solo a la de arriba y a la de abajo. Los modelos son un mapa para **razonar y diagnosticar**: «¿en qué capa ocurre esto?».

### 2. Modelo OSI (7 capas)

| # | Capa | Qué hace | PDU | Ejemplos |
|---|---|---|---|---|
| 7 | **Aplicación** | Servicios que usa el usuario o programa | Datos | HTTP, DNS, SMTP, SSH |
| 6 | **Presentación** | Formato, compresión y cifrado de datos | Datos | TLS (se ubica aquí o entre 5 y 6), JPEG, ASCII |
| 5 | **Sesión** | Abre, mantiene y cierra sesiones | Datos | RPC, NetBIOS |
| 4 | **Transporte** | Entrega extremo a extremo y **puertos** | Segmento (TCP) / datagrama (UDP) | TCP, UDP |
| 3 | **Red** | Direccionamiento lógico y **enrutamiento** | Paquete | IP, ICMP |
| 2 | **Enlace de datos** | Entrega en la red local con **MAC** | Trama | Ethernet, Wi-Fi, ARP |
| 1 | **Física** | Transmite bits por el medio | Bits | Cable, fibra, radio |

**PDU** (Protocol Data Unit) = cómo se llama la unidad de datos en cada capa.

**Orden para memorizar (de abajo hacia arriba):** Física, Enlace, Red, Transporte, Sesión, Presentación, Aplicación. Inventa tu propia frase con las iniciales **F-E-R-T-S-P-A**.

### 3. Modelo TCP/IP (4 capas)

Es el que se usa en la práctica. Se corresponde con OSI así:

| TCP/IP | Equivale en OSI |
|---|---|
| **Aplicación** | 7, 6 y 5 |
| **Transporte** | 4 |
| **Internet** | 3 |
| **Acceso a red** | 2 y 1 |

### 4. Encapsulación y desencapsulación

Al **enviar**, cada capa envuelve los datos con su propia cabecera:

1. **Aplicación:** los datos (por ejemplo, una petición HTTP).
2. **Transporte:** añade la cabecera TCP (puertos, flags) → **segmento**.
3. **Red:** añade la cabecera IP (IP origen y destino) → **paquete**.
4. **Enlace:** añade la cabecera Ethernet (MAC origen y destino) y un cierre → **trama**.
5. **Física:** se convierte en **bits**.

Al **recibir**, se hace al revés (desencapsulación): cada capa quita su cabecera y entrega el resto hacia arriba.

### 5. Qué dispositivo trabaja en cada capa

| Dispositivo | Capa | Qué usa para decidir |
|---|---|---|
| **Hub** | 1 | Nada: repite a todos |
| **Switch** | 2 | Direcciones MAC |
| **Router** | 3 | Direcciones IP |
| **Firewall** | 3 y 4 (los de nueva generación llegan a la 7) | IPs, puertos y, a veces, aplicaciones |
| **WAF** | 7 | Contenido web (HTTP) |

### 6. Cómo lo ves en Wireshark

Al abrir un paquete, el panel de detalles muestra las capas en orden:

- **Frame:** información de la captura.
- **Ethernet II:** MAC origen y destino (capa 2).
- **Internet Protocol:** IP origen y destino (capa 3).
- **TCP o UDP:** puertos, flags, números de secuencia (capa 4).
- **HTTP, DNS, TLS…:** la aplicación (capa 7).

### 7. Por qué importa en SOC

Saber **en qué capa** ocurre algo te dice qué mirar y qué herramienta usar:

| Capa | Ejemplo de ataque o evento | Dónde lo ves |
|---|---|---|
| 2 | ARP spoofing, MAC spoofing | Capturas, logs de switch |
| 3 | Ping sweep, IP spoofing | Firewall, IDS |
| 4 | Escaneo de puertos, SYN flood | Firewall, IDS, capturas |
| 7 | Phishing, inyección SQL, malware que usa HTTPS | Proxy, WAF, SIEM, EDR |

### 8. Resumen

| Concepto | Una frase para recordarlo |
|---|---|
| OSI | 7 capas para razonar; de la 1 (física) a la 7 (aplicación) |
| TCP/IP | 4 capas: aplicación, transporte, internet, acceso a red |
| PDU | Datos, segmento, paquete, trama, bits |
| Encapsulación | Cada capa añade su cabecera al enviar |
| Switch / router | Switch usa MAC (capa 2); router usa IP (capa 3) |

@@practica
Son 90 minutos: 45 de Linux y 45 de red.

### Linux (45 min)

1. Abre la terminal y ejecuta `pwd`. Eso es tu directorio actual.
2. Recorre el árbol de directorios con `cd /`, `ls -la` y entra a cada uno: `/home`, `/etc`, `/var/log`, `/tmp`, `/usr`, `/bin`. En tus notas escribe **una frase por directorio** (qué guarda).
3. Prueba rutas **absolutas** (`cd /var/log`) y **relativas** (`cd ..`, `cd ../etc`, `cd .`). Verifica con `pwd`.
4. **Bandit niveles 0 y 1** (overthewire.org/wargames/bandit):
   - Conéctate con `ssh bandit0@bandit.labs.overthewire.org -p 2220` (usuario y contraseña indicados en la página).
   - Lee la descripción de cada nivel y piensa qué comando conocido te ayuda antes de buscar. Pista nivel 1: un archivo que se llama `-` necesita una ruta explícita (`./-`).
   - Guarda las contraseñas en un archivo local.

### Red (45 min)

1. `ip a` → anota tu IP, tu máscara (CIDR) y tu MAC (`link/ether`).
2. `ip route` → anota tu gateway (`default via ...`).
3. `ss -tulpn` → anota qué puertos están en escucha y qué proceso los usa.
4. Instala Wireshark (`sudo apt install wireshark`; si pregunta por usuarios sin privilegios, responde que sí y agrega tu usuario: `sudo usermod -aG wireshark $USER`, luego cierra sesión y vuelve a entrar).
5. Captura 30 segundos mientras abres una página o haces `ping`.
6. Abre un paquete y **localiza cada capa**: Frame, Ethernet II, IP y TCP/UDP. Anota una MAC, una IP y un puerto.

### Notas (30 min)

1. Dibuja de memoria las 7 capas de OSI con un protocolo por capa y compara con la tabla.
2. Explica con tus palabras qué pasa con un mensaje desde que sale de tu navegador hasta que llega al cable.
3. Tu IP, máscara, MAC y gateway.
4. Los comandos de Linux de hoy con una descripción propia.
5. Una duda.

**Lo lograste si:** dibujas OSI de memoria, ubicas las capas dentro de un paquete en Wireshark y completaste los niveles 0 y 1 de Bandit.

=== 1-1-2 ===
@@teoria
### 1. Qué es una dirección IPv4

Un identificador de **32 bits** que se escribe como **4 octetos** en decimal separados por puntos, cada uno de 0 a 255: `192.168.1.50`. Tiene dos partes: la **red** (a qué grupo pertenece) y el **host** (qué equipo es dentro de ese grupo).

### 2. Binario a decimal

Cada octeto son 8 bits. Cada posición vale una potencia de 2:

| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
|---|---|---|---|---|---|---|---|

- `192` = 128 + 64 = `11000000`
- `168` = 128 + 32 + 8 = `10101000`
- `255` = todos en 1 = `11111111`
- `0` = todos en 0 = `00000000`

**Truco:** de izquierda a derecha, resta el valor de la columna si cabe (pone un 1) y si no, pone 0.

### 3. Rangos especiales

| Rango | Qué es |
|---|---|
| `10.0.0.0/8` | **Privada** (10.x.x.x) |
| `172.16.0.0/12` | **Privada** (de 172.16.x.x a **172.31**.x.x) |
| `192.168.0.0/16` | **Privada** (192.168.x.x) |
| `127.0.0.0/8` | **Loopback** (tu propio equipo, `127.0.0.1`) |
| `169.254.0.0/16` | **APIPA** (el equipo se la asigna si falla DHCP) |
| `224.0.0.0` a `239.255.255.255` | Multicast |
| `255.255.255.255` | Broadcast limitado |

Todo lo que no está en estos rangos suele ser **pública**.

**Ojo con el error común:** `172.66.147.243` empieza con 172 pero **es pública**. Las privadas de ese bloque son solo de `172.16` a `172.31`. Clasificar por el primer número hace que descartes tráfico externo por error.

### 4. Máscara de subred y CIDR

La **máscara** indica cuántos bits son de red. **CIDR** lo escribe como `/n`:

| CIDR | Máscara | Tamaño del bloque | Hosts utilizables |
|---|---|---|---|
| /8 | 255.0.0.0 | 16 777 216 | 16 777 214 |
| /16 | 255.255.0.0 | 65 536 | 65 534 |
| /24 | 255.255.255.0 | 256 | 254 |
| /25 | 255.255.255.128 | 128 | 126 |
| /26 | 255.255.255.192 | 64 | 62 |
| /27 | 255.255.255.224 | 32 | 30 |
| /28 | 255.255.255.240 | 16 | 14 |
| /30 | 255.255.255.252 | 4 | 2 |

**Hosts utilizables = 2^(32−n) − 2.** Se restan 2 porque la primera dirección es la **dirección de red** y la última es el **broadcast**.

### 5. Cómo calcular una subred (método del bloque)

Para una IP y un prefijo, por ejemplo `192.168.1.130/25`:

1. Encuentra el octeto «interesante» (donde la máscara no es 0 ni 255). Aquí es el cuarto: `128`.
2. **Tamaño del bloque** = 256 − 128 = **128**.
3. **Dirección de red** = el múltiplo del bloque más cercano sin pasarse: 0, 128. Como 130 ≥ 128 → red `192.168.1.128`.
4. **Broadcast** = siguiente red − 1 = 256 − 1 → `192.168.1.255`.
5. **Hosts** = de `.129` a `.254`.

**Ejemplos resueltos:**

| IP / prefijo | Bloque | Red | Broadcast | Hosts |
|---|---|---|---|---|
| 10.0.5.77/24 | 256 | 10.0.5.0 | 10.0.5.255 | .1 a .254 |
| 172.16.20.130/26 | 64 | 172.16.20.128 | 172.16.20.191 | .129 a .190 |
| 192.168.1.50/25 | 128 | 192.168.1.0 | 192.168.1.127 | .1 a .126 |

**¿Están en la misma red?** Compara las direcciones de red. `192.168.1.50` y `192.168.1.130` con **/25** están en redes distintas (`.0` y `.128`); con **/24** están en la misma.

### 6. Gateway

El **gateway** (puerta de enlace) es el router de tu red. Si el destino está **dentro** de tu red, hablas directo con él; si está **fuera**, envías el paquete al gateway. Por eso `ip route` muestra una línea `default via ...`.

### 7. Por qué importa en SOC

- **Interno o externo:** distinguir IP privada de pública es el primer filtro de casi toda alerta.
- **Reglas y listas:** firewalls y SIEM usan CIDR (`10.0.0.0/8`) para definir «interno».
- **Segmentación:** que dos equipos de redes distintas hablen entre sí puede ser normal o un movimiento lateral.
- **IPs inusuales:** una `169.254.x.x` indica que un equipo no obtuvo DHCP.

### 8. IPv6 (solo un vistazo)

Son 128 bits escritos en hexadecimal (`2606:4700:10::ac42:93f3`). `::` abrevia grupos en cero (solo una vez). Ya viste que tu `curl` la usó.

### 9. Resumen

| Concepto | Una frase para recordarlo |
|---|---|
| IPv4 | 32 bits en 4 octetos |
| Privadas | 10/8, 172.16/12 (hasta 172.31), 192.168/16 |
| Loopback / APIPA | 127.0.0.1 / 169.254.x.x |
| Hosts utilizables | 2^(32−n) − 2 |
| Método del bloque | Bloque = 256 − octeto de la máscara; red = múltiplo; broadcast = siguiente − 1 |

@@practica
### Linux (45 min)

1. Practica con archivos: `mkdir practica`, `cd practica`, `touch uno.txt dos.txt`, `cp uno.txt copia.txt`, `mv dos.txt renombrado.txt`, `cat uno.txt`, `rm copia.txt`, `ls -la`.
2. Escribe algo en un archivo con `echo "hola" > uno.txt` y compáralo con `echo "mundo" >> uno.txt` (`>` sobrescribe, `>>` agrega). Léelo con `cat`.
3. **Bandit niveles 2 y 3:**
   - Nivel 2: archivo con espacios en el nombre (usa comillas o `\ `).
   - Nivel 3: archivo oculto (empieza con punto) dentro de un directorio; piensa en `ls -a`.

### Red (45 min)

**Parte A: 10 subredes a mano.** Resuélvelas **sin calculadora** y verifica con `ipcalc` (`sudo apt install ipcalc`). Para cada una escribe red, broadcast y rango de hosts.

1. 192.168.10.77/24
2. 192.168.10.77/25
3. 192.168.10.200/26
4. 10.1.2.3/16
5. 172.16.45.9/27
6. 192.168.1.100/28
7. 10.0.0.130/25
8. 172.20.5.250/26
9. 192.168.5.5/30
10. 10.200.100.1/8

**Parte B: preguntas.**

- ¿Están 192.168.1.50 y 192.168.1.130 en la misma red con /25? ¿Y con /24?
- ¿Cuántos hosts utilizables tiene un /27?
- ¿`172.32.0.5` es privada o pública? ¿Y `172.31.0.5`?

**Parte C:** abre tu captura del lunes en Wireshark (o haz una nueva), lista las IPs que aparecen y clasifícalas como privadas o públicas.

### Notas (30 min)

1. Resultados de las 10 subredes y qué errores cometiste.
2. El método del bloque explicado con tus palabras.
3. Tabla de rangos privados de memoria.
4. Comandos de Linux de hoy y Bandit.
5. Una duda.

**Lo lograste si:** resuelves una subred en menos de 1 minuto con el método del bloque y no confundes `172.66.x.x` con una privada.

=== 1-1-6 ===
@@teoria
**Hoy no hay teoría nueva.** Es el sábado de laboratorio: construyes tu entorno de trabajo y lo documentas. Dedica los primeros 10 minutos a releer solo tus propias notas de la semana (sin el material).

### Qué vas a construir

Dos máquinas virtuales (Linux y Windows) en una **red aislada**, capaz de hablar entre sí y sin exponerse a tu red real.

```
   [ VM Linux ] ───── red virtual aislada ───── [ VM Windows ]
   192.168.56.10                                  192.168.56.20
```

(Las IPs de ejemplo son para una red host-only. Usa las que te asigne tu hipervisor.)

### Tipos de red en el hipervisor

| Tipo | Qué hace | Cuándo usarla |
|---|---|---|
| **NAT** | La VM sale a Internet por tu equipo; las VMs no se ven entre sí (salvo NAT Network) | Para actualizar o descargar |
| **Host-only** | La VM solo se ve con tu equipo y otras VMs, sin Internet | Para ataques y prácticas aisladas |
| **NAT Network / red interna** | Las VMs se ven entre sí y pueden salir a Internet o no | Laboratorio de varias VMs |
| **Bridged** | La VM aparece como otro equipo de tu red real | Evítala para prácticas de ataque |

**Recomendación:** red **host-only** (o red interna) para las prácticas y NAT solo cuando necesites descargar algo.

### Reparto de las 3 horas

1. **Hora 1:** montar y ejecutar.
2. **Hora 2:** analizar la evidencia.
3. **Hora 3:** escribir y subir a GitHub.

### Mini-checkpoint

Al terminar, responde el mini-checkpoint de la semana 1 que está en la sección de examen.

@@practica
### Hora 1: montar

1. En tu hipervisor crea una red **host-only** (VirtualBox: Archivo → Herramientas → Administrador de red; VMware: Virtual Network Editor).
2. Conecta la VM Linux y la VM Windows a esa red (puedes dejar un segundo adaptador en NAT si necesitas Internet).
3. Verifica la IP de cada una: `ip a` en Linux, `ipconfig` en Windows.
4. Desde Linux haz `ping` a la IP de Windows. **Si no responde, es normal:** el firewall de Windows bloquea el ping por defecto. Puedes habilitar la regla «Compartir archivos e impresoras (petición eco ICMPv4)» en el firewall o ejecutar en PowerShell como administrador: `New-NetFirewallRule -DisplayName "Permitir ping lab" -Protocol ICMPv4 -IcmpType 8 -Action Allow` (y bórrala al terminar si quieres).

### Hora 2: capturar y analizar

1. En **Windows**, abre Wireshark y empieza a capturar en la interfaz de la red del laboratorio. (Recuerda: Wireshark solo ve el tráfico que llega a la máquina donde corre.)
2. Desde Linux: `ping -c 4 <IP de Windows>`.
3. Filtra con `arp` y localiza el Request (broadcast) y el Reply. Anota las MACs.
4. Filtra con `icmp` y localiza Echo Request (tipo 8) y Echo Reply (tipo 0).
5. Limpia la caché ARP y repite para volver a ver el ARP: `sudo ip neigh flush all` (Linux).
6. Captura y guarda un `.pcap` con el nombre `semana1-arp-icmp.pcap`.

### Hora 3: documentar

1. Dibuja el **diagrama del laboratorio** (puedes hacerlo en draw.io o a mano y fotografiarlo): las dos VMs, sus IPs, máscara, gateway y tipo de red.
2. Crea tu repositorio de GitHub (por ejemplo `soc-lab`) y sube una carpeta `semana-01` con el diagrama y tus notas en Markdown.
3. Toma **snapshots** de las dos VMs con nombres claros (`lab-limpio-semana1`).

**No subas** contraseñas, claves ni soluciones de Bandit.

**Lo lograste si:** las dos VMs se hablan, viste ARP e ICMP en tu captura, tienes el diagrama en GitHub y los snapshots creados.

=== 1-2-4 ===
@@teoria
### 1. HTTP

Protocolo de la capa de aplicación para pedir y servir páginas y datos. Modelo **cliente-servidor**: el cliente envía una **petición** y el servidor devuelve una **respuesta**. Es **texto plano** y usa el puerto **80**.

**Petición:**

```
GET /index.html HTTP/1.1
Host: example.com
User-Agent: curl/8.4.0
Accept: */*
```

**Respuesta:**

```
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1256
Server: ECS

<html> ... </html>
```

Partes: línea inicial, **headers**, línea en blanco y **cuerpo** (opcional).

### 2. Métodos

| Método | Para qué sirve |
|---|---|
| **GET** | Pedir un recurso (los datos van en la URL) |
| **POST** | Enviar datos al servidor (formularios, login) |
| **HEAD** | Como GET pero solo los headers (`curl -I`) |
| **PUT** | Crear o reemplazar un recurso |
| **DELETE** | Borrar un recurso |
| **OPTIONS** | Preguntar qué métodos acepta |

### 3. Códigos de estado

| Rango | Significado | Ejemplos |
|---|---|---|
| **1xx** | Informativos | 100 Continue |
| **2xx** | Éxito | **200** OK, 201 Created, 204 No Content |
| **3xx** | Redirección | **301** movido permanente, **302** temporal, 304 sin cambios |
| **4xx** | Error del cliente | 400 petición mala, **401** no autenticado, **403** prohibido, **404** no encontrado, 405 método no permitido |
| **5xx** | Error del servidor | **500** error interno, 502 bad gateway, 503 no disponible |

### 4. Headers importantes

| Header | Qué contiene |
|---|---|
| `Host` | Dominio al que va la petición |
| `User-Agent` | Programa que hace la petición (navegador, curl, python-requests) |
| `Referer` | Página desde la que se llegó |
| `Cookie` / `Set-Cookie` | Cookies de sesión |
| `Content-Type` / `Content-Length` | Tipo y tamaño del cuerpo |
| `Authorization` | Credenciales o tokens |
| `Location` | A dónde redirigir (en 3xx) |
| `X-Forwarded-For` | IP original cuando hay proxies o balanceadores |

### 5. Cookies

Pequeños datos que el servidor guarda en tu navegador para recordar tu sesión. Una **cookie de sesión robada** permite hacerse pasar por ti sin conocer tu contraseña (secuestro de sesión). Flags de protección: **Secure** (solo por HTTPS), **HttpOnly** (JavaScript no puede leerla) y **SameSite**.

### 6. HTTPS y TLS

**HTTPS** = HTTP sobre **TLS**, puerto **443**. TLS aporta:

- **Confidencialidad:** el contenido va cifrado.
- **Integridad:** se detecta si alguien modifica los datos.
- **Autenticación:** un **certificado** firmado por una **CA** demuestra que el servidor es quien dice ser.

**Handshake simplificado:**

1. Handshake TCP (SYN, SYN-ACK, ACK).
2. **Client Hello:** el cliente propone versiones y cifrados e incluye el **SNI** (nombre del servidor).
3. **Server Hello** + certificado.
4. Acuerdo de claves.
5. **Application Data:** ya todo cifrado.

### 7. Qué sigue visible en HTTPS y qué no

| Visible | Cifrado |
|---|---|
| IP origen y destino | URL completa (ruta y parámetros) |
| Puertos (443) | Headers y cookies |
| **SNI** (nombre del dominio en el Client Hello) | Cuerpo de la petición y la respuesta |
| Tamaño y momento de los paquetes | Contenido de la página |
| Consulta DNS previa | |

Nota: el SNI puede ir cifrado en conexiones nuevas con ECH, pero hoy aún es muy común verlo en claro.

### 8. HTTP/HTTPS en SOC

| Señal | Qué puede indicar |
|---|---|
| Muchos **404** desde una IP | Escaneo de directorios o archivos |
| Muchos **401** o **403** | Fuerza bruta o acceso no autorizado |
| **500** repetidos | Intento de explotación o servidor fallando |
| `User-Agent` raro, vacío o de herramientas (`curl`, `python-requests`, `sqlmap`) | Automatización o escaneo |
| **POST** a rutas inusuales | Webshell o exfiltración |
| Conexiones **periódicas** (cada N segundos) por 443 hacia un dominio raro | **Beaconing** de malware |
| Certificado autofirmado, caducado o con dominio que no coincide | Infraestructura sospechosa |
| Credenciales visibles en HTTP | Tráfico sin cifrar interceptable |

**Por qué el malware usa 443:** para mezclarse con tráfico web normal y esconder el contenido.

### 9. Resumen

| Concepto | Una frase |
|---|---|
| HTTP | Texto plano, puerto 80, petición y respuesta |
| Métodos | GET pide, POST envía, HEAD solo headers |
| Códigos | 2xx éxito, 3xx redirección, 4xx error del cliente, 5xx del servidor |
| HTTPS | HTTP sobre TLS, puerto 443, contenido cifrado |
| SNI | Dominio visible en el Client Hello |
| Beaconing | Conexiones periódicas a un mismo destino |

@@practica
### Linux (45 min)

1. `find` por nombre y tipo: `find /etc -name "*.conf" 2>/dev/null | head`, `find / -type f -size +10M 2>/dev/null`, `find /var/log -mtime -1` (modificados en el último día), `find / -perm -4000 2>/dev/null` (archivos con bit SUID).
2. `curl -I https://example.com` y `curl -I http://example.com` y compara los códigos y headers. Prueba `curl -v` para ver más detalle.
3. `wget https://example.com -O ejemplo.html` y revisa el archivo con `less` y `file`.
4. **Bandit nivel 10:** contenido codificado en base64; busca el comando `base64 -d`.

### Red (45 min)

1. Inicia una captura en la misma máquina donde ejecutarás el `curl`.
2. Ejecuta `curl -I http://example.com` y luego `curl -I https://example.com`.
3. Para **HTTP**: filtra `http`, localiza la petición y la respuesta, y usa **Follow → TCP Stream**. Anota método, `Host`, `User-Agent` y código de respuesta.
4. Para **HTTPS**: filtra `tls.handshake.type == 1` (Client Hello). Abre el paquete y busca `server_name` en las extensiones. Anota IP origen, IP destino (¿IPv4 o IPv6?) y puerto efímero.
5. Compara: ¿qué pudiste leer en HTTP y qué no en HTTPS?
6. **THM (apoyo):** *HTTP in Detail*.

### Notas (30 min)

1. Tabla: método, código y headers que viste en tu captura HTTP.
2. Comparación de 5 líneas HTTP vs HTTPS: qué siguió visible y qué cifrado.
3. Tu socket de HTTPS: `IP:puerto → IP:443`.
4. Comandos nuevos de Linux con descripción propia.
5. Una duda.

**Lo lograste si:** explicas qué ve un analista en HTTP y qué en HTTPS, y encontraste el SNI en tu propia captura.

=== 1-2-5 ===
@@teoria
### 1. Qué es Wireshark

Analizador de paquetes: captura y muestra el tráfico de red. Guarda en formatos `.pcap` y `.pcapng`. Es la herramienta base del análisis de red.

**Interfaz (3 paneles):**

1. **Lista de paquetes:** una línea por paquete (número, tiempo, origen, destino, protocolo, longitud, info).
2. **Detalles:** las capas del paquete seleccionado, expandibles.
3. **Bytes:** el contenido en hexadecimal y ASCII.

La **barra de filtro** se pone **verde** si el filtro es válido y **roja** si tiene un error.

### 2. Filtros de captura vs filtros de visualización

| | Filtro de captura | Filtro de visualización |
|---|---|---|
| Cuándo se aplica | **Antes** de capturar (descarta el resto) | **Después**, sobre lo ya capturado |
| Sintaxis | BPF (`host 1.2.3.4`, `port 53`) | De Wireshark (`ip.addr == 1.2.3.4`) |
| Se puede cambiar | No sobre lo ya capturado | Sí, las veces que quieras |

Para empezar, **captura todo y filtra al visualizar**.

### 3. Sintaxis de los filtros de visualización

- Comparadores: `==`, `!=`, `>`, `<`, `contains`, `matches`.
- Lógica: `&&` (y), `||` (o), `!` (no).
- Ejemplo: `ip.addr == 192.168.1.50 && tcp.port == 443`

### 4. Filtros que debes dominar

| Filtro | Qué muestra |
|---|---|
| `ip.addr == x.x.x.x` | Tráfico de o hacia esa IP |
| `ip.src == x` / `ip.dst == x` | Solo origen / solo destino |
| `tcp.port == 443` | TCP por ese puerto |
| `udp.port == 53` | UDP por ese puerto |
| `http` / `dns` / `icmp` / `arp` | Por protocolo |
| `tcp.flags.syn == 1 && tcp.flags.ack == 0` | Solo SYN iniciales (conexiones nuevas y escaneos) |
| `tcp.flags.reset == 1` | Paquetes RST |
| `http.request.method == "POST"` | Peticiones POST |
| `http.response.code == 404` | Respuestas 404 |
| `dns.qry.name contains "ejemplo"` | Consultas DNS por nombre |
| `dns.flags.rcode == 3` | Respuestas NXDOMAIN |
| `tls.handshake.type == 1` | Client Hello de TLS |
| `frame contains "texto"` | Cualquier paquete con ese texto |
| `tcp.stream eq 5` | Una conversación TCP concreta |
| `ipv6` | Tráfico IPv6 |
| `!arp` | Todo menos ARP |

Un clic derecho sobre un campo → **Apply as Filter** te escribe el filtro automáticamente.

### 5. Herramientas útiles

| Herramienta | Para qué |
|---|---|
| **Follow → TCP Stream** | Leer una conversación completa |
| **Statistics → Protocol Hierarchy** | Qué protocolos hay y cuánto pesan |
| **Statistics → Conversations / Endpoints** | Quién habla con quién y quién habla más |
| **Statistics → I/O Graph** | Picos de tráfico en el tiempo |
| **File → Export Objects → HTTP** | Listar archivos descargados por HTTP (¡no los ejecutes!) |
| **View → Time Display Format** | Cambiar a hora UTC o tiempo relativo |
| **Coloring rules** | Colores por tipo de tráfico (RST, errores, etc.) |

### 6. Método de análisis de un PCAP

1. **Panorama:** Protocol Hierarchy y Conversations (los «top talkers»).
2. **DNS:** `dns` → ¿qué dominios se consultaron? ¿hay nombres raros o NXDOMAIN?
3. **HTTP/TLS:** `http`, `tls.handshake.type == 1` → ¿qué servidores y qué SNI?
4. **Tráfico sospechoso:** descargas, POST, conexiones periódicas, puertos raros.
5. **Detalle:** Follow TCP Stream sobre lo que llame la atención.
6. **Anota IOCs:** IPs, dominios, URLs, hashes, hora y qué hizo cada equipo.

### 7. Seguridad al analizar PCAPs

- Abre PCAPs de malware **solo dentro de una VM**.
- No ejecutes archivos exportados de una captura.
- Desactiva «resolver nombres de red» si no quieres que Wireshark genere consultas DNS por su cuenta.

### 8. Resumen

| Concepto | Una frase |
|---|---|
| Captura vs visualización | Antes y después de capturar |
| `ip.addr`, `tcp.port`, `dns`, `http` | Los filtros base |
| `tcp.flags.syn == 1 && tcp.flags.ack == 0` | SYN iniciales: escaneos y conexiones nuevas |
| Follow TCP Stream | Leer la conversación completa |
| Conversations | Quién habla con quién |

@@practica
### Linux (45 min)

1. Repaso de la semana: `grep`, `find`, `head`, `tail`, `wc`, `less`, permisos (`ls -l`, `chmod`).
2. Reto: crea un archivo `datos.txt` con 20 líneas (por ejemplo, con `seq 1 20 > datos.txt`) y usa `head`, `tail`, `wc -l` y `grep` para responder: ¿cuántas líneas contienen «1»? ¿cuál es la línea 15?
3. Continúa con Bandit hasta donde llegues (nivel 10 o 11).

### Red (45 min)

1. **THM (ruta SOC L1):** *Wireshark: The Basics*. Haz la room completa si puedes.
2. Practica los 8 filtros en una captura propia o en un PCAP de práctica: `ip.addr==`, `tcp.port==`, `http`, `dns`, `icmp`, `tcp.flags.syn==1`, `frame contains "texto"`, `!arp`.
3. Para cada filtro escribe en tus notas **qué viste** y una pregunta que responde.
4. Abre **Statistics → Conversations** y **Protocol Hierarchy** en la captura y anota las 3 conversaciones con más paquetes.
5. Haz un clic derecho → **Apply as Filter** sobre 3 campos distintos y observa el filtro que se escribe.

### Notas (30 min)

1. Tabla de 8 filtros con una frase propia cada uno.
2. Los 6 pasos del método de análisis de un PCAP.
3. Lo que aprendiste en la room de THM.
4. Una duda.

**Lo lograste si:** escribes de memoria los 8 filtros base y encuentras las IPs más activas de una captura sin ayuda.

=== 1-2-6 ===
@@teoria
**Hoy no hay teoría nueva.** Es el sábado de laboratorio. Dedica 10 minutos a releer tus notas de DNS, DHCP/ICMP/NAT, permisos, HTTP/TLS y Wireshark, sin el material.

### Qué vas a hacer

Analizar **PCAPs reales de malware** con el método de 6 pasos de ayer y practicar permisos en Linux.

### Seguridad (léelo antes de descargar nada)

- **Descarga y abre los PCAPs solo dentro de una VM** (de preferencia sin carpetas compartidas con tu equipo principal).
- Los ZIP de malware-traffic-analysis.net llevan **contraseña**; la indica el propio sitio.
- Un PCAP es solo tráfico grabado, pero algunos pueden contener **archivos maliciosos** (que puedes exportar). **No los ejecutes.**
- No publiques los PCAPs en GitHub; publica tus **notas e IOCs**.

### Qué debe tener tu análisis

| Sección | Contenido |
|---|---|
| Resumen | 10 líneas: qué crees que pasó |
| Equipos | IPs internas, MAC y nombre de host si aparecen |
| Dominios e IPs | Los más relevantes y por qué |
| Protocolos | Qué protocolos hay y cuáles llaman la atención |
| Timeline | Hora y evento clave |
| IOCs | IPs, dominios, URLs y hashes |

@@practica
### Hora 1: preparar y panorama

1. En tu VM Linux, descarga **2 PCAPs** de malware-traffic-analysis.net (elige ejercicios con respuestas publicadas para poder comparar al final).
2. Abre el primero en Wireshark.
3. **Statistics → Protocol Hierarchy** y **Conversations**: anota las IPs más activas.
4. Identifica la IP **interna** que parece ser la víctima (suele ser la que genera más conexiones salientes).

### Hora 2: análisis

1. Filtra `dns` y lista los dominios consultados. ¿Alguno raro? Busca NXDOMAIN con `dns.flags.rcode == 3`.
2. Filtra `http` y `tls.handshake.type == 1`: anota URLs, servidores y SNI.
3. Busca descargas con **File → Export Objects → HTTP** (sin abrir nada).
4. Con **Follow → TCP Stream** revisa lo más sospechoso.
5. Repite con el segundo PCAP.

### Hora 3: documentar y Linux

1. Para cada PCAP escribe **10 líneas** de qué crees que pasó y la lista de IOCs.
2. Compara con las respuestas publicadas en el sitio. Anota en qué acertaste y qué se te pasó.
3. **Linux (permisos):**
   - Crea el grupo `equipo` y un usuario: `sudo groupadd equipo`, `sudo useradd -m -G equipo alumno`, `sudo passwd alumno`.
   - Crea un archivo `secreto.txt`, asígnalo al grupo y deja permisos solo para propietario y grupo: `sudo chgrp equipo secreto.txt`, `chmod 660 secreto.txt`.
   - Cambia a `alumno` con `su - alumno` y comprueba que puede leerlo; con otro usuario sin el grupo, comprueba que **no** puede.
4. Responde el **mini-checkpoint de la semana 2** (sección de examen).

**Lo lograste si:** tienes 2 análisis de PCAP con IOCs, los comparaste con las respuestas del sitio y los permisos de Linux funcionan como esperabas.
