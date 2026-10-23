=== 1-5-1 ===
@@teoria
### 1. Qué es investigar un incidente (versión L1)

Investigar es **reunir evidencia para responder cinco preguntas**: qué pasó, quién, cuándo, dónde y cómo. Y terminar con una **decisión** y un **informe** que otra persona pueda entender.

| Pregunta | En un escaneo de red |
|---|---|
| **Qué** | Un escaneo de puertos |
| **Quién** | IP de origen (¿interna o externa? ¿conocida?) |
| **Cuándo** | Hora de inicio y fin |
| **Dónde** | Equipo(s) y puertos escaneados |
| **Cómo** | SYN scan, muchos puertos en pocos segundos |

### 2. Dónde buscar la evidencia de un escaneo

| Fuente | Qué buscar |
|---|---|
| **Captura de red** (Wireshark/tcpdump) | Un origen con muchos SYN a puertos distintos y muchos RST |
| **Firewall** | Muchas conexiones denegadas desde un origen |
| **IDS/IPS** | Alertas de escaneo |
| **Windows** | Con la auditoría de filtrado (Windows Filtering Platform) se registran conexiones bloqueadas (Event ID 5152, 5156); servicios que respondieron |
| **Linux** | `auth.log` con `Connection closed ... [preauth]`, logs del firewall (`ufw`, `iptables`) |

### 3. Estructura de un mini-reporte

```
TÍTULO: Escaneo de puertos contra WIN-LAB (192.168.56.20)

RESUMEN
La IP 192.168.56.10 realizó un escaneo SYN contra 1000 puertos de 192.168.56.20 entre las 20:12:03 y 20:12:09.

LÍNEA DE TIEMPO (hora local, UTC-6)
20:12:03  Primer SYN a puerto 80
20:12:09  Último SYN; 3 puertos abiertos (135, 445, 3389)

EVIDENCIA
- Wireshark: 1000 paquetes SYN iniciales desde .10 en 6 segundos; 997 RST.
- Conversations: .10 → .20 con 1000 conversaciones TCP de 2 paquetes.

CONCLUSIÓN
Verdadero positivo (escaneo de reconocimiento). Origen interno y conocido (mi VM Linux).

IOC
IP origen: 192.168.56.10  Puertos descubiertos: 135, 445, 3389

TÉCNICA (MITRE ATT&CK)
T1046 Network Service Discovery

ACCIÓN
Cerrado como actividad de laboratorio (autorizada).
```

### 4. Bash: lo básico para escribir scripts

Un script de Bash es un archivo de texto con comandos. Empieza con el **shebang**.

```bash
#!/bin/bash
nombre="Ana"
echo "Hola, $nombre"
echo "Primer argumento: $1"
echo "Número de argumentos: $#"
```

- **Ejecutarlo:** `chmod +x script.sh` y `./script.sh argumento`.
- **Variables:** `x="valor"` (sin espacios alrededor del `=`) y se usan como `$x`.
- **Argumentos:** `$1`, `$2`… y `$#` (cuántos). `$0` es el nombre del script.
- **Código de salida:** `$?` (0 = éxito). `exit 1` termina con error.

**Condicionales:**

```bash
if [ -f "$1" ]; then
  echo "El archivo existe"
else
  echo "No existe"
fi
```

| Prueba | Significa |
|---|---|
| `-f archivo` | Es un archivo normal |
| `-d dir` | Es un directorio |
| `-z "$x"` | La cadena está vacía |
| `$a -eq $b` | Números iguales (`-ne`, `-gt`, `-lt`) |
| `"$a" == "$b"` | Cadenas iguales |

### 5. Resumen

| Concepto | Una frase |
|---|---|
| Investigación | Qué, quién, cuándo, dónde, cómo, y una decisión |
| Mini-reporte | Resumen, línea de tiempo, evidencia, conclusión, IOC, técnica, acción |
| Bash | Shebang, variables, `$1`, `if [ ]`, `exit` |

@@practica
### Linux / Bash (45 min)

