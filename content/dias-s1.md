=== 1-1-3 ===
@@teoria
**Método:** lee una sección, ciérrala, escribe de memoria lo que recuerdes, compara y pasa a la siguiente. Al final, un resumen del día sin mirar.

### 1. Procesos e hilos

**Programa vs. proceso.** Un programa es un archivo en disco (`notepad.exe`). Un proceso es ese programa ya en ejecución en memoria.

Un proceso tiene:

- **PID** (Process ID): número único mientras vive.
- **PPID** (Parent PID): el PID del proceso que lo creó (relación padre-hijo).
- Su propio espacio de memoria.
- Un usuario bajo el cual corre.
- La ruta del ejecutable (por ejemplo `C:\Windows\System32\svchost.exe`).

**Hilo (thread):** la unidad que realmente ejecuta código dentro de un proceso. Un proceso tiene al menos uno. Para un L1 importan menos que los procesos.

**Por qué importa en SOC:** casi toda investigación de un equipo comprometido empieza con «¿qué procesos corren, quién los lanzó y desde dónde?».

- **Padre-hijo:** `explorer.exe` lanzando `chrome.exe` es normal. `winword.exe` lanzando `powershell.exe` es muy sospechoso (un documento malicioso ejecutó un comando).
- **Ruta:** un `svchost.exe` legítimo vive en `C:\Windows\System32`. Si corre desde `AppData` o `Temp`, es una alerta clara.

**Procesos legítimos que debes conocer:**

| Proceso | Qué es |
|---|---|
| `System` (PID 4) | Proceso del kernel |
| `smss.exe` | Session Manager, arranca sesiones |
| `csrss.exe` | Subsistema de ejecución cliente/servidor |
| `wininit.exe` | Inicializa el sistema |
| `services.exe` | Administra los servicios |
| `lsass.exe` | Autenticación y credenciales (objetivo muy atacado) |
| `svchost.exe` | Aloja servicios; es normal ver muchas instancias |
| `explorer.exe` | El escritorio y el explorador de archivos |

Estos nombres se usan para camuflar malware (`svch0st.exe`, `lsasss.exe`). Fíjate siempre en la **ortografía y la ruta**.

### 2. Servicios

**Servicio:** un proceso en segundo plano, sin interfaz, que normalmente arranca con el sistema. Ejemplos: impresión, cliente DHCP, firewall.

Datos de un servicio: nombre, estado, **tipo de inicio** (automático, manual, deshabilitado), **cuenta con la que corre** (`LocalSystem`, `LocalService`, `NetworkService` o un usuario) y ruta del ejecutable.

**Diferencia con un proceso:** un servicio es un proceso administrado por `services.exe`. Todo servicio en ejecución aparece como proceso, pero no todo proceso es un servicio.

**En SOC:** los servicios son una forma común de **persistencia**. El Event ID **7045** (servicio instalado) lo verás mucho. Un servicio sospechoso suele tener nombre aleatorio, ruta en carpetas de usuario o temporales, y la cuenta `LocalSystem`.

### 3. Cuentas, grupos y SID

- **Locales:** existen solo en esa máquina (`Administrator`, `Guest`, las que crees).
- **De dominio:** existen en Active Directory y valen en toda la red corporativa.
- **De servicio:** las usan servicios y aplicaciones, no personas.

| Grupo | Para qué sirve |
|---|---|
| **Administrators** | Control total del equipo |
| **Users** | Usuarios estándar, permisos limitados |
| **Guests** | Acceso mínimo, normalmente deshabilitado |
| **Remote Desktop Users** | Pueden conectarse por RDP |

Que alguien sea añadido a **Administrators** (Event ID 4732) es un indicador clásico de escalamiento de privilegios o persistencia.

**SID (Security Identifier):** identificador único de una cuenta o grupo. Ejemplo: `S-1-5-21-3623811015-3361044348-30300820-1013`.

