=== 1-2-1 ===
@@teoria
DNS no es nuevo para ti: ya viste en Wireshark una respuesta con registros A, un TTL de 251 segundos y consultas AAAA de IPv6. Hoy le ponemos nombre a todo.

### 1. Qué es DNS

**DNS (Domain Name System)** traduce **nombres** (`example.com`) a **IPs** (`172.66.147.243`). Es la agenda de contactos de Internet.

- Puerto **53**: sobre todo **UDP/53**, también **TCP/53** (respuestas grandes, transferencias de zona).
- Casi toda conexión empieza con una consulta DNS, antes del handshake TCP.

**En SOC:** aunque HTTPS cifre el contenido, la consulta DNS suele dejar a la vista **a qué dominio** intentó conectarse un equipo.

### 2. Estructura de un dominio

Se lee de **derecha a izquierda**:

```
www . mail . example . com .
                |       |   └─ raíz (el punto final implícito)
                |       └───── TLD
                └───────────── dominio
```

| Parte | Ejemplo | Nota |
|---|---|---|
| **TLD** | `.com`, `.org`, `.mx` | Genéricos y de país |
| **Dominio** | `example` | Lo que alguien registra |
| **Subdominio** | `mail` | El dueño los crea libremente |
| **FQDN** | `www.example.com.` | Nombre completo sin ambigüedad |

**En SOC:** en `login.banco.com.sitio-malicioso.xyz` el dominio real es `sitio-malicioso.xyz`, no `banco.com`.

### 3. Cómo se resuelve un nombre

1. **Cachés locales:** caché DNS del equipo y archivo `hosts`.
2. **Resolver recursivo:** el DNS de tu router/ISP (o 8.8.8.8) hace el trabajo por ti.
3. **Servidores raíz:** «¿quién sabe de `.com`?» → apuntan al TLD.
4. **Servidor del TLD (`.com`):** «para `example.com` pregunta a estos servidores».
5. **Servidor autoritativo:** el que tiene el registro oficial y da la IP.
6. El resolver **guarda en caché** y responde a tu equipo.

- **Stub resolver:** el cliente pequeño de tu sistema operativo.
- **Resolver recursivo:** hace todo el recorrido.
- **Autoritativo:** tiene la respuesta oficial de esa zona.

### 4. Tipos de registro

| Registro | Qué guarda | Ejemplo / uso |
|---|---|---|
| **A** | IPv4 de un nombre | `example.com → 104.20.23.154` |
| **AAAA** | IPv6 de un nombre | Lo que usó tu `curl` |
| **CNAME** | Alias de otro nombre | `www → example.com` |
| **MX** | Servidores de correo, con prioridad | **Número menor = mayor prioridad** |
| **TXT** | Texto libre | SPF, DKIM, DMARC, verificaciones |
| **NS** | Servidores autoritativos | Quién manda en esa zona |
| **PTR** | De IP a nombre (inversa) | A quién pertenece una IP |
| **SOA** | Datos administrativos de la zona | Solo reconocer |

**Cuánto aprender:** de memoria **A, AAAA, MX y TXT**; entiende CNAME, NS y PTR; de SOA solo el nombre.

- **MX con varios servidores:** el correo se intenta primero con el número más bajo y, si falla, con el siguiente (respaldo).
- **TXT:** guarda SPF (`v=spf1 ...`, quién puede enviar correo por el dominio), verificaciones de propiedad, y DMARC en `_dmarc.dominio.com` (qué hacer con correos que fallan la validación). DKIM vive en `selector._domainkey.dominio.com`.

### 5. TTL y caché

**TTL:** segundos que una respuesta puede guardarse en caché. En tu captura era 251 (4 min 11 s).

- TTL alto: menos consultas, cambios más lentos.
- TTL bajo: respuestas frescas, más tráfico.
- **En SOC:** los atacantes usan TTL muy bajos para cambiar de IP rápido (*fast flux*).

Ver y limpiar la caché: Windows `ipconfig /displaydns` y `ipconfig /flushdns`; Linux con systemd-resolved: `resolvectl flush-caches`.