1. Crea `saludo.sh` con el ejemplo de la teoría. Dale permiso (`chmod +x saludo.sh`) y ejecútalo con y sin argumentos.
2. Escribe `existe.sh`: recibe un archivo como argumento y dice si existe y de qué tipo (archivo o directorio). Si no recibe argumento, imprime un mensaje de uso y sale con `exit 1`.
3. Pruébalo con `./existe.sh /etc/passwd`, `./existe.sh /tmp` y `./existe.sh`.

### Escenario 1: escaneo detectado (45 min)

1. Inicia una captura en la VM víctima (Windows) con Wireshark.
2. Desde Linux: `sudo nmap -sS -sV -p- <IP de Windows>` (todos los puertos; tardará más, es normal).
3. Detén la captura. Reúne evidencia:
   - En **Wireshark:** SYN iniciales, RST y SYN-ACK, y **Conversations → TCP**.
   - En **Windows:** puertos abiertos desde dentro (`Get-NetTCPConnection -State Listen`) y, si activaste la auditoría de filtrado, los eventos de conexión.
4. Escribe el **mini-reporte** con la plantilla de la teoría.

### Notas (30 min)

1. Tu mini-reporte completo.
2. Qué evidencia fue más fácil de encontrar y cuál no estaba disponible.
3. Una duda.

**Lo lograste si:** tu reporte responde qué, quién, cuándo, dónde y cómo, con evidencia concreta de la captura.

=== 1-5-2 ===
@@teoria
### 1. Línea de tiempo (timeline)

Una **línea de tiempo** ordena los eventos por hora y cuenta la historia del incidente. Es la herramienta central del analista.

**Reglas:**

- Usa **una sola zona horaria** (de preferencia UTC) y escríbela.
- Un evento por línea: hora, fuente, qué pasó.
- Ordena de más antiguo a más reciente.
- Distingue **hechos** (lo que dicen los logs) de **hipótesis** (lo que crees).

**Ejemplo de fuerza bruta:**

| Hora (UTC-6) | Fuente | Evento |
|---|---|---|
| 03:12:01 | Security | 4625, tipo 10, `administrator`, IP 203.0.113.45 |
| 03:12:02 a 03:18:50 | Security | 140 eventos 4625 más (usuarios: administrator, admin, soporte) |
| 03:19:07 | Security | 4624, tipo 10, `soporte`, misma IP |
| 03:19:08 | Security | 4672, privilegios especiales para `soporte` |
| 03:21:30 | Security | 4688, `powershell.exe -enc ...` por `soporte` |

### 2. Cuándo escalar

Escala cuando se cumpla **uno o más** de estos criterios:

| Criterio | Ejemplo |
|---|---|
| **Éxito tras los fallos** | 4624 desde la misma IP |
| **Actividad posterior sospechosa** | Procesos raros, cuentas nuevas, servicios, tareas |
| **Activo crítico** | Servidor de dominio, base de datos |
| **Cuenta privilegiada** | Administrador |
| **No puedes descartarlo** | Sin explicación y sin forma de verificar |
| **Fuera de tu alcance o procedimiento** | Se requiere contención |

**Qué debe llevar un escalamiento:** resumen en 2 líneas, línea de tiempo, evidencia con capturas, activos y cuentas afectadas, lo que ya descartaste y lo que **necesitas** del siguiente nivel.

### 3. MITRE ATT&CK de la fuerza bruta

- **T1110** *Brute Force* (.001 adivinanza de contraseñas, .003 *password spraying*).
- **T1078** *Valid Accounts*: cuando el atacante ya usa credenciales válidas.
- **T1021.001** *Remote Services: Remote Desktop Protocol* si entra por RDP.

### 4. Bash: bucles

**`for`:** repite una acción para cada elemento.

```bash
for i in 1 2 3; do
  echo "Vuelta $i"
done

for ip in 192.168.56.{10..14}; do
  ping -c 1 -W 1 "$ip" > /dev/null && echo "$ip responde"
done
```

**`while`:** repite mientras se cumpla una condición, o lee un archivo línea por línea:

```bash
n=1
while [ $n -le 3 ]; do
  echo "n vale $n"
  n=$((n+1))
done

while read -r linea; do
  echo "Línea: $linea"
done < archivo.txt
```

| Elemento | Qué hace |
|---|---|
| `for x in lista; do ... done` | Recorre una lista |
| `{1..5}` | Genera el rango 1,2,3,4,5 |
| `$(( ))` | Aritmética |
| `$( )` | Guarda la salida de un comando: `fecha=$(date)` |
| `&&` / `||` | Ejecuta el siguiente solo si el anterior tuvo éxito / falló |

### 5. Resumen

| Concepto | Una frase |
|---|---|
| Timeline | Una zona horaria, un evento por línea, hechos separados de hipótesis |
| Escalar | Éxito tras fallos, actividad posterior, activo crítico o cuenta privilegiada |
| MITRE | T1110 fuerza bruta, T1078 cuentas válidas |
| Bash | `for` recorre listas, `while` repite con condición |

@@practica
### Linux / Bash (45 min)

1. Escribe `pings.sh` con un `for` que haga ping a 5 IPs de tu red de laboratorio e indique cuáles responden.
2. Escribe un `while` que cuente de 1 a 10 y otro que lea `/etc/passwd` línea por línea y muestre solo el nombre de usuario (`cut -d: -f1`).
3. Prueba `for archivo in /var/log/*.log; do echo "$archivo: $(wc -l < "$archivo") líneas"; done` (con `sudo` si hace falta).

### Escenario 2: fuerza bruta (45 min)

1. En Windows habilita RDP y activa la auditoría de inicios de sesión (la del lunes de la semana 4).
2. Desde otra VM (o desde Linux con `xfreerdp` si lo instalas) haz **15 intentos fallidos** con distintas contraseñas, y termina con **un login exitoso**.
3. Reúne la evidencia:
   - Los 4625 (cantidad, hora de inicio y fin, tipo de logon, IP, usuario).
   - El 4624 y el 4672 posteriores.
4. Construye la **línea de tiempo** con la tabla de la teoría.
5. Escribe el reporte respondiendo: **¿error humano o ataque? ¿escalas? ¿por qué?**

### Notas (30 min)

1. Tu timeline y tu reporte.
2. Tu decisión de escalamiento y los criterios que usaste.
3. Una duda.

**Lo lograste si:** tu reporte distingue error humano de ataque con criterios y justifica si escalarías.

=== 1-5-3 ===
@@teoria
### 1. Persistencia: lo que el atacante hace después de entrar

Una vez dentro, el atacante quiere **seguir dentro**. Tres mecanismos sencillos que ya conoces:

| Mecanismo | Cómo | Evento |
|---|---|---|
| **Cuenta nueva** | Crea un usuario local | **4720** |
| **Privilegios** | La añade a Administrators | **4732** |
| **Tarea programada** | Ejecuta algo al iniciar sesión o cada X minutos | **4698** (y **4688** de `schtasks.exe`) |
| **Servicio** | Instala un servicio que apunta a su programa | **7045** / **4697** |

En MITRE ATT&CK: *Create Account: Local Account* (T1136.001), *Account Manipulation* (T1098), *Scheduled Task* (T1053.005), *Windows Service* (T1543.003).

### 2. Cómo reconocerlo

| Señal | Por qué es sospechosa |
|---|---|
| Cuenta creada fuera de horario o por una cuenta inesperada | Nadie autorizó el cambio |
| Nombre parecido a uno legítimo (`admin1`, `support$`) | Camuflaje |
| Alta en Administrators poco después de crearla | Escalamiento de privilegios |
| Tarea o servicio con ruta en `AppData`, `Temp` o `ProgramData` | Rutas de usuario |
| Comando con `powershell -enc` o `cmd /c` | Ofuscación |
| Todo ocurre **tras un login sospechoso** | Cadena de ataque |

### 3. La cadena completa

```
4625 xN → 4624 → 4672 → 4688 (cmd/powershell) → 4720 → 4732 → 4698 / 7045
```

