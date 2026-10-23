=== 1-3-1 ===
@@teoria
### 1. tcpdump

Captura paquetes desde la **terminal**. Es lo que usarás en servidores Linux, donde no hay interfaz gráfica. Necesita `sudo`.

**Sintaxis básica:** `sudo tcpdump [opciones] [filtro]`

| Opción | Qué hace |
|---|---|
| `-i <interfaz>` | Elige la interfaz (`ip a` o `tcpdump -D` para verlas) |
| `-n` / `-nn` | No resuelve nombres de host / ni de puertos (más rápido y claro) |
| `-c 20` | Se detiene tras 20 paquetes |
| `-w captura.pcap` | **Guarda** en un archivo (para abrirlo en Wireshark) |
| `-r captura.pcap` | **Lee** un archivo guardado |
| `-v` / `-vv` | Más detalle |
| `-A` / `-X` | Muestra el contenido en ASCII / en hex y ASCII |

**Filtros (BPF):**

| Filtro | Significado |
|---|---|
| `host 192.168.1.20` | Tráfico de o hacia esa IP |
| `src host` / `dst host` | Solo origen / solo destino |
| `net 192.168.1.0/24` | Una red completa |
| `port 53` / `portrange 20-25` | Por puerto o rango |
| `tcp`, `udp`, `icmp`, `arp` | Por protocolo |
| `and`, `or`, `not` | Combinar condiciones |

**Ejemplos:**

```
sudo tcpdump -i eth0 -nn host 192.168.1.20
sudo tcpdump -i eth0 -nn port 53
sudo tcpdump -i eth0 -nn 'tcp and port 443' -c 50
sudo tcpdump -i eth0 -w captura.pcap
sudo tcpdump -nn -r captura.pcap 'tcp[tcpflags] & tcp-syn != 0'
```

### 2. nmap

Herramienta de **descubrimiento de hosts y escaneo de puertos**. Es la más usada para reconocimiento, por defensores y por atacantes.

| Opción | Qué hace |
|---|---|
| `-sS` | **SYN scan** (envía SYN y no completa el handshake; requiere root) |
| `-sT` | **Connect scan** (completa el handshake; no requiere root) |
| `-sU` | Escaneo UDP (más lento) |
| `-sV` | Detecta la **versión** del servicio |
| `-O` | Intenta adivinar el sistema operativo |
| `-p 22,80` / `-p 1-1000` / `-p-` | Puertos concretos / un rango / todos (65535) |
| `-Pn` | No hace ping previo; asume que el host está vivo |
| `-sn` | Solo descubrir hosts (ping sweep), sin escanear puertos |
| `-A` | Agresivo: versión, SO y scripts |
| `-T0` a `-T5` | Velocidad (T0 muy lento y sigiloso, T5 muy rápido y ruidoso) |
| `-oN archivo` | Guarda la salida en texto |

**Ejemplos (solo contra tus propias VMs):**

```
nmap 192.168.56.20
sudo nmap -sS -p 1-1000 192.168.56.20
sudo nmap -sS -sV -p 22,80,445,3389 192.168.56.20
nmap -sn 192.168.56.0/24
```

### 3. Estados de puerto

| Estado | Qué significa | Qué responde el equipo |
|---|---|---|
| **open** | Hay un servicio escuchando | SYN-ACK |
| **closed** | Accesible, pero sin servicio | RST |
| **filtered** | Un firewall bloquea; no se sabe | Nada (o un error ICMP) |
| **open\|filtered** | No se puede distinguir (típico en UDP) | Nada |

### 4. Ética y legalidad

**Escanea solo equipos tuyos o con autorización por escrito.** Escanear redes ajenas puede ser ilegal y en un trabajo te puede costar el empleo. En este curso, solo tus VMs en red aislada.

### 5. En SOC

- El escaneo es la fase de **reconocimiento** (primera fase de la Cyber Kill Chain; en MITRE ATT&CK: *Network Service Discovery*, T1046, y *Active Scanning*, T1595).
- Casi siempre es **ruido de Internet**: cualquier equipo expuesto es escaneado constantemente. Lo importante es un escaneo **desde dentro** de la red o seguido de un acceso.
- Los escáneres de vulnerabilidades autorizados (Nessus, Qualys, Nmap de TI) generan **falsos positivos**.

### 6. Resumen

| Concepto | Una frase |
|---|---|
| tcpdump | Captura en terminal; `-w` guarda, `-r` lee |
| BPF | Filtro de captura (`host`, `port`, `tcp`) |
| nmap `-sS` | SYN scan: no completa el handshake |
| `-sV` | Detecta versiones |
| open / closed / filtered | SYN-ACK / RST / sin respuesta |

