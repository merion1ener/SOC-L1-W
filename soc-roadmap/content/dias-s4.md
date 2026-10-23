=== 1-4-1 ===
@@teoria
Esta es la semana **más importante para SOC**: aprender a leer logs. Hoy empiezas con el visor de eventos de Windows.

### 1. Event Viewer

Se abre con `eventvwr.msc`. Los registros están organizados así:

| Registro | Qué contiene |
|---|---|
| **Security** | Auditoría: inicios de sesión, cuentas, permisos, procesos (el más importante para SOC) |
| **System** | Sistema y servicios (por ejemplo, instalación de servicios) |
| **Application** | Aplicaciones |
| **Setup** | Instalaciones y actualizaciones |
| **Forwarded Events** | Eventos recibidos de otros equipos |
| **Applications and Services Logs** | Registros específicos: `Microsoft-Windows-PowerShell/Operational`, `Sysmon/Operational`, `TaskScheduler/Operational`… |

**Campos de un evento:** Log Name, Source, **Event ID**, Level (Information, Warning, Error, Critical, Audit Success o Audit Failure), Date and Time, User, Computer, Task Category y el **cuerpo** con los datos (`EventData`; la pestaña *Details → XML View* los muestra todos).

**Filtrar:** `Filter Current Log...` (por ID, nivel o fecha) o `Create Custom View`.

**Desde la línea de comandos:**

```
wevtutil qe Security /q:"*[System[(EventID=4625)]]" /c:5 /rd:true /f:text
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624,4625} -MaxEvents 20
```

### 2. Los Event IDs que debes conocer

**Autenticación y sesiones**

| ID | Significado |
|---|---|
| **4624** | Inicio de sesión **exitoso** |
| **4625** | Inicio de sesión **fallido** |
| **4634** | Cierre de sesión |
| **4647** | Cierre de sesión iniciado por el usuario |
| **4648** | Inicio de sesión con **credenciales explícitas** (por ejemplo, `runas`) |
| **4672** | Se asignaron **privilegios especiales** a un nuevo inicio de sesión |
| **4740** | Cuenta **bloqueada** |

**Cuentas y grupos**

| ID | Significado |
|---|---|
| **4720** | Cuenta de usuario **creada** |
| **4722** | Cuenta habilitada |
| **4724** | Intento de **restablecer la contraseña** de una cuenta |
| **4726** | Cuenta eliminada |
| **4732** | Miembro **añadido a un grupo local** (por ejemplo, Administrators) |

**Procesos, servicios y tareas**

| ID | Significado |
|---|---|
| **4688** | Se creó un **proceso** (requiere habilitar la auditoría) |
| **4697** / **7045** | Se instaló un **servicio** (Security / System) |
| **4698** | Se creó una **tarea programada** |

**Evasión y otros**

| ID | Significado |
|---|---|
| **1102** | Se **borró el registro de auditoría** (Security) |
| **104** | Se borró un registro del sistema |
| **4104** | Contenido de un script de PowerShell (requiere habilitar) |

### 3. Auditoría: no todo se registra por defecto

La directiva **Advanced Audit Policy** (`secpol.msc` → Configuración de directiva de auditoría avanzada) decide qué se registra.

- **4688** requiere *Audit Process Creation*. Para ver la **línea de comandos** hay que habilitar también *Include command line in process creation events* (directiva de grupo: Plantillas administrativas → Sistema → Auditoría de creación de procesos).
- **4698** requiere auditar *Other Object Access Events*.
- **4104** requiere habilitar *Script Block Logging*.

**En una empresa:** el equipo de seguridad configura esto por GPO. En tu VM, tendrás que activarlo tú.

### 4. Cómo leer un 4625 (logon fallido)

Campos clave:

| Campo | Qué dice |
|---|---|
| **Subject** | Quién reporta el evento (normalmente el sistema) |
| **Account For Which Logon Failed → Account Name** | La cuenta que se intentó usar |
| **Logon Type** | Cómo intentaba entrar (2, 3, 10…) |
| **Failure Reason / Status / Sub Status** | Por qué falló |
| **Source Network Address** | IP de origen |
| **Workstation Name** | Nombre del equipo de origen (si lo envía) |