- `S-1`: es un SID, revisión 1.
- `5`: autoridad (NT Authority).
- `21-...-...-...`: identifica el equipo o dominio.
- El último número es el **RID**, que identifica la cuenta dentro de ese equipo o dominio.

**RIDs para memorizar:** **500** = Administrator integrado, **501** = Guest, **1000 en adelante** = cuentas creadas por usuarios. Un SID que termina en 500 es el Administrator integrado aunque alguien le haya cambiado el nombre.

### 4. UAC (User Account Control)

Evita que un programa corra con permisos de administrador sin tu aprobación (la ventana «¿Deseas permitir que esta aplicación realice cambios?»).

- Un administrador recibe **dos tokens** al iniciar sesión: uno estándar y otro completo.
- Trabaja por defecto con el estándar.
- Cuando algo necesita privilegios altos, UAC pide confirmación (elevación).

**En SOC:** los atacantes buscan **eludir UAC** (UAC bypass). Por ahora solo entiende el concepto: UAC separa lo que corre con permisos normales de lo que corre elevado.

### 5. NTFS y permisos básicos

NTFS es el sistema de archivos moderno de Windows. Soporta permisos, cifrado (EFS), journaling y **flujos de datos alternativos (ADS)**, con los que un atacante puede esconder datos dentro de un archivo.

Permisos básicos: Lectura, Escritura, Lectura y ejecución, Modificar, Control total. **Deny gana sobre Allow.** (La semana 2 profundiza en herencia y práctica.)

### 6. Carpetas clave

| Ruta | Qué contiene | Por qué importa |
|---|---|---|
| `C:\Windows` | El sistema operativo | Los binarios legítimos viven aquí |
| `C:\Windows\System32` | Ejecutables y librerías (`cmd.exe`, `svchost.exe`, `lsass.exe`) | Un ejecutable «del sistema» fuera de aquí es sospechoso |
| `C:\Windows\Temp` y `%TEMP%` | Archivos temporales | Muy usado por malware para soltar archivos |
| `C:\Users\<usuario>` | Perfil de cada usuario | Donde caen las descargas |
| `C:\Users\<usuario>\AppData` | Datos de aplicaciones por usuario | Malware que persiste sin permisos de administrador |
| `C:\ProgramData` | Datos de aplicaciones para todos | También se usa para esconder malware |
| `C:\Program Files` y `(x86)` | Aplicaciones instaladas | Ubicación normal del software |

**Regla útil:** ejecutables corriendo desde `AppData`, `Temp`, `Downloads` o `ProgramData` merecen revisión.

### 7. Resumen para tus notas

| Concepto | Una frase para recordarlo | Pista de seguridad |
|---|---|---|
| Proceso | Programa en ejecución, con PID y PPID | Revisa padre-hijo y ruta |
| Servicio | Proceso en segundo plano administrado por `services.exe` | Persistencia (7045) |
| Grupo | Conjunto de cuentas con permisos | Altas a Administrators (4732) |
| SID | Identificador interno | RID 500 = Administrator |
| UAC | Pide confirmación antes de elevar | Bypass de UAC |
| NTFS | Sistema de archivos con permisos | ADS puede ocultar datos |
| System32 | Binarios legítimos | Mismo nombre fuera de aquí = sospechoso |

**Room de THM para reforzar:** *Windows Fundamentals 1* (y *Core Windows Processes* si la encuentras). Confirma el nombre actual en THM.

@@practica
Son 90 minutos: **arranca la instalación de Windows primero y haz Linux mientras termina.**

### Antes de empezar

- **ISO:** descárgala del Evaluation Center de Microsoft (verifica la versión y cuánto dura la licencia de prueba).
- **Hipervisor:** VirtualBox o VMware Workstation Player.
- **VM:** 2 CPUs, 4 GB de RAM y unos 50 GB de disco dinámico. **Red en NAT** por ahora.

### Bloque 1: Windows (45 min)