@@practica
### Linux (45 min)

1. `ps aux` (procesos), `ps aux | grep ssh`, `top` (sal con `q`), `kill <PID>` y `kill -9 <PID>` sobre un proceso de prueba (por ejemplo, `sleep 300 &`).
2. `ss -tulpn`: anota los puertos en escucha y qué proceso los usa.
3. Anota la diferencia entre `kill` (pide que termine) y `kill -9` (lo mata a la fuerza).

### Red (45 min)

1. Averigua tu interfaz con `ip a`.
2. En una terminal: `sudo tcpdump -i <interfaz> -nn -w captura-nmap.pcap`.
3. En otra terminal, escanea tu VM Windows: `sudo nmap -sS -p 1-1000 <IP de Windows>` y luego `sudo nmap -sS -sV -p 135,445,3389 <IP de Windows>`.
4. Detén tcpdump con `Ctrl+C`.
5. Lee la captura en terminal: `sudo tcpdump -nn -r captura-nmap.pcap | head -30`.
6. Anota qué puertos abiertos encontró nmap en Windows y qué servicio es cada uno.
7. **THM (apoyo):** rooms básicas de *tcpdump* y *Nmap* (busca el nombre exacto en THM).

### Notas (30 min)

1. Tabla de opciones de tcpdump y de nmap con una frase propia.
2. Resultado del escaneo: puertos open, closed y filtered.
3. Qué te sorprendió.
4. Una duda.

**Lo lograste si:** capturas con tcpdump, escaneas con nmap y explicas qué significa cada estado de puerto.

=== 1-3-2 ===
@@teoria
### 1. Cómo funciona un SYN scan (`nmap -sS`)

Para cada puerto, nmap envía un **SYN** y mira la respuesta:

| Respuesta del objetivo | Estado | Qué hace nmap |
|---|---|---|
| **SYN-ACK** | open | Envía **RST** para no completar la conexión |
| **RST** (o RST-ACK) | closed | Nada más |
| Nada | filtered | Reintenta una vez y sigue |

Como no completa el handshake, el servicio **no registra la conexión** en sus logs de aplicación (de ahí que se le llame «semiabierto»). Un **connect scan** (`-sT`) sí lo completa y se ve en los logs del servicio.

### 2. Cómo se ve en una captura

**El patrón:**

- **Un solo origen** manda muchísimos **SYN** a **puertos distintos** del mismo destino.
- Todo ocurre en **muy poco tiempo** (cientos o miles de paquetes en segundos).
- De vuelta llegan muchos **RST** (puertos cerrados) y unos pocos **SYN-ACK** (abiertos).
- Los paquetes son **muy parecidos entre sí** (mismo tamaño, mismas opciones, ventana pequeña).
- Los puertos no se recorren en orden: nmap los **aleatoriza** por defecto.

**Filtros de Wireshark para encontrarlo:**

| Filtro | Para qué |
|---|---|
| `tcp.flags.syn == 1 && tcp.flags.ack == 0` | Solo SYN iniciales |
| `tcp.flags.syn == 1 && tcp.flags.ack == 1` | Solo SYN-ACK (puertos abiertos) |
| `tcp.flags.reset == 1` | RST (puertos cerrados) |
| `ip.src == <atacante> && tcp.flags.syn == 1` | SYN de un origen concreto |

**Statistics → Conversations → pestaña TCP**, ordenada por paquetes, muestra de inmediato un origen con cientos de conversaciones de 1 o 2 paquetes.

### 3. Tipos de reconocimiento

| Tipo | Qué es | Cómo se ve |
|---|---|---|
| **Escaneo vertical** | Muchos puertos de **un** host | Un origen, un destino, muchos puertos |
| **Escaneo horizontal** | Un puerto en **muchos** hosts (por ejemplo, el 445 en toda la red) | Un origen, muchos destinos, un puerto |
| **Ping sweep** | Descubrir qué IPs están vivas | Muchos ARP o ICMP Echo Request a una red |
| **Escaneo lento** | Pocas sondas espaciadas en el tiempo para evadir umbrales | Difícil de ver sin correlación a largo plazo |

### 4. Cómo se detecta en un SOC

- **Reglas con umbral:** «más de N puertos distintos desde una IP en X segundos».
- **IDS/IPS** (Snort, Suricata) con firmas de nmap.
- **Logs de firewall:** muchas conexiones denegadas desde un origen.
- **Logs de endpoint:** conexiones rechazadas en un host.