**Códigos de `Sub Status` habituales:** `0xC0000064` = el usuario **no existe**; `0xC000006A` = usuario correcto, **contraseña incorrecta**; `0xC0000234` = cuenta bloqueada.

### 5. Cómo leer un 4624 (logon exitoso)

Campos clave: **Logon Type**, **New Logon → Account Name** y **Logon ID** (identifica la sesión), **Source Network Address**, Process Name. Si el siguiente evento es un **4672**, la cuenta tiene privilegios elevados.

### 6. Resumen

| Concepto | Una frase |
|---|---|
| Security | El registro de auditoría; el más importante |
| 4624 / 4625 | Login exitoso / fallido |
| 4720 / 4732 | Usuario creado / añadido a un grupo |
| 4688 | Proceso creado (requiere auditoría) |
| 7045 / 4698 | Servicio instalado / tarea creada |
| 1102 | Log de auditoría borrado (sospechoso) |

@@practica
### Linux (45 min)

1. Redirección: `echo "uno" > f.txt`, `echo "dos" >> f.txt`, `ls /noexiste 2> errores.txt`, `ls /etc > lista.txt 2>&1`.
2. Pipes: `ls /etc | wc -l`, `ps aux | grep ssh`, `cat /etc/passwd | cut -d: -f1 | sort`.
3. Anota qué hace cada símbolo: `|`, `>`, `>>`, `2>`, `&&`.

### Windows (45 min)

1. Abre **Event Viewer** → Windows Logs → **Security**.
2. **Activa auditoría de inicios de sesión** si hace falta: `auditpol /set /subcategory:"Logon" /success:enable /failure:enable` (como administrador).
3. Genera eventos a propósito y localízalos:
   - **4625:** bloquea la pantalla (`Win+L`) y escribe mal la contraseña 3 veces.
   - **4624:** inicia sesión correctamente.
   - **4720 y 4732:** `net user prueba1 Clave123! /add` y `net localgroup administrators prueba1 /add` (como administrador). Luego elimina: `net user prueba1 /delete`.
4. Usa `Filter Current Log` para mostrar solo esos IDs. En cada evento anota **hora, cuenta, tipo de logon e IP de origen**.
5. Repite una búsqueda con PowerShell: `Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} -MaxEvents 5 | Format-List TimeCreated, Message`.

### Notas (30 min)

1. Tabla de los IDs de memoria (los 9 principales).
2. Captura de un 4625 con los campos marcados.
3. Cómo activaste la auditoría.
4. Una duda.

**Lo lograste si:** encuentras 4625, 4624, 4720 y 4732 en tu VM y explicas los campos clave de cada uno.

=== 1-4-2 ===
@@teoria
### 1. Tipos de inicio de sesión (Logon Type)

El campo **Logon Type** de un 4624 o 4625 dice **cómo** se intenta entrar. Es el dato que más información da:

| Tipo | Nombre | Qué significa | Ejemplo |
|---|---|---|---|
| **2** | Interactive | En el teclado del equipo | Iniciar sesión en la pantalla |
| **3** | Network | Acceso por red | Carpeta compartida (SMB), `net use` |
| **4** | Batch | Tarea programada | Una tarea que corre como usuario |
| **5** | Service | Un servicio arranca | Cuenta de un servicio |
| **7** | Unlock | Desbloquear la pantalla | Volver de la pantalla de bloqueo |
| **8** | NetworkCleartext | Red con contraseña en claro | Autenticación básica (poco común) |
| **9** | NewCredentials | Credenciales nuevas para red | `runas /netonly` |
| **10** | RemoteInteractive | **Escritorio remoto (RDP)** | Conexión RDP |
| **11** | CachedInteractive | Con credenciales en caché | Portátil sin conexión al dominio |

**Los tres que más usarás:** **2** (local), **3** (red) y **10** (RDP).

### 2. Cómo se interpreta

| Evento | Qué sugiere |
|---|---|
| 4625 tipo **3** desde una IP interna a muchas cuentas | Posible *password spraying* contra SMB |
| 4625 tipo **10** desde IP pública | Fuerza bruta contra RDP expuesto |
| 4624 tipo **10** desde una IP inusual | Acceso remoto que hay que verificar |
| 4624 tipo **2** en un servidor a las 3 a.m. | Alguien frente al equipo fuera de horario (verificar) |
| 4624 tipo **3** de cuentas de equipo (terminan en `$`) | Normalmente ruido de dominio |
| 4624 tipo **5** | Normal: servicios arrancando |