### 6. Consulta y respuesta

- **Consulta:** nombre buscado, tipo (A, AAAA, MX…) y un **Transaction ID**.
- **Respuesta:** mismo ID, **Answers** (nombre, tipo, TTL, valor) y un **RCODE**:

| RCODE | Significado |
|---|---|
| **NOERROR** | Todo bien |
| **NXDOMAIN** | El dominio **no existe** |
| **SERVFAIL** | El servidor falló al resolver |
| **REFUSED** | El servidor rechazó la consulta |

Muchos **NXDOMAIN** seguidos desde un mismo equipo son una pista de malware probando dominios generados automáticamente (DGA).

### 7. DNS y seguridad

| Amenaza | Qué es | Cómo se ve |
|---|---|---|
| **Dominio malicioso o de phishing** | Dominio creado para engañar o alojar malware | Consulta a un dominio con mala reputación |
| **Typosquatting** | Dominio casi igual al real (`g00gle.com`) | Faltas de ortografía sutiles |
| **DGA** | El malware genera cientos de dominios aleatorios | Muchos NXDOMAIN y nombres sin sentido |
| **Túnel DNS / exfiltración** | Datos escondidos en consultas | Subdominios larguísimos y mucho volumen a un dominio |
| **Fast flux** | El dominio cambia de IP constantemente | TTL muy bajo y muchas IPs |
| **DNS spoofing / cache poisoning** | Respuesta falsa para redirigir tráfico | El nombre apunta a una IP inesperada |
| **DoH** | DNS dentro de HTTPS (443) | Se pierde visibilidad si TI no lo controla |

**Al revisar un dominio sospechoso:** ¿registro reciente? ¿forma rara? ¿cuántas consultas y con qué frecuencia? ¿reputación en VirusTotal o URLScan?

### 8. Resumen

| Concepto | Una frase para recordarlo |
|---|---|
| DNS | Traduce nombres a IPs; puerto 53 (UDP y TCP) |
| Lectura | De derecha a izquierda: TLD → dominio → subdominio |
| Resolución | Caché → recursivo → raíz → TLD → autoritativo |
| A / AAAA | IPv4 / IPv6 |
| MX / TXT | Correo (menor número = mayor prioridad) / texto (SPF, DKIM, DMARC) |
| TTL | Cuánto vive la respuesta en caché |
| NXDOMAIN | No existe; muchos seguidos = posible DGA |

@@practica
- **Linux:** `nano`, `grep`, `grep -i`, `grep -v`. Bandit niveles 6-7.
- **Red:** `nslookup` y `dig` a 5 dominios y pide cada tipo:
  - `nslookup -type=A example.com`
  - `nslookup -type=AAAA example.com`
  - `nslookup -type=MX gmail.com`
  - `nslookup -type=TXT gmail.com`
  - `nslookup -type=NS example.com`
  - En Linux: `dig example.com A`, `dig gmail.com MX`, `dig +short gmail.com TXT`.
- Captura una consulta DNS en Wireshark (filtro `dns`) y localiza consulta y respuesta.
- Consulta `nslookup -type=TXT _dmarc.gmail.com` y anota la política (`p=none`, `quarantine` o `reject`).
- **Cómo leer la salida de `nslookup`:** «Respuesta no autoritativa» significa que respondió el resolver desde su caché (lo normal). En MX, ordénalos por *preference*: el menor es el principal.
- **THM (apoyo):** *DNS in Detail*.

**Notas:** una línea por cada tipo de registro con lo que viste en tu propia consulta.

=== 1-2-2 ===
@@teoria
Hoy conectas tres piezas que ya viste sin nombrarlas: cómo tu Windows obtuvo su `192.168.1.82` (DHCP), qué es el `ping` (ICMP) y por qué tu IP privada no es la que ve Internet (NAT).

### 1. DHCP

Asigna automáticamente la configuración de red: **IP, máscara, gateway, servidores DNS** y **tiempo de concesión (lease)**.

- **UDP 67** (servidor) y **UDP 68** (cliente).
- En casa, el servidor es tu router.

### 2. El proceso DORA