### 5. Triage de una alerta de escaneo

| Pregunta | Por qué |
|---|---|
| ¿El origen es **interno** o **externo**? | Un escaneo interno es más preocupante (equipo comprometido o insider) |
| ¿Es un **escáner autorizado**? (consulta con TI o la lista de escáneres) | Descarta falsos positivos |
| ¿Qué **puertos** tocó? (445, 3389, 22, 1433…) | Indica qué buscaba |
| ¿Hay **respuesta exitosa** a algo? | Ve qué descubrió |
| ¿Hubo **actividad posterior** hacia esos puertos (logins, conexiones SMB/RDP)? | El escaneo suele ser el primer paso |
| ¿Se repite o es un solo evento? | Persistencia del atacante |

**Decisión típica:** externo sin actividad posterior → bajo, se documenta (y quizá se bloquea la IP). Interno no autorizado o con actividad posterior → **se escala**.

### 6. Resumen

| Concepto | Una frase |
|---|---|
| SYN scan | SYN → SYN-ACK (abierto, nmap envía RST) o RST (cerrado) |
| Patrón | Un origen, muchos puertos, muy rápido, muchos RST |
| Vertical vs horizontal | Muchos puertos de un host / un puerto de muchos hosts |
| Triage | ¿Interno o externo? ¿Autorizado? ¿Actividad posterior? |

@@practica
### Linux (45 min)

1. `systemctl status ssh` (o `sshd` según tu distro), `sudo systemctl stop ssh`, `sudo systemctl start ssh`, `sudo systemctl enable ssh` (arranca con el sistema).
2. `systemctl list-units --type=service --state=running | head -20`.
3. `journalctl -u ssh --since "10 minutes ago"` y `journalctl -n 30`.
4. **Bandit niveles 11 y 12** (en el 11 es un cifrado de rotación de letras, `tr`; el 12 es un volcado hexadecimal comprimido varias veces: `xxd -r`, `file` y las herramientas de descompresión).

### Red (45 min)

1. Abre en Wireshark la captura de ayer (`captura-nmap.pcap`).
2. Aplica `tcp.flags.syn == 1 && tcp.flags.ack == 0` y mira cuántos paquetes hay (barra de estado).
3. Aplica `tcp.flags.syn == 1 && tcp.flags.ack == 1` y anota **qué puertos** respondieron SYN-ACK (los abiertos). ¿Coinciden con lo que dijo nmap?
4. Aplica `tcp.flags.reset == 1` y observa los RST.
5. **Statistics → Conversations → TCP**: ordena por paquetes y comprueba el patrón de un origen con cientos de conversaciones cortas.
6. Escribe **tres características** que te permitirían reconocer este escaneo aunque no supieras que fuiste tú.

### Notas (30 min)

1. Las tres características del escaneo con evidencia de tu captura.
2. Tabla: puerto, estado y servicio.
3. Cómo cambiaría el patrón si fuera un escaneo horizontal.
4. Una duda.

**Lo lograste si:** identificas el escaneo en la captura y explicas por qué lo reconocerías sin saber que fuiste tú.

=== 1-3-3 ===
@@teoria
### 1. El registro de Windows

Base de datos jerárquica donde Windows y las aplicaciones guardan su configuración. Se organiza en **claves** (como carpetas) y **valores** (nombre, tipo y dato).

| Hive | Abreviatura | Contiene |
|---|---|---|
| `HKEY_LOCAL_MACHINE` | **HKLM** | Configuración del equipo (todos los usuarios) |
| `HKEY_CURRENT_USER` | **HKCU** | Configuración del usuario que inició sesión |
| `HKEY_CLASSES_ROOT` | HKCR | Asociaciones de archivos y objetos |
| `HKEY_USERS` | HKU | Perfiles de todos los usuarios |
| `HKEY_CURRENT_CONFIG` | HKCC | Perfil de hardware actual |

**Tipos de valor comunes:** `REG_SZ` (texto), `REG_DWORD` (número de 32 bits), `REG_BINARY`, `REG_MULTI_SZ`.

**Herramientas:** `regedit` (gráfica), `reg query <clave>` (CMD), `Get-ItemProperty` (PowerShell).

### 2. Dónde se esconde la persistencia en Windows

La **persistencia** es lo que permite a un atacante seguir dentro tras un reinicio. Los lugares clásicos:

| Lugar | Ruta | Notas |
|---|---|---|
| **Claves Run** (equipo) | `HKLM\Software\Microsoft\Windows\CurrentVersion\Run` y `RunOnce` | Se ejecutan al iniciar sesión cualquier usuario; requiere admin para escribir |
| **Claves Run** (usuario) | `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` | **No requiere admin**; muy usada por malware |
| **Carpeta de inicio** | `shell:startup` o `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp` | Cualquier acceso directo o script ahí se ejecuta |
| **Servicios** | `HKLM\SYSTEM\CurrentControlSet\Services` | Event ID 7045 al instalarlos |
| **Tareas programadas** | `C:\Windows\System32\Tasks` | Event ID 4698 |
| **Winlogon** | `HKLM\Software\Microsoft\Windows NT\CurrentVersion\Winlogon` (`Shell`, `Userinit`) | Si se modifican, se ejecuta otro programa al iniciar sesión |

En MITRE ATT&CK: *Registry Run Keys / Startup Folder* (T1547.001), *Windows Service* (T1543.003), *Scheduled Task* (T1053.005).

### 3. Cómo inspeccionarlos

```
reg query HKCU\Software\Microsoft\Windows\CurrentVersion\Run
reg query HKLM\Software\Microsoft\Windows\CurrentVersion\Run
```

En PowerShell:

```
Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
Get-CimInstance Win32_StartupCommand | Select-Object Name,Command,Location,User
Get-Service | Where-Object Status -eq 'Running'
Get-ScheduledTask | Where-Object State -ne 'Disabled'
```

**Autoruns (Sysinternals, de Microsoft):** muestra **todos** los puntos de inicio automático de una vez. Es una de las herramientas más usadas para buscar persistencia. Descárgala del sitio oficial de Microsoft.

**Qué buscar:** nombres aleatorios o que imitan a los legítimos, rutas en `AppData`, `Temp`, `ProgramData` o `Downloads`, comandos con `powershell -enc`, `cmd /c`, `mshta`, y entradas **recientes**.

### 4. El equivalente en Linux

| Mecanismo | Dónde |
|---|---|
| Servicios (systemd) | `/etc/systemd/system/`, `systemctl list-unit-files` |
| Cron | `/etc/crontab`, `/etc/cron.d/`, `crontab -l` |
| Scripts de inicio de sesión | `~/.bashrc`, `~/.profile` |
| Claves SSH | `~/.ssh/authorized_keys` (un atacante añade su clave) |
| Inicio clásico | `/etc/rc.local` |

### 5. SSH (Secure Shell)

Acceso remoto cifrado a una máquina Linux, puerto **22**.

| Comando | Para qué |
|---|---|
| `ssh usuario@ip` | Conectarte |
| `ssh -p 2220 usuario@host` | Con otro puerto (Bandit) |
| `scp archivo usuario@ip:/ruta` | Copiar un archivo al servidor |
| `scp usuario@ip:/ruta/archivo .` | Copiar un archivo desde el servidor |
| `ssh-keygen` | Crear un par de claves |

- **Autenticación:** con contraseña o con **clave pública** (más segura).
- Al conectar por primera vez verás la **huella** del servidor; se guarda en `~/.ssh/known_hosts`.
- **Instalar el servidor en tu VM:** `sudo apt install openssh-server` y `sudo systemctl enable --now ssh`.
- Windows 10/11 incluye cliente `ssh`.

**En SOC:** SSH expuesto recibe fuerza bruta constante y se usa para movimiento lateral; los logins quedan en `auth.log`.

### 6. Resumen

| Concepto | Una frase |
|---|---|
| Registro | Claves y valores; HKLM (equipo) y HKCU (usuario) |
| Claves Run | Programas que arrancan al iniciar sesión; HKCU no requiere admin |
| Autoruns | Muestra todos los puntos de inicio automático |
| Persistencia Linux | systemd, cron, `.bashrc`, `authorized_keys` |
| SSH | Acceso remoto cifrado, puerto 22 |

@@practica
### Linux (45 min)

1. `sudo apt update` y `sudo apt install openssh-server`. Verifica con `systemctl status ssh`.
2. Anota la IP de la VM Linux (`ip a`).
3. **Desde Windows** (PowerShell o CMD): `ssh tu_usuario@<IP de Linux>`. Acepta la huella y entra.
4. Ya dentro, ejecuta `whoami`, `hostname` y `ip a`. Sal con `exit`.
5. Copia un archivo: crea `nota.txt` en Windows y envíalo con `scp nota.txt tu_usuario@<IP de Linux>:~/`. Compruébalo en Linux.
6. **THM (apoyo):** *Linux Fundamentals Part 3*.

### Windows (45 min)