### 3. Cómo leer un evento paso a paso

Ejemplo (resumido) de un 4624:

```
Event ID: 4624
Logon Type: 10
New Logon:
  Account Name: jperez
  Logon ID: 0x3E7A2B
Network Information:
  Source Network Address: 203.0.113.45
Process Information:
  Process Name: C:\Windows\System32\svchost.exe
```

Lectura: «el usuario `jperez` inició sesión por **RDP** (tipo 10) desde la IP **203.0.113.45**, que es **pública**. ¿Es una IP esperada? ¿A esa hora? ¿Hubo fallos antes?».

### 4. Campos que debes distinguir

- **Subject** es quien **registra** el evento (suele ser el propio sistema); **New Logon** es la cuenta que **entró**. No los confundas.
- **Logon ID:** identifica la sesión. Sirve para **correlacionar** con el 4634 (cierre), con el 4688 (procesos de esa sesión) y con el 4672.
- **Source Network Address:** `-`, `::1` o `127.0.0.1` indica un inicio local.
- **Cuentas especiales** que verás: `SYSTEM`, `LOCAL SERVICE`, `NETWORK SERVICE`, `ANONYMOUS LOGON`, `DWM-1`, `UMFD-0`. Casi siempre son ruido normal.

### 5. Correlación: contar la historia

Una alerta aislada pesa poco; una **cadena de eventos** cuenta una historia.

| Orden | Evento | Qué aporta |
|---|---|---|
| 1 | Muchos **4625** (mismo origen) | Intentos de adivinar contraseñas |
| 2 | Un **4624** (mismo usuario e IP) | El intento tuvo éxito |
| 3 | **4672** | La cuenta tiene privilegios |
| 4 | **4688** | Qué ejecutó después |
| 5 | **4720** / **4732** | Creó cuentas o se dio privilegios |
| 6 | **7045** / **4698** | Persistencia |

### 6. Buenas prácticas

- **Zona horaria:** los eventos se guardan en la hora del equipo. Un SIEM normaliza a UTC. Anota siempre la zona horaria en tus notas.
- **Orden:** `Get-WinEvent` devuelve primero los más recientes. Ordena por `TimeCreated` para construir una **línea de tiempo**.
- **Aislar el ruido:** filtra por tipo de logon y por cuenta antes de sacar conclusiones.

### 7. Resumen

| Concepto | Una frase |
|---|---|
| Logon Type 2 / 3 / 10 | Local / red / RDP |
| Subject vs New Logon | Quién registra vs quién entra |
| Logon ID | Une los eventos de una misma sesión |
| Correlación | 4625 → 4624 → 4672 → 4688 → 4720/4732 → 7045/4698 |

@@practica
### Linux (45 min)

1. `grep -E "root|admin" /etc/passwd`, `grep -E "^(root|daemon)" /etc/passwd`.
2. `cut -d: -f1,3 /etc/passwd` (usuario y UID), `cut -d: -f1 /etc/passwd | sort`.
3. `sort`, `uniq -c`, `sort -nr`: crea un archivo `palabras.txt` con repeticiones y cuéntalas: `sort palabras.txt | uniq -c | sort -nr`.
4. Anota qué hace cada comando y cuándo usarlo.

### Windows (45 min)

1. Genera **tres tipos de logon**:
   - **2:** inicia sesión en la VM.
   - **3:** desde Linux, accede por SMB (`smbclient -L //<IP de Windows> -U usuario`, instalando `smbclient`) o desde otra VM Windows con `net use`.
   - **10:** habilita RDP en la VM (Configuración → Sistema → Escritorio remoto) y conéctate desde otra máquina o con `mstsc`.
2. Para cada intento, abre el 4624 correspondiente y anota **tipo de logon, cuenta e IP de origen**.
3. Genera 3 intentos fallidos de cada tipo y localiza los 4625.
4. Con PowerShell extrae los campos: `Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624} -MaxEvents 20 | ForEach-Object { $x = [xml]$_.ToXml(); ($x.Event.EventData.Data | Where-Object Name -in 'TargetUserName','LogonType','IpAddress' | ForEach-Object { $_.'#text' }) -join ' | ' }`