1. Lanza la instalación (10 minutos activos) y pasa a Linux mientras termina.
2. Cuando Windows haya arrancado, toma un **snapshot limpio** (por ejemplo `Windows-limpio-dia3`).
3. En CMD ejecuta cada comando y anota qué muestra:

| Comando | Qué debes buscar |
|---|---|
| `whoami` | Tu usuario y el nombre del equipo |
| `whoami /all` | Tu **SID**, tus **grupos** y tus **privilegios** |
| `tasklist` | Procesos con su PID |
| `tasklist /svc` | Servicios dentro de cada `svchost.exe` |
| `net user` | Cuentas locales |
| `net localgroup administrators` | Quiénes son administradores |
| `ipconfig /all` | IP, máscara, gateway, DNS y MAC |

**Ejercicios de reconocimiento (10 min):**

1. En `whoami /all` identifica tu SID y su **RID**. ¿Es 1000 o más?
2. En `net user` localiza `Administrator` y `Guest`. ¿Están habilitadas?
3. En `tasklist` encuentra `System` (PID 4), `lsass.exe`, `services.exe` y `explorer.exe`.
4. En el Administrador de tareas, pestaña Detalles, revisa la ruta de 3 procesos (clic derecho → abrir ubicación del archivo). ¿Están en `System32`?
5. **Opcional:** en PowerShell, `Get-CimInstance Win32_Process | Select-Object Name,ProcessId,ParentProcessId,ExecutablePath` y busca quién es el padre de `explorer.exe`.

### Bloque 2: Linux (45 min)

**Parte A: ayuda y atajos (15 min).**

- `man ls` (sal con `q`), `ls --help`, `pwd --help`.
- **Tab:** escribe `cd /et` y presiona Tab; `ls /var/lo` y Tab dos veces.
- `history`, `!!`, `Ctrl+R`, `clear`.
- Anota 5 comandos con una descripción propia.

**Parte B: Bandit niveles 4 y 5 (30 min).**

- Conéctate por SSH con los datos de la página de OverTheWire Bandit.
- Antes de buscar, piensa qué comando conocido te ayuda.
- Pista nivel 4: necesitas un comando que diga el *tipo* de un archivo. Pista nivel 5: buscar por tamaño, permisos y si es ejecutable.
- Si te atoras más de 30 minutos, busca la pista conceptual, no la solución.
- Guarda las contraseñas de cada nivel en un archivo local.

### Notas (30 min)

1. Una tabla con 5 procesos de tu VM: nombre, PID, ruta y para qué sirve.
2. Tu SID y qué significa cada parte.
3. Qué grupos tiene tu usuario.
4. Los 5 comandos de Linux y qué aprendiste en Bandit.
5. Una duda que te quedó.

**THM:** *Windows Fundamentals 1* (confirma el nombre actual).

**Lo lograste si:** tienes la VM con snapshot limpio, sabes explicar `whoami /all`, encontraste `System` con PID 4 y al menos 3 procesos legítimos con su ruta, y tienes los niveles 4 y 5 de Bandit encaminados.

=== 1-1-4 ===
@@teoria
### 1. Dirección MAC

Identificador físico de una tarjeta de red. Opera en la **capa 2**. Son 48 bits escritos como 6 pares hexadecimales (`08:00:27:4a:3b:1c`).

- **Primeros 3 bytes (OUI):** identifican al fabricante. Tu VM tendrá el OUI del hipervisor (VirtualBox suele usar `08:00:27`).
- **Últimos 3 bytes:** identifican esa tarjeta.
- Solo sirve **dentro de la red local** y cambia en cada salto: al salir a Internet, la MAC de destino es la de tu **gateway**.
- **Broadcast:** `ff:ff:ff:ff:ff:ff` = «para todos en la red local».
- **Se puede falsificar** (MAC spoofing), así que no prueba identidad.

**IP vs MAC:** la IP dice en qué red estás; la MAC, qué tarjeta eres dentro de la red local.