| Paso | Mensaje | Quién | Qué dice |
|---|---|---|---|
| **D** | **Discover** | Cliente (broadcast) | «¿Hay algún servidor DHCP?» |
| **O** | **Offer** | Servidor | «Te ofrezco 192.168.1.82» |
| **R** | **Request** | Cliente (broadcast) | «Acepto esa oferta» |
| **A** | **Acknowledge** | Servidor | «Confirmado, es tuya por X horas» |

- En el Discover el cliente no tiene IP: origen `0.0.0.0`, destino `255.255.255.255`.
- El Request también es broadcast para que otros servidores DHCP sepan cuál oferta se aceptó.
- **Renovación:** a la mitad del lease el cliente intenta renovar. Sin servidor, Windows se asigna una **APIPA** (`169.254.x.x`).

### 3. DHCP y seguridad

| Amenaza | Qué es | Cómo se nota |
|---|---|---|
| **Rogue DHCP server** | Servidor falso que entrega gateway o DNS maliciosos | Un equipo recibe un gateway o DNS que no corresponden |
| **DHCP starvation** | Pedir cientos de IPs con MACs falsas hasta agotar el rango | Muchos Discover desde MACs distintas |

**Para un L1:** los **logs de DHCP** dicen **qué equipo tenía una IP en un momento dado**.

### 4. ICMP

Protocolo de **capa 3** para mensajes de control y diagnóstico. **No usa puertos.**

| Tipo | Nombre | Significado |
|---|---|---|
| **8** | Echo Request | El «ping» |
| **0** | Echo Reply | La respuesta |
| **3** | Destination Unreachable | No se pudo llegar |
| **11** | Time Exceeded | El paquete agotó su TTL |

Un ping que **no responde** no significa que el equipo esté apagado: muchos firewalls (Windows por defecto) bloquean el ping entrante.

### 5. TTL y traceroute

**TTL:** contador del paquete IP que **baja 1 en cada router**. Al llegar a 0 se descarta y el router envía ICMP **Time Exceeded** (tipo 11).

- Valores iniciales típicos: Linux 64, Windows 128 (pista del sistema operativo, no prueba).
- **Traceroute:** envía paquetes con TTL = 1, 2, 3… y cada router responde Time Exceeded, así que armas el camino.
- Windows `tracert` usa ICMP Echo; Linux `traceroute` usa UDP por defecto (`-I` para ICMP).
- `* * *` suele ser un firewall o un router configurado para no responder.

### 6. ICMP y seguridad

| Uso malicioso | Cómo se ve |
|---|---|
| **Ping sweep** | Muchos Echo Request desde un origen a muchas IPs |
| **Túnel ICMP** | Paquetes ICMP **grandes** o muy frecuentes con contenido inusual |
| **Reconocimiento con traceroute** | Paquetes con TTL creciente |
| **Ping flood** | Volumen enorme de Echo Request |

El ICMP normal es **pequeño y esporádico**.

### 7. NAT y PAT

Las IPs privadas no se enrutan en Internet. **NAT** traduce tus IPs privadas a una pública al salir, y lo inverso con las respuestas. **PAT** (la versión de casa): muchos equipos comparten **una IP pública** y el router los distingue por el **puerto de origen**.

| Lado | Origen |
|---|---|
| Dentro de tu red | `192.168.1.82:49828` |
| Tras el router | `201.x.x.x:40001` (tu IP pública, otro puerto) |

El router guarda la equivalencia en su **tabla NAT**.

- **NAT estático:** una IP privada siempre a la misma pública (publicar un servidor).
- **NAT dinámico:** una pública de un grupo.
- **PAT:** muchas privadas, una pública, distinguidas por puerto.
- **CGNAT:** NAT del proveedor; incluso tu IP «pública» se comparte.
- **IPv6:** hay direcciones para todos, normalmente no hace falta NAT.

### 8. NAT y seguridad

- Desde fuera solo se ve la IP pública: para saber qué equipo interno fue, revisa los **logs de NAT o del firewall**.
- **NAT no es un firewall.** El malware dentro de tu red **inicia la conexión hacia afuera** y NAT no lo impide.