### Notas (30 min)

1. Tabla de logon types 2, 3, 5 y 10 con ejemplos.
2. Tus eventos reales (captura) con campos marcados.
3. Una cadena de eventos de tu laboratorio explicada como historia.
4. Una duda.

**Lo lograste si:** distingues los tipos 2, 3 y 10 en tus propios eventos y explicas la diferencia entre *Subject* y *New Logon*.

=== 1-4-3 ===
@@teoria
### 1. Dónde están los logs en Linux

| Archivo o herramienta | Qué contiene |
|---|---|
| `/var/log/auth.log` (Debian/Ubuntu) | **Autenticación:** SSH, `sudo`, `su`, login |
| `/var/log/secure` (RHEL/CentOS/Fedora) | Lo mismo que `auth.log` |
| `/var/log/syslog` (Debian) / `/var/log/messages` (RHEL) | Mensajes generales del sistema, incluidos los de cron |
| `/var/log/kern.log` | Kernel |
| `/var/log/dpkg.log`, `/var/log/apt/history.log` | Instalación de paquetes |
| `/var/log/wtmp`, `/var/log/btmp` | Sesiones (binarios): se leen con `last` y `lastb` |
| `journalctl` | El diario de **systemd** (lo usa toda distribución moderna) |

**Nota:** en versiones recientes de Ubuntu o Debian mínimas puede **no existir** `auth.log` (no está instalado `rsyslog`). En ese caso usa `journalctl`.

### 2. journalctl

| Comando | Qué hace |
|---|---|
| `journalctl -u ssh` | Mensajes del servicio SSH (puede llamarse `sshd`) |
| `journalctl -f` | Seguir en vivo |
| `journalctl -n 50` | Últimas 50 líneas |
| `journalctl --since "1 hour ago"` | Desde hace 1 hora |
| `journalctl -p err` | Solo errores o más graves |
| `journalctl -b` | Desde el último arranque |

### 3. Anatomía de una línea de log

```
Oct 21 21:10:03 srv sshd[1234]: Failed password for invalid user admin from 203.0.113.5 port 52114 ssh2
```

| Parte | Significado |
|---|---|
| `Oct 21 21:10:03` | Fecha y hora (sin año) |
| `srv` | Nombre del equipo |
| `sshd[1234]` | Programa y su PID |
| El resto | El mensaje |

### 4. Mensajes que debes reconocer

| Mensaje | Qué significa |
|---|---|
| `Failed password for usuario from IP` | Contraseña incorrecta (usuario **existe**) |
| `Failed password for invalid user X from IP` | El usuario **no existe** |
| `Accepted password for usuario from IP` | Login exitoso con contraseña |
| `Accepted publickey for usuario from IP` | Login exitoso con clave |
| `Invalid user X from IP` | Intento con usuario inexistente |
| `session opened for user root` | Se abrió una sesión de root |
| `sudo: ... COMMAND=/bin/...` | Alguien ejecutó un comando con `sudo` |
| `useradd`, `new user`, `usermod`, `groupadd` | Cambios de cuentas y grupos |
| `Connection closed by ... [preauth]` | Conexión cerrada antes de autenticar (típica de escaneos) |

### 5. Análisis con la línea de comandos

**IPs únicas con intentos fallidos, ordenadas por frecuencia** (extrae la IP con una expresión regular, así funciona aunque cambie la columna):

```
grep "Failed password" auth.log | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | sort | uniq -c | sort -nr
```

**Otras consultas útiles:**

```
grep "Accepted" auth.log                      # logins exitosos
grep "Failed password" auth.log | wc -l       # total de fallos
grep "invalid user" auth.log | awk '{print $8}' | sort | uniq -c | sort -nr   # usuarios probados
last -n 10                                    # últimos logins
sudo lastb | head                             # intentos fallidos (btmp)
```

**Ojo con `awk '{print $N}'`:** la posición de la IP **cambia** según el mensaje (con `invalid user` hay una palabra más). Por eso la extracción por expresión regular es más robusta.

### 6. Windows ↔ Linux

