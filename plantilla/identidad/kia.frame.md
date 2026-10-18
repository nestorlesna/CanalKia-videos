---
version: 1
name: Kia — la humana de cuatro patitas (capa de video)
description: >
  Calcada del logo y del banner del canal: fondo amarillo, círculos crema, piso ocre y huellas. Todo plano, con el
  contorno marrón grueso de Kia y esquinas redondeadas. Tipografía Fredoka (la del banner). Kia narra en primera
  persona; el texto en pantalla es poco y gordo (carteles), el resto lo cuentan Kia y los objetos.
unit: dos formatos — 16:9 1920×1080 (video) y 9:16 1080×1920 (Short)
principle: un chiste por escena · Kia siempre en el centro de la acción · nada pisa el subtítulo

colors:
  bg: "#FFCF4D"          # amarillo del banner (fondo)
  cream: "#FFE7A3"       # círculos del fondo
  floor: "#F2B93B"       # piso ocre
  ocre-strong: "#C98A1E" # barra de progreso
  paw: "#B59139"         # huellas del decorado y Zzz
  line: "#2B1D14"        # contorno de todo y texto (contraste alto sobre amarillo y crema)
  fur: "#D9965B"         # pelaje de Kia
  belly: "#EDBE8C"       # panza
  ball: "#2E7DD1"        # la pelota azul
  red: "#E2574C"         # correa, mochila, alertas
  card: "#FFF6DC"        # carteles, ranking y subtítulo

typography:
  display: { family: "Fredoka", weight: 700, use: "KIA del hook, carteles, ranking, globos" }
  subtitle: { family: "Fredoka", weight: 600 }
  body: { family: "Fredoka", weight: 500, use: "línea chica del hook" }
  ramp:
    hook: 250px (16:9) / 260px (9:16) · bajada 76/70px · línea 44/40px
    cartel: 92px (16:9) / 84px (9:16), una línea, se achica solo si no entra · chico 60px
    ranking: ítem 54/56px · encabezado 40/38px
    subtitle: 44px (16:9) / 46px (9:16), line-height 1.22, máx. 3 líneas (~120 caracteres)

components:
  cartel: "crema, borde 7px marrón, radio 36, sombra plana 0 10px 0; arriba al centro"
  cartel-dormir: "marrón con letras crema + huella + número en círculo crema (el chiste repetido)"
  ranking: "tarjeta crema con pastilla marrón EN ORDEN DE IMPORTANCIA y puestos numerados en círculos ocre"
  globo: "blanco, borde 7px marrón, colita hacia la boca de Kia, Fredoka 700"
  subtitle: "caja crema con borde marrón 5px, radio 28"
  topbar: "logo redondo + KIA (desde la 2.ª escena)"
  progress: "barra ocre fuerte de 12px ARRIBA de todo (abajo están los botones de Shorts)"

layout:
  16x9:
    piso: y 850 · escenario: x 0 en 960, escala 1,2 (Kia sentada ≈ 480px de alto)
    cartel: top 128, ancho 1560 centrado · hook: texto a la derecha (x 900–1860, top 280), Kia a la izquierda
    subtítulo: x 170–1750, abajo a 30px · márgenes ≥ 60px
  9x16:
    piso: y 1440 · escenario: x 0 en 500 (corrido a la izquierda), escala 1,35
    topbar: y 150 · cartel: top 290, ancho 880 · hook: texto centrado arriba (top 300)
    subtítulo: desde y 1590 · nada importante en los 140px de la derecha ni debajo del subtítulo

motion:
  Kia: rig SVG con poses (plantilla/kia.mjs); siempre "viva" (respira, parpadea, mueve las orejas), determinista
  entradas: carteles y objetos con pop (back.out); Kia entra de un salto; pelota y comida caen con rebote
  ritmo: escenas largas alternadas con las cortas de "Dormir" (~1,8 s): el ritmo hace el chiste
  salida: fade 0,2 s al final de cada escena (la última queda quieta)

do:
  - Kia grande y en el centro; humanos genéricos de la cintura para abajo (sin caras ni nombres)
  - íconos SVG de plantilla/iconos.mjs (nunca emojis dentro del video)
  - comida apta para perros solamente (zanahoria, pollo)
don't:
  - fotos o datos reales de la familia, colegio, dirección, patentes
  - texto chico, más de 3 líneas de subtítulo, texto en la franja derecha del Short
---

# Kia

Un canal para chicos y familias: tiene que verse como el banner en movimiento. Amarillo cálido, todo redondo y con
contorno grueso, como un dibujo animado simple. Kia es la estrella; el texto acompaña.