1. `reg query HKCU\Software\Microsoft\Windows\CurrentVersion\Run` y la de HKLM. Anota lo que haya.
2. **Crea una entrada de prueba inofensiva** en HKCU Run y observa dónde queda:
   `reg add HKCU\Software\Microsoft\Windows\CurrentVersion\Run /v PruebaLab /t REG_SZ /d "C:\Windows\System32\notepad.exe"`
   Cierra sesión y vuelve a entrar: debería abrirse el Bloc de notas. **Bórrala al terminar:**
   `reg delete HKCU\Software\Microsoft\Windows\CurrentVersion\Run /v PruebaLab /f`
3. `Get-Service | Where-Object Status -eq 'Running'` y `Get-ScheduledTask | Where-Object State -ne 'Disabled'`. Anota 3 servicios y 3 tareas que no conozcas e investiga qué son.
4. Descarga **Autoruns** del sitio oficial de Microsoft (Sysinternals) dentro de la VM, ábrelo y revisa la pestaña *Logon* y *Services*.

### Notas (30 min)

1. Tabla de los 6 lugares de persistencia de Windows de memoria.
2. Cómo hiciste tu entrada de prueba y cómo la borraste.
3. Tu conexión SSH: comando, huella y qué viste.
4. Una duda.

**Lo lograste si:** te conectas por SSH entre VMs, creas y borras una entrada Run y explicas por qué HKCU no requiere administrador.

=== 1-3-4 ===
@@teoria
### 1. Qué es PowerShell

Intérprete de comandos y lenguaje de scripting de Microsoft. Trabaja con **objetos** (no solo texto), lo que lo hace muy potente. Para un analista es doble importancia: **lo usarás** para investigar y **los atacantes lo usan** (es un «LOLBin»: herramienta legítima que se abusa).

### 2. Cmdlets: Verbo-Sustantivo

Los comandos se llaman **cmdlets** y siguen el patrón `Verbo-Sustantivo`: `Get-Process`, `Stop-Service`, `Set-Item`, `New-LocalUser`. Los verbos comunes son `Get` (consultar), `Set` (cambiar), `New` (crear), `Remove` (borrar), `Start`/`Stop`.

**Para descubrir:**

| Comando | Qué hace |
|---|---|
| `Get-Command *service*` | Busca comandos por nombre |
| `Get-Help Get-Process -Examples` | Ayuda con ejemplos |
| `Get-Process | Get-Member` | Qué propiedades y métodos tienen los objetos |
| `Get-Verb` | Lista los verbos aprobados |

### 3. Pipeline y objetos

El pipe `|` pasa los **objetos** de un cmdlet al siguiente.

| Cmdlet | Alias | Para qué |
|---|---|---|
| `Where-Object` | `?` | Filtrar |
| `Select-Object` | `select` | Elegir propiedades o las primeras N |
| `Sort-Object` | `sort` | Ordenar |
| `Group-Object` | `group` | Agrupar y contar |
| `Measure-Object` | `measure` | Contar o sumar |
| `ForEach-Object` | `%` | Repetir una acción por objeto |
| `Format-Table` / `Format-List` | `ft` / `fl` | Mostrar como tabla o lista |
| `Export-Csv` / `Out-File` | | Guardar resultados |

**Comparadores:** `-eq`, `-ne`, `-gt`, `-lt`, `-like` (con `*`), `-match` (regex), `-contains`.

**Ejemplo:** `Get-Service | Where-Object Status -eq 'Running' | Sort-Object Name | Select-Object -First 5`

### 4. Los 15 comandos del día

| # | Comando | Qué hace |
|---|---|---|
| 1 | `Get-Process | Sort-Object CPU -Descending | Select-Object -First 5` | Los 5 procesos que más CPU usan |
| 2 | `Get-Service | Where-Object Status -eq 'Running'` | Servicios en ejecución |
| 3 | `Get-LocalUser` | Usuarios locales |
| 4 | `Get-LocalGroupMember -Group Administrators` | Miembros del grupo Administrators |
| 5 | `Get-NetTCPConnection -State Established` | Conexiones TCP establecidas, con puertos y proceso (`OwningProcess`) |
| 6 | `Get-NetIPConfiguration` | IP, gateway y DNS |
| 7 | `Get-ChildItem C:\Users -Recurse -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 10` | Los 10 archivos modificados más recientemente |
| 8 | `Get-Content .\archivo.txt -Tail 20` | Últimas 20 líneas (como `tail`) |
| 9 | `Select-String -Path .\log.txt -Pattern "error"` | Buscar texto (como `grep`) |
| 10 | `Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} -MaxEvents 10` | Últimos 10 logins fallidos |
| 11 | `Get-ScheduledTask | Where-Object State -ne 'Disabled'` | Tareas programadas activas |
| 12 | `Get-CimInstance Win32_Process | Select-Object Name,ProcessId,ParentProcessId,ExecutablePath` | Procesos con su padre y ruta |
| 13 | `Get-FileHash .\archivo.exe -Algorithm SHA256` | Hash de un archivo (para buscar en VirusTotal) |
| 14 | `Test-NetConnection 192.168.56.10 -Port 22` | Comprobar si un puerto responde |
| 15 | `Resolve-DnsName example.com -Type MX` | Consulta DNS por tipo |