| Windows | Linux |
|---|---|
| 4625 login fallido | `Failed password` |
| 4624 login exitoso | `Accepted password` / `Accepted publickey` |
| 4720 usuario creado | `useradd` / `new user` |
| 4732 añadido a grupo | `usermod -aG` / `add ... to group` |
| 4672 privilegios | `sudo` / sesión de root |
| 1102 log borrado | Archivos de log vacíos o truncados |

### 7. Resumen

| Concepto | Una frase |
|---|---|
| `auth.log` / `secure` | Autenticación en Debian / en RHEL |
| `journalctl -u ssh` | Logs del servicio SSH |
| `Failed password` / `Accepted` | Login fallido / exitoso |
| `invalid user` | El usuario no existe (posible enumeración) |
| `grep ... \| sort \| uniq -c \| sort -nr` | Contar y ordenar por frecuencia |

@@practica
### Linux (45 min)

1. **Genera intentos fallidos de SSH:** desde Windows (o desde otra VM) ejecuta `ssh usuarioinexistente@<IP de Linux>` e introduce contraseñas incorrectas 3 veces. Repite con un usuario que **sí exista** y contraseña mala.
2. En Linux: `sudo grep "Failed password" /var/log/auth.log | tail` (si no existe, `sudo journalctl -u ssh --since "10 minutes ago"`).
3. Practica `awk '{print $N}'` para sacar columnas: prueba con `awk '{print $1,$2,$3}'`, `awk '{print $5}'`, y compara con la extracción por expresión regular.
4. `tr 'a-z' 'A-Z' < archivo.txt` y `sed 's/Failed/FALLIDO/' auth.log | head`.
5. `last -n 10` y `sudo lastb | head`.

### Windows (45 min)

1. `Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} -MaxEvents 10 | Select-Object TimeCreated, Id, Message | Format-List`.
2. Compara el mismo ataque en ambos sistemas: **¿qué campo muestra la IP? ¿Y el usuario? ¿Y la hora?**
3. Haz una tabla Windows ↔ Linux con lo que viste.

### Notas (30 min)

1. Tu one-liner funcionando con captura de salida.
2. La tabla Windows ↔ Linux.
3. Diferencia entre `Failed password for` y `Failed password for invalid user`.
4. Una duda.

**Lo lograste si:** cuentas intentos fallidos por IP con una sola línea y explicas por qué la expresión regular es más robusta que una columna fija.

=== 1-4-4 ===
@@teoria
### 1. La pregunta del analista L1

Ante una alerta de múltiples intentos fallidos: **¿error humano o ataque?** Se decide con **evidencia**, no con intuición.

### 2. Los criterios

| Criterio | Error humano | Ataque |
|---|---|---|
| **Cantidad** | 1 a 5 intentos | Decenas, cientos o miles |
| **Rapidez** | Segundos o minutos entre intentos | Varios por segundo (automatizado) |
| **Cuentas probadas** | Una (la suya) | Muchas, o de un diccionario |
| **Existencia de la cuenta** | Existe | A menudo **no existe** (`0xC0000064`) |
| **Origen** | Su propio equipo o red habitual | IP externa, país inusual o reputación mala |
| **Horario** | Laboral | Madrugada o fin de semana |
| **Servicio** | El habitual del usuario | Un servicio expuesto (RDP, SSH, SMB) |
| **Después** | Entra y trabaja normal | Éxito seguido de comportamiento anómalo |

### 3. Tipos de ataques de credenciales

| Ataque | Cómo funciona | Cómo se ve |
|---|---|---|
| **Fuerza bruta** | Muchas contraseñas contra **una** cuenta | Muchos 4625 para el mismo usuario; puede terminar en bloqueo (4740) |
| **Password spraying** | **Una** contraseña común contra **muchas** cuentas, para evitar el bloqueo | Pocos fallos por cuenta, muchas cuentas distintas, mismo origen |
| **Credential stuffing** | Credenciales filtradas de otros sitios | Muchos usuarios reales, éxito ocasional |
| **Ataque de diccionario** | Lista de contraseñas probables | Similar a fuerza bruta |

En MITRE ATT&CK: *Brute Force* (T1110: .001 adivinanza, .003 spraying, .004 stuffing) y *Valid Accounts* (T1078) cuando hay éxito.

### 4. Nivel de gravedad típico