### 2. Hub, switch y router

| Dispositivo | Capa | Cómo decide |
|---|---|---|
| **Hub** | 1 | Repite todo a todos los puertos |
| **Switch** | 2 | Aprende qué MAC hay en cada puerto y envía solo al destino |
| **Router** | 3 | Usa IPs para enviar entre redes distintas |

### 3. ARP (Address Resolution Protocol)

Tu equipo conoce la IP del destino pero necesita su **MAC** para enviar la trama. ARP traduce IP → MAC en la red local.

1. **ARP Request (broadcast):** «¿Quién tiene 192.168.1.20? Dímelo, soy 192.168.1.50».
2. **ARP Reply (unicast):** el dueño responde con su MAC.
3. Tu equipo guarda la respuesta en su **caché ARP**.

Si el destino está en otra red, tu equipo pregunta por la **MAC del gateway**, no por la del servidor remoto.

**Ver la caché:** `arp -a` (Windows) o `ip neigh` / `arp -a` (Linux).

**Seguridad (importante):**

- ARP **no tiene autenticación**: cualquiera puede responder «esa IP soy yo».
- **ARP spoofing / poisoning:** respuestas ARP falsas para que otros asocien la IP del gateway con la MAC del atacante → **Man-in-the-Middle**.
- **Señales:** una misma IP con dos MACs distintas, muchas respuestas ARP que nadie pidió, IP duplicada.

### 4. TCP vs UDP

Ambos son de **capa 4** y usan **puertos**.

| | **TCP** | **UDP** |
|---|---|---|
| Conexión | Con conexión (handshake) | Sin conexión |
| Fiabilidad | Confirma entrega, reordena y retransmite | No garantiza entrega ni orden |
| Velocidad | Más lento | Más rápido y ligero |
| Usos | HTTP/HTTPS, SSH, correo, SMB, RDP | DNS (normalmente), DHCP, streaming, VoIP |

DNS usa sobre todo UDP/53 pero también TCP/53.

### 5. Handshake de 3 pasos y flags

1. **SYN:** el cliente dice «quiero conectar».
2. **SYN-ACK:** el servidor responde «recibido, yo también».
3. **ACK:** el cliente confirma. Empiezan los datos.

| Flag | Significado |
|---|---|
| **SYN** | Iniciar conexión |
| **ACK** | Confirmar recepción |
| **FIN** | Cerrar de forma ordenada |
| **RST** | Cortar de golpe o rechazar |
| **PSH** | Entregar los datos ya a la aplicación |
| **URG** | Datos urgentes (rara vez) |

**En SOC (lo verás con nmap):** puerto **cerrado** → el servidor responde **RST**. Puerto **abierto** → **SYN-ACK**. Un escaneo se ve como muchos SYN a puertos distintos desde una IP, con muchos RST de vuelta. Si no llega respuesta, el puerto está *filtered* (un firewall).

### 6. Puertos

Un número de 16 bits (0-65535) que identifica **qué servicio** recibe el tráfico. La IP dice «a qué máquina»; el puerto, «a qué servicio».

- **0-1023:** conocidos (*well-known*).
- **1024-49151:** registrados.
- **49152-65535:** efímeros: el cliente elige uno al azar en cada conexión (el rango exacto varía por sistema).

Una conexión se identifica por IP y puerto de origen y destino: `192.168.1.50:51234 → 192.168.1.20:445`. El 51234 es efímero y el 445 es el servicio: «el equipo .50 se conecta por SMB al .20».

**Puertos de memoria:**

| Puerto | Servicio | Nota de seguridad |
|---|---|---|
| 20/21 | FTP | Sin cifrar |
| 22 | SSH | Acceso remoto cifrado; objetivo de fuerza bruta |
| 23 | Telnet | Sin cifrar, casi obsoleto |
| 25 | SMTP | Envío de correo; spam y phishing |
| 53 | DNS | Túneles y exfiltración |
| 67/68 | DHCP | Asignación de IPs |
| 80 | HTTP | Web sin cifrar |
| 110 | POP3 | Correo |
| 143 | IMAP | Correo |
| 443 | HTTPS | Web cifrada; el malware la usa para mezclarse |
| 445 | SMB | Archivos compartidos en Windows |
| 3389 | RDP | Escritorio remoto de Windows |