### 5. Política de ejecución

`Get-ExecutionPolicy` muestra qué scripts se permiten (`Restricted`, `RemoteSigned`, `Unrestricted`…). **No es una medida de seguridad:** se puede saltar con `-ExecutionPolicy Bypass`, y los atacantes lo hacen siempre.

### 6. PowerShell y seguridad

**Indicadores en la línea de comandos de un proceso `powershell.exe`:**

| Indicador | Qué sugiere |
|---|---|
| `-EncodedCommand` o `-enc` | Comando en base64 para ocultarlo |
| `-NoProfile`, `-WindowStyle Hidden`, `-NonInteractive` | Ejecución silenciosa |
| `-ExecutionPolicy Bypass` | Saltar la política de ejecución |
| `IEX` / `Invoke-Expression` | Ejecutar texto como código |
| `DownloadString`, `Invoke-WebRequest`, `curl`, `wget` | Descargar algo de Internet |
| `FromBase64String` | Decodificar contenido oculto |

**Padre sospechoso:** `winword.exe`, `excel.exe` o `outlook.exe` lanzando `powershell.exe`.

**Dónde queda registrado** (varios requieren habilitar la auditoría):

| Fuente | Qué registra |
|---|---|
| Event ID **4688** (con línea de comandos) | Creación de procesos con sus parámetros |
| Event ID **4104** (Script Block Logging) | El **contenido** de los scripts ejecutados |
| Event ID **4103** (Module Logging) | Ejecución de cmdlets |
| Sysmon, Event ID 1 | Creación de procesos con hashes y padre |
| `ConsoleHost_history.txt` | Historial de comandos del usuario |

En MITRE ATT&CK: *Command and Scripting Interpreter: PowerShell* (T1059.001).

### 7. Resumen

| Concepto | Una frase |
|---|---|
| Cmdlet | Verbo-Sustantivo; objetos que pasan por el pipeline |
| `Where-Object` / `Select-Object` / `Sort-Object` | Filtrar / elegir / ordenar |
| `Get-NetTCPConnection` | Conexiones con puerto y proceso |
| `Get-WinEvent` | Leer logs de eventos |
| `-enc`, `IEX`, `DownloadString` | Indicadores de PowerShell malicioso |
| 4104 | Contenido de scripts (requiere auditoría) |

@@practica
### Linux (45 min)

1. `scp archivo usuario@ip:/ruta` y `scp usuario@ip:/ruta/archivo .` entre tus dos VMs.
2. `curl -s https://example.com | head` y `curl -I https://example.com`.
3. **Bandit niveles 13, 14 y 15:** el 13 usa una clave privada SSH (`ssh -i`), el 14 envía la contraseña al puerto 30000 con `nc` (`nc localhost 30000`) y el 15 usa SSL (`openssl s_client`). Si te atoras, busca la pista conceptual.

### Windows (45 min)

Ejecuta los **15 comandos** de la tabla de la teoría en PowerShell. Para cada uno:

1. Ejecútalo y anota **qué muestra**.
2. Modifícalo (cambia un filtro, ordena distinto) y comprueba qué cambia.
3. Guárdalos en un archivo `comandos-powershell.md` con **tu descripción** de cada uno.

Reto: combina varios en uno. Por ejemplo, lista las conexiones establecidas y busca el nombre del proceso de cada una:

`Get-NetTCPConnection -State Established | ForEach-Object { $p = Get-Process -Id $_.OwningProcess; "$($_.RemoteAddress):$($_.RemotePort) -> $($p.ProcessName)" }`

**THM (apoyo):** la room básica de PowerShell.

### Notas (30 min)

1. Tabla de los 15 comandos con tus palabras.
2. Cómo funciona el pipeline con un ejemplo propio.
3. Los 5 indicadores de PowerShell malicioso.
4. Una duda.

**Lo lograste si:** ejecutas los 15 comandos sin mirar la tabla y combinas dos con un pipeline.