Cada evento cuenta una parte. Tu trabajo es **unirlos** en una historia.

### 4. Comandos para reproducirlo en tu laboratorio (inofensivos)

En una VM de laboratorio y **como administrador**:

```
net user labtest Clave123! /add
net localgroup administrators labtest /add
schtasks /create /tn "LabTask" /tr "C:\Windows\System32\notepad.exe" /sc onlogon /ru SYSTEM
```

**Limpieza al terminar:**

```
schtasks /delete /tn "LabTask" /f
net user labtest /delete
```

### 5. Bash: un script que analiza un log

**Intenta escribirlo tú primero** (la práctica de hoy lo pide) y compara después:

```bash
#!/bin/bash
# top-ips.sh: muestra las 5 IPs con más intentos fallidos

if [ $# -ne 1 ] || [ ! -f "$1" ]; then
  echo "Uso: $0 archivo_log" >&2
  exit 1
fi

grep "Failed password" "$1" \
  | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' \
  | sort | uniq -c | sort -nr | head -5
```

**Qué hace cada parte:** valida el argumento, filtra las líneas de fallo, extrae las IPs, cuenta, ordena de mayor a menor y deja las 5 primeras.

### 6. Resumen

| Concepto | Una frase |
|---|---|
| Persistencia | Mecanismos para seguir dentro tras un reinicio |
| Cadena | 4624 → 4672 → 4688 → 4720 → 4732 → 4698 / 7045 |
| Señales | Fuera de horario, nombres camuflados, rutas de usuario, comandos ofuscados |
| MITRE | T1136.001, T1098, T1053.005, T1543.003 |

@@practica
### Linux / Bash (45 min)

1. Escribe el script `top-ips.sh` **sin mirar** la solución. Pruébalo con tu `auth.log` (o con un archivo de prueba que generes).
2. Compáralo con el de la teoría. ¿Qué hizo distinto el tuyo?
3. Añade una mejora: que muestre un mensaje si no hay ningún fallo.
4. Súbelo a tu GitHub dentro de `semana-05/` junto con un README.

### Escenario 3: persistencia simple (45 min)

1. En tu VM Windows, **activa las auditorías** necesarias: creación de procesos (con línea de comandos), administración de cuentas y *Other Object Access Events* (para el 4698).
2. Ejecuta los comandos de la teoría (usuario, grupo y tarea).
3. Busca los eventos: 4720, 4732, 4698 y el 4688 de `schtasks.exe`.
4. Escribe la **cadena** como línea de tiempo y la técnica de MITRE de cada paso.
5. **Limpia** el laboratorio con los comandos de limpieza.

### Notas (30 min)

1. Tu timeline y tu reporte de persistencia.
2. Qué auditorías tuviste que activar y por qué.
3. Una duda.

**Lo lograste si:** encuentras los 4 eventos, explicas la cadena con técnicas de MITRE y tu script de Bash funciona.

=== 1-5-4 ===
@@teoria
**Hoy no hay teoría nueva.** Es el día de **refuerzo**: aquí detectas tus huecos y los cierras antes del checkpoint. Esta hoja resume **todo lo que debes saber** del mes 1.

### 1. Método de refuerzo

1. **Revisa** los mini-checkpoints de las semanas 1 a 4: qué respondiste mal.
2. **Agrupa** los errores por tema (redes, Windows, Linux, logs).
3. **Repite** la práctica de ese tema **sin guía**.
4. **Reescribe** de memoria el concepto y compara.

### 2. Hoja de repaso: puertos

| Puerto | Servicio | Puerto | Servicio |
|---|---|---|---|
| 20/21 | FTP | 110 | POP3 |
| 22 | SSH | 143 | IMAP |
| 23 | Telnet | 443 | HTTPS |
| 25 | SMTP | 445 | SMB |
| 53 | DNS | 3389 | RDP |
| 67/68 | DHCP | 80 | HTTP |

### 3. Hoja de repaso: redes