| Situación | Gravedad | Qué se suele hacer |
|---|---|---|
| Fallos desde Internet, sin éxito | **Baja o media** | Documentar; bloquear la IP si el procedimiento lo indica. Es ruido de Internet |
| Fallos desde un equipo **interno** | **Media** | Verificar el equipo; puede estar comprometido |
| Fallos + **un éxito** | **Alta** | Escalar; verificar con el usuario |
| Éxito + actividad posterior (procesos, cuentas, servicios) | **Crítica** | Escalar de inmediato a L2 / respuesta a incidentes |

### 5. Qué hacer paso a paso

1. **Confirma la alerta:** cuenta, equipo, IP, hora, cantidad.
2. **Mide el patrón:** ¿cuántos intentos, en cuánto tiempo, a cuántas cuentas?
3. **Reputación de la IP:** ¿es conocida? (herramientas de threat intel, mes 2).
4. **Busca el éxito:** ¿hay un 4624 de la misma IP o cuenta después de los fallos?
5. **Mira lo que hizo después:** 4672, 4688, 4720, 4732, 7045, 4698.
6. **Contacta al usuario** (por un canal distinto al sospechoso) si hay duda.
7. **Decide:** cerrar con explicación o **escalar** con toda la evidencia.

El L1 **no contiene por su cuenta** (aislar equipos, deshabilitar cuentas) salvo que el procedimiento lo permita.

### 6. Medidas que reducen el riesgo

- **MFA** en todos los accesos remotos.
- **Bloqueo de cuentas** tras N fallos.
- No exponer **RDP/SSH** directamente a Internet (VPN, bastión).
- **fail2ban** u otras herramientas que bloqueen IPs automáticamente.
- Contraseñas largas y únicas.

### 7. Plantilla de nota de ticket

```
Resumen: Múltiples intentos fallidos de acceso por RDP a SRV01.
Qué: 143 eventos 4625 (tipo 10) entre las 03:12 y 03:19 UTC-6.
Quién: IP origen 203.0.113.45 (pública, sin reputación conocida). Cuentas probadas: administrator, admin, soporte.
Evidencia: 4625 con Sub Status 0xC0000064 (usuario inexistente) y 0xC000006A (contraseña incorrecta). Un 4624 tipo 10 a las 03:19 para "soporte".
Conclusión: Verdadero positivo. Fuerza bruta con acceso exitoso.
Acción: Escalado a L2. Pendiente confirmar actividad posterior de la cuenta "soporte".
```

### 8. Resumen

| Concepto | Una frase |
|---|---|
| Criterios | Cantidad, rapidez, cuentas, origen, horario, servicio y éxito posterior |
| Fuerza bruta vs spraying | Muchas contraseñas a una cuenta / una contraseña a muchas cuentas |
| Lo que más sube la gravedad | Un **éxito** tras los fallos |
| Decisión del L1 | Cerrar con explicación o escalar con evidencia |

@@practica
### Linux (45 min)

1. Escribe un one-liner que cuente fallos por IP:
   `grep "Failed password" auth.log | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | sort | uniq -c | sort -nr`
   Si tu log no tiene datos, genéralos con 15 intentos fallidos de SSH.
2. Escribe otro que cuente **usuarios probados**: `grep "invalid user" auth.log | awk '{print $8}' | sort | uniq -c | sort -nr`.
3. Crea un script mínimo `fallos.sh` con el one-liner que reciba el archivo como argumento (`$1`).

### Windows (45 min)

1. Habilita la auditoría de creación de procesos: `auditpol /set /subcategory:"Process Creation" /success:enable`.
2. Habilita la línea de comandos en el evento (clave de registro): `reg add "HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\System\Audit" /v ProcessCreationIncludeCmdLine_Enabled /t REG_DWORD /d 1 /f`.
3. Abre `notepad.exe` y `cmd.exe` y busca el **4688** con `Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688} -MaxEvents 5`. Comprueba que aparece el **proceso padre** y la **línea de comandos**.
4. **Ejercicio de criterio:** escribe una tabla con 3 escenarios inventados (error humano, fuerza bruta externa, fuerza bruta con éxito) y la decisión que tomarías en cada uno.

### Notas (30 min)

1. Tu one-liner y la tabla de criterios con tus propias palabras.
2. Una nota de ticket escrita con la plantilla sobre tus datos del laboratorio.
3. Una duda.