=== 1-3-5 ===
@@teoria
**Room de la ruta SOC L1 de hoy:** *Humans as Attack Vectors*. La teoría de hoy te da el marco; en la room verás los ejemplos.

### 1. Por qué se ataca a las personas

Es más fácil engañar a una persona que romper un sistema bien configurado. La **ingeniería social** manipula la psicología humana para conseguir acceso, credenciales o dinero.

**Palancas psicológicas que usan los atacantes:**

| Palanca | Ejemplo |
|---|---|
| **Urgencia** | «Tu cuenta se bloqueará en 1 hora» |
| **Autoridad** | Un correo que parece del director o de TI |
| **Miedo** | «Detectamos un acceso sospechoso» |
| **Curiosidad o recompensa** | «Ganaste un premio», «Mira esta factura» |
| **Confianza o familiaridad** | Mensaje de un compañero o proveedor conocido |

### 2. Tipos de ataques contra personas

| Ataque | Qué es |
|---|---|
| **Phishing** | Correos masivos que simulan ser de una entidad legítima |
| **Spear phishing** | Phishing dirigido a una persona concreta, con datos reales |
| **Whaling** | Spear phishing contra directivos |
| **Smishing / Vishing** | Por SMS / por llamada telefónica |
| **Quishing** | Códigos QR maliciosos |
| **BEC** (Business Email Compromise) | Suplantar a un ejecutivo o proveedor para pedir pagos o datos |
| **Pretexting** | Inventar una historia creíble para obtener información |
| **Baiting** | Dejar un cebo (USB, descarga gratis) |
| **Tailgating** | Entrar a un edificio pegado a alguien autorizado |
| **Credential stuffing** | Probar credenciales filtradas de otras brechas |
| **MFA fatigue** | Bombardear con notificaciones de MFA hasta que el usuario acepte |

### 3. Anatomía de un phishing

1. **Reconocimiento:** el atacante investiga a la víctima (LinkedIn, sitio web).
2. **Señuelo:** envía el correo o mensaje.
3. **Acción de la víctima:** abre un enlace, un adjunto o responde.
4. **Explotación:** se roban credenciales (página falsa) o se ejecuta malware.
5. **Acceso:** el atacante entra y avanza (persistencia, movimiento lateral).

En MITRE ATT&CK: *Phishing* (T1566) dentro de *Initial Access*.

### 4. Señales de un correo sospechoso

- Remitente con dominio **parecido** al real (`m1crosoft.com`) o con nombre visible que no coincide con la dirección.
- Urgencia, amenaza o premio.
- Enlaces cuyo texto muestra un dominio y cuyo destino real es otro.
- **Adjuntos de riesgo:** documentos con macros (`.docm`, `.xlsm`), `.html`, `.iso`, `.lnk`, ZIP con contraseña.
- Solicitud de **credenciales**, códigos MFA, transferencias o datos personales.
- Saludo genérico, faltas o tono raro.

### 5. Qué evidencia deja en un SOC

| Fuente | Qué puedes ver |
|---|---|
| Pasarela de correo | Remitente, destinatarios, asunto, adjuntos, resultado de SPF/DKIM/DMARC |
| DNS y proxy | Quién visitó el dominio del enlace y cuándo |
| EDR | `winword.exe` → `powershell.exe`, descargas, ejecuciones |
| Registros de autenticación | Inicios de sesión desde IPs o países inusuales tras el clic |
| Reglas del buzón | Reglas de reenvío creadas por el atacante |
| Reportes de usuarios | El botón «Reportar phishing» |

### 6. Cómo ayuda el SOC a defender a las personas

- **Prevención:** filtros de correo, SPF/DKIM/DMARC, **MFA**, bloqueo de dominios y adjuntos peligrosos.
- **Concienciación:** simulacros de phishing y capacitación.
- **Detección:** analizar correos reportados, buscar a otros destinatarios del mismo mensaje y a quién hizo clic.
- **Respuesta:** bloquear dominio y remitente, restablecer contraseñas, revocar sesiones, aislar equipos, eliminar el correo de todos los buzones.

(El análisis detallado de correos lo harás en el mes 4.)

### 7. Resumen

| Concepto | Una frase |
|---|---|
| Ingeniería social | Manipular personas para obtener acceso |
| Phishing vs spear phishing | Masivo vs dirigido |
| BEC | Suplantar a un directivo o proveedor para pedir pagos |
| Señales | Remitente raro, urgencia, enlace engañoso, adjunto de riesgo |
| Defensa | MFA, filtros, concienciación, reporte rápido |

@@practica
### Linux (45 min)