| Tema | Lo esencial |
|---|---|
| OSI | Física, Enlace, Red, Transporte, Sesión, Presentación, Aplicación |
| PDU | Bits, trama, paquete, segmento, datos |
| IPs privadas | 10/8, 172.16/12, 192.168/16 |
| Subred | Bloque = 256 − octeto de máscara; red = múltiplo; broadcast = siguiente − 1 |
| ARP | IP → MAC; Request por broadcast, Reply unicast |
| TCP | SYN → SYN-ACK → ACK; cerrado = RST |
| DNS | A, AAAA, CNAME, MX, TXT, NS, PTR; NXDOMAIN = no existe |
| DHCP | DORA; UDP 67/68 |
| ICMP | Tipo 8 = request, 0 = reply, 11 = time exceeded |
| HTTP | 2xx, 3xx, 4xx, 5xx; HTTPS cifra el contenido pero deja IP, puerto y SNI |

### 4. Hoja de repaso: Windows

| Tema | Lo esencial |
|---|---|
| Procesos | PID, PPID, ruta; `winword.exe` → `powershell.exe` es sospechoso |
| SID | RID 500 = Administrator, 501 = Guest, 1000+ = usuarios |
| Persistencia | Run keys, carpeta de inicio, servicios (7045), tareas (4698) |
| Event IDs | 4624, 4625, 4634, 4672, 4688, 4720, 4732, 7045, 4698, 1102 |
| Logon types | 2 local, 3 red, 10 RDP |

### 5. Hoja de repaso: Linux

| Tema | Comandos |
|---|---|
| Navegar | `pwd`, `ls -la`, `cd`, `find`, `locate` |
| Archivos | `cat`, `head`, `tail`, `less`, `cp`, `mv`, `rm`, `touch`, `mkdir` |
| Texto | `grep`, `cut`, `awk`, `sed`, `sort`, `uniq -c`, `wc -l`, `tr` |
| Permisos | `chmod`, `chown`, `id`, `sudo` |
| Procesos y red | `ps aux`, `top`, `kill`, `ss -tulpn`, `ip a`, `ip route` |
| Servicios y logs | `systemctl`, `journalctl`, `/var/log/auth.log` |

### 6. Hoja de repaso: Wireshark y herramientas

| Herramienta | Qué recordar |
|---|---|
| Filtros | `ip.addr`, `tcp.port`, `dns`, `http`, `tcp.flags.syn == 1 && tcp.flags.ack == 0`, `tls.handshake.type == 1` |
| tcpdump | `-i`, `-nn`, `-w`, `-r` y `host`/`port` |
| nmap | `-sS`, `-sV`, `-p`; open = SYN-ACK, closed = RST, filtered = nada |
| PowerShell | `Get-Process`, `Get-Service`, `Get-NetTCPConnection`, `Get-WinEvent`, `Get-ScheduledTask` |

### 7. Hoja de repaso: SOC

| Tema | Lo esencial |
|---|---|
| Roles | L1 triage, L2 investiga, L3 caza amenazas |
| Alerta | Señal que se verifica; no es lo mismo que un incidente |
| Ciclo | Detección → triage → investigación → decisión → cierre/escalamiento → documentación |
| TP / FP / FN | Alerta correcta / falsa alarma / ataque sin alerta (el más peligroso) |
| Error humano vs ataque | Cantidad, rapidez, cuentas, origen, horario, éxito posterior |

@@practica
### Bloque 1: diagnóstico (45 min)

1. Abre tus 4 mini-checkpoints y cuenta los errores por tema.
2. Haz una tabla: **tema, qué fallaste, qué voy a repetir**.
3. Elige los **3 temas más flojos**.

### Bloque 2: repetir sin guía (60 min)

Para cada tema flojo (20 minutos cada uno):

1. Cierra tus notas y escribe de memoria lo esencial.
2. Compara con la hoja de repaso y corrige.
3. Repite la práctica **sin mirar los pasos** (por ejemplo, el escaneo y su captura, o los 3 eventos de Windows).
4. Reintenta Bandit en el nivel donde te quedaste.

### Bloque 3: flashcards (30 min)