**Lo lograste si:** decides entre error humano y ataque con criterios y escribes una nota de ticket que otra persona entendería sin preguntarte.

=== 1-4-5 ===
@@teoria
**Room de la ruta SOC L1 de hoy:** *Systems as Attack Vectors*.

### 1. Los sistemas también se atacan

Además de engañar a personas, los atacantes aprovechan **fallos en los propios sistemas**. Se agrupan en:

| Categoría | Ejemplos |
|---|---|
| **Vulnerabilidades de software** | Errores en un programa que permiten ejecutar código o escalar privilegios |
| **Malas configuraciones** | Credenciales por defecto, servicios innecesarios, permisos excesivos, almacenamiento en la nube público |
| **Falta de parches** | Una vulnerabilidad conocida que nadie corrigió |
| **Software obsoleto o sin soporte** | Ya no recibe actualizaciones de seguridad |
| **Exposición innecesaria** | RDP, SMB o bases de datos abiertos a Internet |
| **Credenciales débiles** | Contraseñas simples o reutilizadas |

### 2. Vocabulario esencial

| Término | Qué es |
|---|---|
| **CVE** | Identificador público de una vulnerabilidad (por ejemplo, `CVE-2017-0144`) |
| **CVSS** | Puntuación de gravedad de 0 a 10 |
| **Exploit** | Código que aprovecha una vulnerabilidad |
| **PoC** | Prueba de concepto: un exploit de demostración |
| **Zero-day** | Vulnerabilidad sin parche disponible |
| **Superficie de ataque** | Todo lo que un atacante puede intentar alcanzar |
| **Hardening** | Endurecer la configuración para reducir riesgos |
| **KEV** | Catálogo de vulnerabilidades explotadas activamente (lo publica CISA) |

### 3. Ejemplos históricos que debes reconocer

- **EternalBlue y WannaCry:** una vulnerabilidad en **SMB (445)** permitió propagar ransomware por redes Windows sin parchar.
- **Credenciales por defecto:** routers, cámaras y bases de datos accesibles con `admin/admin`.
- **Servicios expuestos:** RDP abierto a Internet con contraseña débil.

### 4. Ciclo de vida de una vulnerabilidad

1. Se descubre y se reporta.
2. Se publica un **CVE** y el fabricante saca un **parche**.
3. Aparece un **exploit público**.
4. Los atacantes escanean Internet buscando equipos sin parchar.
5. Las organizaciones deben **parchar** antes de que los exploten.

La **gestión de vulnerabilidades** es el proceso continuo de escanear, priorizar (según gravedad y criticidad del activo) y parchar.

### 5. Qué señales deja un ataque a un sistema

| Señal | Dónde se ve |
|---|---|
| Escaneo previo de puertos o de versiones | IDS, firewall |
| Servicio web con muchos **500** o rutas raras | Logs web |
| Un servicio (web, base de datos) lanzando **procesos hijo inesperados** (`w3wp.exe` → `cmd.exe`) | EDR, Sysmon, 4688 |
| **Usuarios nuevos** o cambios de privilegios | 4720, 4732 |
| **Servicios o tareas** nuevos | 7045, 4698 |
| Tráfico **saliente** inusual desde un servidor | Firewall, proxy, EDR |
| Archivos nuevos en carpetas web (webshell) | Integridad de archivos, EDR |

**Conexión con tu semana:** los eventos que generaste (login fallido, usuario nuevo, grupo, servicio, tarea) son exactamente las huellas que deja un atacante tras explotar un sistema.

### 6. Cómo ayuda el SOC

- **Correlacionar** alertas con las vulnerabilidades conocidas del activo y su **criticidad**.
- Distinguir un escaneo de vulnerabilidades **autorizado** de uno hostil.
- Priorizar: una vulnerabilidad de la KEV en un servidor expuesto es urgente.
- Alimentar al equipo de parches y de hardening con lo que se observa.

### 7. Resumen

| Concepto | Una frase |
|---|---|
| Vulnerabilidad vs mala configuración | Fallo del software vs error al configurarlo |
| CVE / CVSS | Identificador / gravedad de 0 a 10 |
| Zero-day | Sin parche disponible |
| Superficie de ataque | Todo lo alcanzable por un atacante |
| Huellas | Procesos hijo inesperados, cuentas, servicios y tráfico saliente nuevos |