**Truco:** agrúpalos por función. Correo: 25, 110, 143. Web: 80, 443. Acceso remoto: 22, 23, 3389. Archivos: 20/21, 445. Red: 53, 67/68.

**Empieza por 7:** 22, 53, 80, 443, 25, 445, 3389. Repásalos en los dos sentidos (puerto → servicio y servicio → puerto).

### 7. ¿Por qué 445 y 3389 aparecen tanto en investigaciones?

- **445 (SMB):** vía de movimiento lateral en redes Windows (WannaCry). SMB entre equipos que normalmente no hablan puede ser propagación o robo de archivos.
- **3389 (RDP):** expuesto a Internet recibe fuerza bruta constante y es entrada habitual de ransomware. Muchos incidentes empiezan con un login RDP exitoso tras muchos fallos.

Los dos dan **acceso o control remoto** y aparecen en acceso inicial y movimiento lateral.

### 8. Resumen

| Concepto | Una frase para recordarlo |
|---|---|
| MAC | Identificador de la tarjeta en la red local (capa 2) |
| ARP | Traduce IP → MAC con broadcast y respuesta |
| Switch / Router | Switch usa MAC; router usa IP |
| TCP / UDP | Con conexión y fiable / sin conexión y rápido |
| Handshake | SYN → SYN-ACK → ACK |
| Puerto | Identifica el servicio; 445 y 3389 son muy atacados |

@@practica
Dos bloques de 45 minutos. Añade 10 minutos de flashcards de puertos.

### Bloque 1: Linux (45 min)

| Comando | Para qué sirve | Ejercicio |
|---|---|---|
| `head` | Ver el **inicio** de un archivo | `head /etc/passwd` y `head -n 3 /etc/passwd` |
| `tail` | Ver el **final** | `tail -n 5 /etc/passwd`; prueba `tail -n 20 /var/log/syslog` (o `auth.log`, o `journalctl -n 20`) |
| `tail -f` | Seguir un archivo **en vivo** | `tail -f /var/log/auth.log`; en otra terminal haz `sudo ls`. Sal con `Ctrl+C` |
| `less` | Leer archivos largos | `less /etc/services`; espacio avanza, `b` retrocede, `/ssh` busca, `n` siguiente, `q` sale |
| `file` | Decir **qué tipo** de archivo es | `file /etc/passwd`, `file /bin/ls` |
| `wc` | Contar líneas, palabras y bytes | `wc -l /etc/passwd` |

**Combínalos (10 min):**

1. ¿Cuántas líneas tiene `/etc/services`?
2. Muestra solo las 3 últimas.
3. Dentro de `less /etc/services`, busca el puerto de SSH, HTTPS y SMB (sirve para tus flashcards).
4. `touch prueba.txt`, escribe algo con `nano` y comprueba su tipo con `file`.

**THM:** *Linux Fundamentals Part 1* (10 minutos mínimo; es larga, continúa mañana si hace falta).

### Bloque 2: Red (45 min)

**Paso 1: ARP en las dos máquinas (15 min).** `ip neigh` y `arp -a` en Linux, `arp -a` en Windows. Anota IP, MAC y tipo. Encuentra la MAC de tu gateway y compara el **OUI** con una tabla en línea.

**Paso 2: ARP con Wireshark (10 min).**

1. Empieza a capturar.
2. Limpia la caché: `sudo ip neigh flush all` (Linux) o `arp -d *` como administrador (Windows).
3. Haz `ping` a tu gateway.
4. Filtra con `arp`: verás un Request (broadcast, destino `ff:ff:ff:ff:ff:ff`) y su Reply.