Revisa tus flashcards de puertos, Event IDs, filtros de Wireshark y logon types **en los dos sentidos**.

### Notas

1. La tabla de diagnóstico y lo que repetiste.
2. Los 3 puntos que aún te cuestan.

**Lo lograste si:** tus 3 temas flojos pasaron de «lo reconozco» a «lo recuerdo sin ayuda».

=== 1-5-5 ===
@@teoria
### 1. cron: tareas programadas en Linux

`cron` ejecuta comandos en horarios fijos. Cada usuario tiene su **crontab**.

**Comandos:** `crontab -e` (editar), `crontab -l` (listar), `crontab -r` (borrar todo).

**Formato (5 campos de tiempo + comando):**

```
┌───────── minuto (0-59)
│ ┌─────── hora (0-23)
│ │ ┌───── día del mes (1-31)
│ │ │ ┌─── mes (1-12)
│ │ │ │ ┌─ día de la semana (0-7, 0 y 7 = domingo)
│ │ │ │ │
* * * * *  comando
```

| Ejemplo | Cuándo se ejecuta |
|---|---|
| `0 3 * * *  /home/user/backup.sh` | Todos los días a las 03:00 |
| `*/5 * * * *  /home/user/check.sh` | Cada 5 minutos |
| `30 8 * * 1-5  /home/user/aviso.sh` | A las 08:30, de lunes a viernes |
| `@reboot  /home/user/inicio.sh` | Al arrancar |

**Ubicaciones:** `/var/spool/cron/crontabs/<usuario>` (o `/var/spool/cron/<usuario>`), `/etc/crontab`, `/etc/cron.d/`, `/etc/cron.daily/`.

**Logs:** `journalctl -u cron` (o `-u crond`) o `grep CRON /var/log/syslog`.

**En SOC:** cron es un mecanismo de **persistencia** en Linux (MITRE T1053.003). Revisa entradas nuevas, rutas en `/tmp` o `/dev/shm`, comandos con `curl | bash` o conexiones salientes.

### 2. Git y GitHub: tu portafolio

Un portafolio visible es lo que te diferencia. Estructura recomendada:

```
soc-lab/
├── README.md              ← qué es el proyecto, cómo navegarlo
├── semana-01/
│   ├── diagrama-lab.png
│   └── notas.md
├── semana-03/
│   ├── comandos-powershell.md
│   └── reporte-escaneo.md
├── semana-04/
│   └── comparacion-logs.md
└── semana-05/
    ├── top-ips.sh
    ├── reporte-fuerza-bruta.md
    └── reporte-persistencia.md
```

**Git básico:**

```
git init
git add .
git commit -m "Semana 5: scripts y reportes"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/soc-lab.git
git push -u origin main
```

(En GitHub crea antes el repositorio vacío.)

### 3. Qué NO subir

- **Contraseñas, claves, tokens** ni datos personales.
- **Soluciones y flags** de THM o Bandit (va contra el espíritu de la plataforma y no demuestra nada).
- **PCAPs o muestras de malware** descargados (sube tus notas, hallazgos e IOCs).
- Capturas con IPs públicas o datos reales de terceros.

### 4. Cómo escribir un buen README

1. **Título** y una frase de qué es.
2. **Qué contiene** (índice de carpetas).
3. **Herramientas** usadas.
4. **Cómo reproducirlo** (arquitectura del laboratorio).
5. **Qué aprendí**.

### 5. Cierre del módulo en THM

El **Topic Transition Recap** del módulo *Blue Team Introduction* repasa lo visto en las rooms del módulo. Hazlo sin buscar y apunta lo que fallaste.

### 6. Resumen

| Concepto | Una frase |
|---|---|
| cron | 5 campos de tiempo + comando; persistencia en Linux (T1053.003) |
| `crontab -e` / `-l` | Editar / listar |
| Portafolio | Carpetas por semana, README claro, nada sensible |
| Git | `add`, `commit`, `push` |

@@practica
### Linux (45 min)