### 9. Resumen

| Concepto | Una frase |
|---|---|
| DHCP | Asigna IP, máscara, gateway y DNS; UDP 67/68 |
| DORA | Discover → Offer → Request → Acknowledge |
| APIPA | `169.254.x.x` cuando no hay DHCP |
| ICMP | Capa 3, sin puertos; tipo 8 = ping, tipo 0 = respuesta |
| TTL | Baja en cada router; en 0 se descarta (tipo 11) |
| NAT / PAT | Traduce IPs privadas a públicas / muchos equipos, una IP pública |

@@practica
- **Linux:** permisos `rwx`, lectura de `-rwxr-xr--`, `chmod`, `chown`. Bandit niveles 8-9.
- **Red:**
  - Libera y renueva la IP de tu VM: Linux `sudo dhclient -r` y `sudo dhclient`; Windows `ipconfig /release` y `ipconfig /renew`.
  - Captura el DORA con Wireshark (filtro `bootp`; en versiones nuevas `dhcp`).
  - Haz `traceroute` (Linux) y `tracert` (Windows) y compáralos con lo capturado.
  - Haz `ping` a tu gateway y localiza Echo Request (tipo 8) y Echo Reply (tipo 0) con el filtro `icmp`.
- **Notas:** dibuja los 4 pasos de DORA con las IPs de tu propia captura.

=== 1-2-3 ===
@@teoria
Retomas el día 3 de la semana 1 y lo profundizas: quién puede hacer qué sobre un archivo, cómo arranca un servicio y qué es una tarea programada. Las tres aparecen en investigaciones como **persistencia** y **escalamiento de privilegios**.

### 1. Permisos NTFS

- **ACL:** lista completa de permisos de un archivo o carpeta.
- **ACE:** cada línea de esa lista («el grupo Users puede leer»).
- **Propietario:** siempre puede cambiar los permisos.

| Permiso | Qué permite |
|---|---|
| **Lectura** | Ver contenido y atributos |
| **Escritura** | Crear archivos o modificar contenido |
| **Lectura y ejecución** | Leer y ejecutar programas |
| **Mostrar contenido de la carpeta** | Ver qué hay dentro |
| **Modificar** | Leer, escribir, ejecutar y **borrar** |
| **Control total** | Todo lo anterior y **cambiar permisos** y tomar posesión |

Cada permiso se puede **Permitir** o **Denegar**.

### 2. Permisos efectivos

1. **Se suman:** Lectura por un grupo + Escritura por otro = ambas.
2. **Deny gana siempre sobre Allow.**
3. **Sin permiso explícito, no hay acceso.**

Ejemplo: Ana está en *Ventas* (Modificar sobre `C:\Datos`) y en *Contratistas* (Denegar Escritura). Resultado: **no puede escribir**.

### 3. Herencia

Por defecto, los permisos de una carpeta se **heredan** a sus subcarpetas y archivos. Se puede desactivar la herencia en una carpeta y definir permisos propios. La herencia puede hacer que un permiso «aparezca» donde nadie lo puso a mano.

### 4. NTFS vs permisos de red compartida

Al compartir una carpeta por SMB (445) entran **dos** conjuntos de permisos: NTFS (siempre) y Share (solo por red). Por red gana el **más restrictivo**.

### 5. Herramientas

| Herramienta | Qué hace |
|---|---|
| Propiedades → Seguridad | Ver y editar permisos |
| `icacls <ruta>` | Ver permisos en CMD |
| `icacls <ruta> /grant usuario:(R)` | Conceder lectura |
| `Get-Acl <ruta>` | Ver permisos en PowerShell |

Letras de `icacls`: `F` control total, `M` modificar, `RX` lectura y ejecución, `R` lectura, `W` escritura. `(I)` = heredado, `(OI)(CI)` = aplica a archivos y subcarpetas.

### 6. Servicios: tipos de inicio

| Tipo | Significado |
|---|---|
| **Automático** | Arranca con el sistema |
| **Automático (retrasado)** | Arranca poco después |
| **Manual** | Solo cuando alguien o algo lo pide |
| **Deshabilitado** | No puede arrancar |