**Paso 3: handshake TCP (15 min).**

1. **Wireshark debe estar en la misma máquina que genera el tráfico.** En Windows usa `curl.exe -I http://example.com` (con `.exe`, porque en PowerShell `curl` es un alias). En Linux, captura con `tcpdump` y abre el `.pcap` en Wireshark.
2. Filtros: `tcp.flags.syn==1`, `tcp.port==80`, `dns`.
3. Localiza el handshake completo (SYN, SYN-ACK, ACK) y anota IPs y puertos.
4. Clic derecho → **Follow → TCP Stream** y lee petición y respuesta.
5. Repite con `https://` y compara: verás el handshake TCP, después TLS (Client Hello, Server Hello, Application Data) y el contenido cifrado. El **SNI** (nombre del servidor) sigue visible en el Client Hello.

**Ojo:** `curl` puede usar **IPv6**. Si filtras solo por IPv4 no verás nada. Usa `tls.handshake.type == 1`, `tcp.port==443` o `ipv6`.

**Paso 4 (5 min):** escribe el socket como `IP_origen:puerto → IP_destino:puerto` y explica en una frase quién inicia y qué servicio usa.

### Notas (30 min)

1. Tu caché ARP (IP, MAC, fabricante).
2. Cómo se ve el ARP Request y el Reply.
3. Captura de pantalla del handshake con los 3 paquetes marcados.
4. Diferencia entre el tráfico por el 80 y por el 443.
5. Qué hace cada comando de Linux de hoy, con un ejemplo propio.
6. Los 7 puertos de memoria.
7. Una duda.

**Lo lograste si:** viste el ARP Request en broadcast y su Reply, identificaste el handshake en tu captura, explicas la diferencia HTTP vs HTTPS en lo que puedes leer y usaste `head`, `tail`, `less`, `file` y `wc` sin mirar la tabla.

=== 1-1-5 ===
@@teoria
### 1. Qué es un SOC

**SOC (Security Operations Center):** el equipo, el proceso y las herramientas que **vigilan, detectan, analizan y responden** a amenazas de seguridad, normalmente de forma continua.

| Pilar | Qué es | Ejemplos |
|---|---|---|
| **Personas** | Analistas y responsables | L1, L2, L3, SOC manager |
| **Procesos** | Cómo se trabaja | Triage, escalamiento, playbooks, reportes |
| **Tecnología** | Con qué se trabaja | SIEM, EDR, firewall, SOAR, threat intelligence |

**Blue Team vs Red Team:** el Blue Team **defiende** (el SOC es su núcleo); el Red Team **simula ataques** para probar las defensas.

### 2. Niveles: L1, L2 y L3

| Nivel | Rol | Qué hace |
|---|---|---|
| **L1** | Triage / monitoreo | Revisa alertas, decide si son falsos positivos o merecen investigarse, documenta y **escala** lo importante |
| **L2** | Análisis e incidentes | Investiga a fondo lo que escala L1, correlaciona, contiene y responde |
| **L3** | Experto / threat hunting | Caza amenazas, análisis avanzado, mejora detecciones, forense y malware |

**Tu trabajo como L1:** ser el primer filtro. Llegan miles de alertas al día y tú decides cuáles son ruido y cuáles son reales, con evidencia, y pasas bien documentado lo importante.

**Lo que se valora en un L1:** curiosidad y método, notas claras que otro analista entienda, saber **cuándo escalar**, y calma con mucho volumen.

### 3. Qué es una alerta

Un aviso que genera una herramienta (SIEM, EDR, antivirus, firewall) cuando algo coincide con una regla o con un comportamiento anómalo. **Una alerta no es un incidente: es una señal que hay que verificar.**

Ejemplos que ya puedes entender: múltiples logins fallidos desde una IP (4625), escaneo de puertos, conexión RDP desde una IP externa (3389), ejecutable corriendo desde una carpeta temporal, usuario añadido a Administrators (4732).