1. Crea un script `fecha.sh` que añada la fecha a un archivo (`date >> ~/fechas.txt`) y dale permiso de ejecución.
2. Prográmalo cada minuto con `crontab -e` (`* * * * * /home/tu_usuario/fecha.sh`), espera 3 minutos y comprueba el archivo. **Luego bórralo** con `crontab -e` o `crontab -r`.
3. Busca en el log la ejecución: `journalctl -u cron --since "10 minutes ago"` o `grep CRON /var/log/syslog | tail`.
4. Lista las ubicaciones de cron del sistema (`ls /etc/cron.*`, `cat /etc/crontab`).

### GitHub (30 min)

1. Organiza tu repositorio con la estructura de la teoría.
2. Escribe el README principal con la guía de 5 puntos.
3. Sube el script `top-ips.sh` con un README dentro de `semana-05/`.
4. Revisa que no haya **nada sensible** antes de hacer `push`.

### THM (15 min)

Haz el **Topic Transition Recap** del módulo *Blue Team Introduction* sin buscar.

### Notas (30 min)

1. **Resumen de una página del mes:** qué aprendiste en redes, Windows, Linux y logs.
2. Una lista de tus entregables (diagrama, notas, PowerShell, script, 3 reportes).
3. Una duda para llevar al mes 2.

**Lo lograste si:** tu repositorio está ordenado, sin datos sensibles, con README y tienes el recap de THM hecho.

=== 1-5-6 ===
@@teoria
**Hoy no hay teoría nueva.** Es el **checkpoint final del mes 1**. Sin buscar nada.

### Cómo hacerlo

| Parte | Tiempo | Qué haces |
|---|---|---|
| **Oral** | 30 min | Responde las 10 preguntas de la sección de examen, en voz alta o por escrito |
| **Red** | 45 min | Analizas un PCAP que no hayas visto |
| **Logs** | 45 min | Generas 3 eventos en Windows y los encuentras sin guía |
| **Linux** | 60 min | Cinco retos en la terminal |

### Criterios para aprobar

- **8 de 10** preguntas orales sin buscar.
- El **PCAP** resuelto en menos de **45 minutos**.
- Los **3 eventos de Windows** encontrados sin ayuda.
- **4 de 5** retos de Linux, y el one-liner de IPs funcionando a la primera.

### Si no apruebas

Haz **una semana de refuerzo** del área que falló antes de pasar al mes 2. Es mejor eso que arrastrar huecos: el mes 2 da por hecho que ya dominas lo de este mes.

### Consejos

- Cierra todo lo demás y usa un **temporizador**.
- Si te atoras más de 5 minutos en algo, anótalo y sigue: sirve como diagnóstico.
- Después de terminar, **compara** con tus notas y apunta cada fallo.

@@practica
### Parte oral (30 min)

Responde las 10 preguntas de la sección de examen. Después compara con la respuesta de referencia y cuenta cuántas acertaste.

### Parte práctica de red (45 min)

1. Descarga un PCAP **nuevo** de malware-traffic-analysis.net **dentro de tu VM** (uno que no hayas usado).
2. Encuentra: IPs principales, dominios, protocolos y algo sospechoso.
3. Redacta **10 líneas** de qué crees que pasó.
4. Mide cuánto tardaste: meta, **menos de 45 minutos**.

### Parte de logs (45 min)

Genera **3 eventos distintos** en tu VM Windows (por ejemplo: un 4625, un 4720 y un 4698) y encuéntralos **sin guía** con Event Viewer o PowerShell. Anota para cada uno el ID, la hora y los campos clave.

### Parte de Linux (60 min)

1. Crea un directorio y un archivo con permisos solo para tu usuario.
2. Muestra los puertos en escucha y el proceso que los usa.
3. Dado un log, cuenta las IPs únicas ordenadas por frecuencia.
4. Encuentra los archivos modificados en las últimas 24 horas.
5. Escribe un `for` que haga ping a 5 IPs.

### Cierre

1. Cuenta tus resultados contra los criterios para aprobar.
2. Escribe qué temas te costaron y cómo los reforzarás.
3. Si aprobaste, ¡felicidades! Pasas al **mes 2**.