1. **Repite Bandit 0-5 sin mirar tus notas.** Cuenta cuántos niveles resuelves sin ayuda y en cuánto tiempo.
2. Anota los comandos que tuviste que buscar otra vez: esos son tus huecos.
3. Practica `find`, `grep`, `file`, `cat` y `ls -la` sobre `/etc` y `/var/log` durante 15 minutos.

### Ruta SOC L1 (45 min)

1. **THM:** *Humans as Attack Vectors*. Léela con calma y resuelve las preguntas.
2. Mientras la haces, anota: tipos de ataque, ejemplos y qué puede hacer el SOC.

### Ejercicio de criterio (parte de tus notas)

Escribe 5 líneas respondiendo: **¿qué ataque contra personas verías en un SOC y qué evidencia dejaría?** Elige uno (por ejemplo, phishing con adjunto de Word) y sigue su rastro: correo → usuario → proceso en el equipo → conexión de red → qué alerta se generaría.

Prueba ahora con otro ataque (MFA fatigue o BEC) y escribe qué logs lo mostrarían.

### Notas (30 min)

1. Tabla de 5 tipos de ataque con un ejemplo cada uno.
2. Las palancas psicológicas con tu propio ejemplo.
3. Lo que aprendiste en la room.
4. Una duda.

**Lo lograste si:** explicas con tus palabras un ataque a personas y la evidencia que dejaría.

=== 1-3-6 ===
@@teoria
**Hoy no hay teoría nueva.** Es el sábado de laboratorio. Dedica 10 minutos a releer tus notas de tcpdump, nmap, SYN scan, registro y persistencia, SSH, PowerShell e ingeniería social.

### Qué vas a hacer

Escanear las dos VMs, comparar lo que ve nmap con lo que muestra cada sistema por dentro, y encontrar el patrón del escaneo en la captura.

### Qué esperar al escanear

| Máquina | Puertos que podrías ver abiertos | Nota |
|---|---|---|
| Linux | 22 (SSH) si lo instalaste | Un servidor mínimo tiene muy pocos |
| Windows | 135, 139, 445 y, si lo habilitaste, 3389 | El firewall de Windows puede mostrar muchos puertos como filtered |

**Compara siempre dos puntos de vista:** lo que nmap ve **desde fuera** y lo que `ss -tulpn` (Linux) o `Get-NetTCPConnection -State Listen` (Windows) dicen **desde dentro**. Las diferencias suelen deberse al firewall.

### Reparto de las 3 horas

1. **Hora 1:** escanear y capturar.
2. **Hora 2:** analizar la captura y comparar con el estado interno.
3. **Hora 3:** documentar, subir a GitHub y mini-checkpoint.

@@practica
### Hora 1: escanear y capturar

1. En la VM que lanza el escaneo (Linux), inicia `sudo tcpdump -i <interfaz> -nn -w semana3-scan.pcap`.
2. Escanea Windows: `sudo nmap -sS -sV -p 1-1000 <IP de Windows>`. Guarda la salida con `-oN windows-scan.txt`.
3. Escanea Linux (desde Windows con nmap instalado, o desde otra VM): `nmap -sS -sV -p 1-1000 <IP de Linux>`.
4. Detén tcpdump.

### Hora 2: analizar y comparar

1. Abre `semana3-scan.pcap` en Wireshark.
2. Aplica `tcp.flags.syn == 1 && tcp.flags.ack == 0`, `tcp.flags.syn == 1 && tcp.flags.ack == 1` y `tcp.flags.reset == 1`. Anota cuántos paquetes hay de cada tipo.
3. **Statistics → Conversations → TCP** y comprueba el patrón.
4. Dentro de cada VM, compara: `ss -tulpn` (Linux) y `Get-NetTCPConnection -State Listen` (Windows). ¿Coinciden con los puertos abiertos que vio nmap? ¿Qué puertos aparecen como filtered y por qué?
5. Prueba también un escaneo **lento** (`-T1` en solo 20 puertos) y comprueba cómo cambia el patrón en la captura.

### Hora 3: documentar

1. Escribe un mini-reporte «Escaneo de red» con: qué pasó, quién (IP origen), cuándo (hora), a quién, qué puertos y cómo lo detectaste.
2. Sube a GitHub (carpeta `semana-03`): tus **15 comandos de PowerShell** con descripción, el reporte y tus notas.
3. Responde el **mini-checkpoint de la semana 3** (sección de examen).

**Lo lograste si:** tienes el reporte del escaneo con evidencia de la captura y tus 15 comandos de PowerShell en GitHub.