### 4. Ciclo de vida de una alerta

**Detección → Triage → Investigación → Decisión → Cierre o Escalamiento → Documentación**

- **Triage:** ¿qué regla se disparó y por qué? ¿Qué activos están implicados? ¿Qué tan crítico es el activo? ¿Es actividad esperada?
- **Investigación:** evidencia en logs, capturas, procesos, reputación de IPs y dominios.
- **Decisión:** ¿verdadero o falso positivo?
- **Cierre o escalamiento:** falso positivo se cierra con explicación; verdadero positivo se escala a L2 con toda la evidencia.
- **Documentación:** un buen ticket responde qué pasó, a quién afecta, qué evidencia hay, qué conclusión se sacó y qué se hizo.

### 5. Verdadero / falso, positivo / negativo

| | **Hay ataque real** | **No hay ataque real** |
|---|---|---|
| **Sonó la alerta** | **Verdadero positivo (TP)** | **Falso positivo (FP)** |
| **No sonó** | **Falso negativo (FN)** | **Verdadero negativo (TN)** |

- **TP:** 50 logins fallidos por RDP desde una IP externa y luego un login exitoso: fuerza bruta real.
- **FP:** alerta de escaneo que resulta ser el escáner autorizado de TI.
- **FN:** un atacante entra con credenciales robadas válidas y no salta nada.
- **TN:** un empleado inicia sesión a su hora habitual.

El **falso negativo** es el más peligroso, porque nadie se entera. Demasiados falsos positivos causan **fatiga de alertas**.

### 6. Herramientas (solo concepto)

| Herramienta | Qué hace | Analogía |
|---|---|---|
| **SIEM** | Reúne y correlaciona logs de muchas fuentes y genera alertas | El tablero central |
| **EDR** | Vigila y responde en cada equipo | Cámara en cada equipo |
| **SOAR** | Automatiza tareas repetitivas de respuesta | El ayudante de rutina |
| **Firewall / IDS / IPS** | Filtran o detectan tráfico | El guardia de la entrada |
| **Threat intelligence** | Información sobre IPs, dominios y hashes maliciosos | Lista de sospechosos |

### 7. Cómo lo conectas con tu semana

> **Alerta:** «Múltiples logins fallidos seguidos de un login exitoso en `WIN-PC01`».

- **Evento:** 4625 repetidos y luego un 4624. Logon tipo 10 sería RDP.
- **Puerto:** 3389 o 445.
- **Origen:** ¿IP privada o pública? ¿Equipo conocido?
- **Cantidad y tiempo:** 50 fallos en 2 minutos no es un error humano.
- **Éxito posterior:** si hubo 4624, el atacante podría haber entrado.
- **Siguiente paso:** ¿usuario nuevo (4720)? ¿servicio instalado (7045)? ¿procesos nuevos y de qué ruta?
- **Decisión:** probablemente verdadero positivo; escalar a L2 con evidencia.

Eso es pensar como L1: **¿qué evidencia necesito para decidir?**

@@practica
- **Linux:** repaso con Bandit hasta donde llegues.
- **THM (ruta SOC L1):** *Junior Security Analyst Intro* y *SOC Role in Blue Team*.
- **Escribe** media página: «Un día de un analista L1».
- Repasa tus flashcards de puertos (7 primeros) en los dos sentidos.

**Ejercicio de criterio.** Para cada alerta, escribe qué preguntas te harías y si escalarías o cerrarías:

1. «Usuario añadido al grupo Administrators fuera de horario.»
2. «Escaneo de puertos desde una IP interna.»
3. «Login RDP exitoso desde una IP externa tras 40 fallos.»

Una buena respuesta incluye: quién hizo el cambio y a quién añadió, si hay un cambio autorizado, si la hora y el equipo son habituales, qué pasó antes y después, qué privilegios obtiene la cuenta, y **termina con una decisión** (escalar o cerrar).