@@practica
### Linux (45 min)

1. Repaso de comandos: haz una hoja con los 25 comandos de Linux que ya viste, agrupados (archivos, texto, permisos, red, procesos, logs).
2. Ejecuta cada uno una vez sin mirar tus notas y marca los que tuviste que buscar.
3. Continúa Bandit hasta donde llegues.

### Ruta SOC L1 (45 min)

1. **THM:** *Systems as Attack Vectors*. Léela y resuelve las preguntas.
2. Anota: 3 vulnerabilidades o malas configuraciones que aparezcan y cómo se detectaría cada una.
3. Busca en cisa.gov el catálogo **KEV** (Known Exploited Vulnerabilities) y revisa 3 entradas: qué producto, qué CVE y cuándo se añadió.

### Ejercicio (parte de tus notas)

Para cada evento que generaste esta semana, escribe **a qué tipo de ataque podría corresponder** y **qué más buscarías**:

| Evento | Ataque posible | Qué más buscaría |
|---|---|---|
| 4625 repetidos | | |
| 4720 | | |
| 4732 | | |
| 7045 | | |
| 4698 | | |
| 4688 con PowerShell codificado | | |

### Notas (30 min)

1. La tabla completa.
2. Lo que aprendiste en la room.
3. Una duda.

**Lo lograste si:** relacionas cada evento con un posible ataque y con el siguiente evento que buscarías.

=== 1-4-6 ===
@@teoria
**Hoy no hay teoría nueva.** Es el sábado de laboratorio. Dedica 10 minutos a releer tus notas de Event IDs, logon types, logs de Linux, error humano vs ataque y sistemas como vector.

### Qué vas a hacer

Provocar el **mismo ataque** contra Linux (SSH) y contra Windows (RDP o SMB) y comparar cómo lo ve cada sistema.

### Qué debes anotar de cada intento

| Dato | Linux | Windows |
|---|---|---|
| Hora | En `auth.log` o `journalctl` | `TimeCreated` del 4625 |
| IP de origen | En el mensaje del log | `Source Network Address` |
| Usuario probado | `invalid user X` o el nombre | `Account Name` |
| Tipo de acceso | `ssh2` | Logon Type 10 (RDP) o 3 (SMB) |
| Motivo del fallo | Contraseña mala o usuario inválido | `Sub Status` |

### Reparto de las 3 horas

1. **Hora 1:** generar los ataques.
2. **Hora 2:** encontrar la evidencia y comparar.
3. **Hora 3:** redactar y mini-checkpoint.

### Seguridad

Todo en tu red aislada y contra tus propias VMs. No uses herramientas de fuerza bruta contra nada que no sea tuyo.

@@practica
### Hora 1: generar los ataques

1. **SSH contra Linux:** desde Windows o desde otra VM, haz **10 intentos fallidos** manuales (`ssh usuario@<IP de Linux>` con contraseñas incorrectas), alternando un usuario inexistente y uno existente.
2. **RDP o SMB contra Windows:** habilita RDP en Windows y haz **10 intentos fallidos** con `mstsc` o con `net use \\<IP de Windows> /user:prueba clavemala`.
3. Termina con **un acceso exitoso** en cada uno para tener un 4624 y un `Accepted`.

### Hora 2: evidencia y comparación

1. **Linux:** `sudo grep -E "Failed|Accepted" /var/log/auth.log` (o `journalctl -u ssh`). Cuenta los fallos por IP con tu one-liner.
2. **Windows:** `Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625,4624} -MaxEvents 30`.
3. Rellena la tabla de la teoría con hora, IP y usuario de cada sistema.
4. Revisa el **Logon Type** de cada evento de Windows.

### Hora 3: redactar

1. Escribe una **comparación de 10 líneas** Linux vs Windows (qué logs, qué campos, qué te resultó más claro).
2. Escribe una **nota de ticket** con la plantilla del jueves sobre el ataque de Windows.
3. Sube todo a GitHub (carpeta `semana-04`).
4. Responde el **mini-checkpoint de la semana 4** (sección de examen).

**Lo lograste si:** encuentras hora, IP y usuario en ambos sistemas y tienes la comparación y la nota de ticket escritas.