Otros datos: **cuenta** con la que corre (`LocalSystem` es la más privilegiada), ruta del ejecutable, dependencias y acción de recuperación.

Comandos: `sc query`, `sc qc <servicio>`, `Get-Service`, `services.msc`.

### 7. Servicios y seguridad

| Técnica | Qué buscar |
|---|---|
| **Servicio nuevo como persistencia** | Event ID **7045** (o 4697); nombre extraño; ruta en AppData, Temp o ProgramData |
| **Servicio con cuenta SYSTEM** | Servicio nuevo con `LocalSystem` |
| **Permisos débiles sobre un servicio** | Carpeta del servicio con escritura para `Users` |
| **Unquoted service path** | Ruta con espacios y sin comillas (nivel avanzado, para más adelante) |

Patrón: **un servicio es un buen lugar para esconderse**, porque arranca solo y con privilegios altos.

### 8. Tareas programadas

Acciones que Windows ejecuta según un disparador. Se administran con el **Programador de tareas**.

| Parte | Qué define | Ejemplo |
|---|---|---|
| **Desencadenador** | Cuándo se ejecuta | Todos los días a las 3:00, al iniciar sesión, al arrancar |
| **Acción** | Qué ejecuta | Un programa, un script, un comando |
| **Condiciones** | Requisitos extra | Solo con corriente |
| **Cuenta** | Con qué usuario corre | `SYSTEM`, un usuario |

Comandos: `schtasks /query`, `schtasks /query /v /fo list`, `Get-ScheduledTask`, `taskschd.msc`. Se guardan en `C:\Windows\System32\Tasks`.

### 9. Tareas programadas y seguridad

Técnica de persistencia muy usada (MITRE ATT&CK **T1053**): sobrevive reinicios, se crea desde la línea de comandos, puede correr como SYSTEM y se puede crear en un equipo remoto (movimiento lateral).

**Qué buscar:** nombres aleatorios o que imitan los legítimos; acciones que lanzan `powershell.exe`, `cmd.exe`, `wscript.exe` o `mshta.exe` con parámetros largos o codificados; ejecutables en rutas de usuario o temporales; tareas recientes o fuera de horario.

| Event ID | Significado |
|---|---|
| **4698** | Se creó una tarea programada |
| **4699** | Se eliminó una tarea |
| **4702** | Se actualizó una tarea |
| **7045** | Se instaló un servicio |
| **4697** | Se instaló un servicio (log de seguridad) |

La auditoría de tareas programadas suele estar desactivada por defecto: actívala para que aparezca.

### 10. Resumen

| Concepto | Una frase |
|---|---|
| ACL / ACE | Lista de permisos / cada línea de la lista |
| Permisos efectivos | Se suman, pero Deny gana siempre |
| Herencia | Las subcarpetas reciben los permisos de la carpeta padre |
| NTFS vs share | Por red aplica el más restrictivo |
| Servicio nuevo | Persistencia (7045 o 4697) |
| Tarea programada | Trigger + acción + cuenta; persistencia común (4698) |

@@practica
- **Linux:** usuarios y grupos (`whoami`, `id`, `sudo`, `su`, `/etc/passwd`, `/etc/shadow`). **THM (apoyo):** *Linux Fundamentals Part 2*.
- **Windows (laboratorio de permisos):**
  1. Crea 2 usuarios y 1 grupo (`net user`, `net localgroup`).
  2. Crea la carpeta `C:\Prueba` y dale permisos distintos a cada uno con `icacls` (por ejemplo, lectura para uno y modificar para otro).
  3. Inicia sesión con cada usuario y comprueba qué puede hacer.
  4. Añade un **Deny** a uno de ellos y confirma que gana sobre el Allow.
- Lista servicios y tareas programadas con PowerShell: `Get-Service`, `Get-ScheduledTask`.
- Para un servicio cualquiera, anota tipo de inicio, cuenta y ruta (`sc qc <servicio>`).
- **THM (apoyo):** *Windows Fundamentals 2*.
