// ─────────────────────────────────────────────────────────────────────────────
// ayudaData.ts  –  Contenido del Centro de Ayuda de Fácil Facturación
// ─────────────────────────────────────────────────────────────────────────────

export interface Paso {
  texto: string;
  nota?: string;
}

export interface Articulo {
  id: string;
  titulo: string;
  resumen: string;
  pasos: Paso[];
  tip?: string;
}

export interface Categoria {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string; // MaterialCommunityIcons name
  color: string;
  colorLight: string;
  articulos: Articulo[];
}

export const CATEGORIAS: Categoria[] = [
  // ── 1. Primeros pasos ──────────────────────────────────────────────────────
  {
    id: "primeros-pasos",
    titulo: "Primeros pasos",
    descripcion: "Cómo empezar a usar Fácil",
    icono: "flag-outline",
    color: "#2B8EF0",
    colorLight: "#EBF4FF",
    articulos: [
      {
        id: "pp-1",
        titulo: "¿Cómo funciona Fácil?",
        resumen: "Conoce las secciones principales de la aplicación.",
        pasos: [
          {
            texto:
              "Al abrir la app verás el menú principal con todas las secciones disponibles.",
          },
          { texto: "Productos: registra los artículos que vendes." },
          { texto: "Clientes: guarda los datos de tus compradores." },
          { texto: "Nueva Venta: crea ventas en 3 pasos rápidos." },
          { texto: "Venta del día: consulta el resumen y maneja tu caja." },
          { texto: "Historial: revisa ventas anteriores con filtros." },
          {
            texto:
              "Créditos, Gastos e Historial de Caja completan el control de tu negocio.",
          },
          {
            texto:
              "Ajustes: configura el inventario, exporta datos y consulta ayuda.",
          },
        ],
        tip: "Empieza por agregar tus Productos y luego registra a tus Clientes antes de crear la primera venta.",
      },
      {
        id: "pp-2",
        titulo: "Cómo abrir la caja por primera vez",
        resumen: "Debes abrir la caja antes de registrar ventas.",
        pasos: [
          { texto: "Ve a Venta del día desde el menú principal." },
          { texto: "Toca el botón Abrir caja en la parte superior." },
          {
            texto:
              "Ingresa el monto de dinero con el que empiezas el día (base de caja).",
          },
          {
            texto:
              "Toca Confirmar. La caja queda abierta y ya puedes registrar ventas.",
          },
          {
            texto:
              "Al final del día ve a Venta del día y toca Cerrar caja para guardar el cuadre.",
          },
        ],
        tip: "Sin caja abierta no podrás finalizar ventas en efectivo.",
      },
    ],
  },

  // ── 2. Nueva Venta ─────────────────────────────────────────────────────────
  {
    id: "nueva-venta",
    titulo: "Nueva Venta",
    descripcion: "Cómo registrar una venta paso a paso",
    icono: "cart-plus",
    color: "#8B5CF6",
    colorLight: "#F5EFFF",
    articulos: [
      {
        id: "nv-1",
        titulo: "Cómo crear una venta",
        resumen: "El proceso completo de una venta en 3 pasos.",
        pasos: [
          { texto: "Toca Nueva Venta en el menú principal." },
          {
            texto:
              "Paso 1 – Cliente: busca un cliente existente escribiendo su nombre, o toca Sin cliente para continuar sin asignar uno.",
          },
          {
            texto:
              "Puedes crear un cliente nuevo tocando el botón + Cliente dentro de la misma pantalla.",
          },
          { texto: "Toca Siguiente para pasar al Paso 2." },
          {
            texto:
              "Paso 2 – Productos: busca el producto que deseas agregar y toca el botón + para añadirlo al carrito.",
          },
          {
            texto:
              "Puedes ajustar la cantidad usando los botones – y + que aparecen en el carrito.",
          },
          {
            texto:
              "El total se actualiza automáticamente. Toca Siguiente para continuar.",
          },
          {
            texto:
              "Paso 3 – Cobro: selecciona el método de pago: Efectivo, Tarjeta o Crédito.",
          },
          {
            texto:
              "Si es efectivo, ingresa cuánto paga el cliente y la app calcula el cambio.",
          },
          { texto: "Toca Finalizar venta para guardar." },
        ],
        tip: "Si el cliente está en mora (tiene deudas anteriores), verás una alerta en rojo en el Paso 1.",
      },
      {
        id: "nv-2",
        titulo: "Venta a crédito",
        resumen: "Cómo registrar una venta que queda pendiente de pago.",
        pasos: [
          {
            texto:
              "Sigue los Pasos 1 y 2 de la venta normalmente (cliente y productos).",
          },
          { texto: "En el Paso 3 – Cobro, selecciona el método Crédito." },
          { texto: "Confirma tocando Finalizar venta." },
          { texto: "La deuda quedará registrada en la sección Créditos." },
          {
            texto:
              "Cuando el cliente pague total o parcialmente, ve a Créditos y registra el abono.",
          },
        ],
        tip: "Para hacer una venta a crédito es necesario tener seleccionado un cliente en el Paso 1.",
      },
      {
        id: "nv-3",
        titulo: "Cómo modificar cantidades en el carrito",
        resumen: "Ajusta los productos antes de finalizar la venta.",
        pasos: [
          {
            texto:
              "En el Paso 2 (Productos), el carrito aparece en la parte inferior de la pantalla.",
          },
          {
            texto:
              "Toca el carrito para expandirlo y ver todos los productos agregados.",
          },
          {
            texto:
              "Usa el botón – para reducir la cantidad o el botón + para aumentarla.",
          },
          {
            texto:
              "Si reduces la cantidad a cero, el producto se elimina del carrito automáticamente.",
          },
          { texto: "El total se recalcula en tiempo real." },
        ],
      },
    ],
  },

  // ── 3. Productos ───────────────────────────────────────────────────────────
  {
    id: "productos",
    titulo: "Productos",
    descripcion: "Gestiona tu catálogo e inventario",
    icono: "package-variant-closed",
    color: "#2F80FF",
    colorLight: "#EEF4FF",
    articulos: [
      {
        id: "prod-1",
        titulo: "Cómo agregar un producto",
        resumen: "Registra nuevos artículos para vender.",
        pasos: [
          { texto: "Ve a Productos desde el menú principal." },
          {
            texto:
              "Toca el botón + (agregar) en la parte inferior de la pantalla.",
          },
          {
            texto:
              "Completa el formulario: Nombre del producto (obligatorio) y Precio de venta (obligatorio).",
          },
          { texto: "Puedes agregar una foto tocando el ícono de cámara." },
          { texto: "Toca Guardar para registrar el producto." },
        ],
        tip: "Asigna nombres claros y descriptivos para encontrarlos rápido al hacer una venta.",
      },
      {
        id: "prod-2",
        titulo: "Cómo editar o eliminar un producto",
        resumen: "Actualiza información o retira productos del catálogo.",
        pasos: [
          {
            texto:
              "Ve a Productos y encuentra el artículo que deseas modificar.",
          },
          {
            texto:
              "Toca los tres puntos (···) que aparecen en la tarjeta del producto.",
          },
          {
            texto:
              "Selecciona Editar producto para cambiar nombre, precio o foto.",
          },
          { texto: "Realiza los cambios y toca Guardar." },
          {
            texto:
              "Para eliminar, toca los tres puntos y selecciona Eliminar producto.",
          },
          { texto: "Confirma la acción. Esta operación no se puede deshacer." },
        ],
      },
      {
        id: "prod-3",
        titulo: "Control de inventario",
        resumen: "Cómo activar y gestionar el stock de productos.",
        pasos: [
          {
            texto:
              "Ve a Ajustes y activa el interruptor Control de inventario.",
          },
          {
            texto:
              "Una vez activo, cada producto mostrará su stock disponible.",
          },
          {
            texto:
              "Para ajustar el stock de un producto, ve a Productos y toca los tres puntos del artículo.",
          },
          { texto: "Selecciona Inventario e ingresa la cantidad disponible." },
          {
            texto:
              "Con el inventario activo, al hacer una venta el stock se descuenta automáticamente.",
          },
          {
            texto:
              "Los productos con stock bajo aparecerán resaltados en la lista.",
          },
        ],
        tip: "Usa el filtro Stock bajo en Productos para ver rápidamente qué artículos necesitas reponer.",
      },
      {
        id: "prod-4",
        titulo: "Búsqueda y filtros de productos",
        resumen: "Encuentra tus productos rápidamente.",
        pasos: [
          {
            texto:
              "En la pantalla de Productos, usa la barra de búsqueda para escribir el nombre del producto.",
          },
          {
            texto:
              "Los resultados se filtran en tiempo real mientras escribes.",
          },
          {
            texto:
              "Usa los botones de filtro para ver: Todos, Stock OK o Stock bajo.",
          },
          {
            texto:
              "El filtro Stock bajo solo aparece si el control de inventario está activo.",
          },
        ],
      },
    ],
  },

  // ── 4. Clientes ────────────────────────────────────────────────────────────
  {
    id: "clientes",
    titulo: "Clientes",
    descripcion: "Administra tus compradores y contactos",
    icono: "account-group",
    color: "#27C56D",
    colorLight: "#ECFFF4",
    articulos: [
      {
        id: "cli-1",
        titulo: "Cómo agregar un cliente",
        resumen: "Registra los datos de tus compradores.",
        pasos: [
          { texto: "Ve a Clientes desde el menú principal." },
          { texto: "Toca el botón + (agregar) en la parte inferior." },
          {
            texto:
              "Ingresa el nombre del cliente (obligatorio) y otros datos opcionales como teléfono o dirección.",
          },
          { texto: "Toca Guardar para registrar el cliente." },
        ],
        tip: "También puedes agregar un cliente directamente desde el Paso 1 de Nueva Venta sin salir del proceso de venta.",
      },
      {
        id: "cli-2",
        titulo: "Cómo editar o eliminar un cliente",
        resumen: "Actualiza o retira clientes de tu lista.",
        pasos: [
          {
            texto: "Ve a Clientes y encuentra al cliente que deseas modificar.",
          },
          { texto: "Toca los tres puntos (···) en la tarjeta del cliente." },
          {
            texto:
              "Selecciona Editar para cambiar sus datos o Eliminar para quitarlo.",
          },
          {
            texto: "Confirma la eliminación. Esta acción no se puede deshacer.",
          },
        ],
      },
    ],
  },

  // ── 5. Venta del día ───────────────────────────────────────────────────────
  {
    id: "venta-del-dia",
    titulo: "Venta del día",
    descripcion: "Resumen diario, caja y reportes",
    icono: "calendar-check",
    color: "#F59E0B",
    colorLight: "#FFF7EA",
    articulos: [
      {
        id: "vd-1",
        titulo: "Cómo revisar las ventas del día",
        resumen: "Consulta el resumen completo de hoy.",
        pasos: [
          { texto: "Ve a Venta del día desde el menú principal." },
          {
            texto:
              "En la parte superior verás el widget de Caja con el total del día.",
          },
          {
            texto:
              "Debajo encontrarás la lista de todas las ventas realizadas hoy.",
          },
          { texto: "Cada tarjeta muestra: hora, cliente, productos y monto." },
          { texto: "Toca una venta para ver el detalle completo." },
        ],
      },
      {
        id: "vd-2",
        titulo: "Cómo anular una venta",
        resumen: "Cancela una venta realizada por error.",
        pasos: [
          { texto: "En Venta del día, localiza la venta que deseas anular." },
          { texto: "Toca la tarjeta de la venta para ver su detalle." },
          { texto: "Selecciona la opción Anular venta." },
          {
            texto:
              "Confirma la acción. La venta queda marcada como anulada y no se contabiliza en el total.",
          },
        ],
        tip: "Las ventas anuladas se muestran con un estado diferente pero quedan en el historial para auditoría.",
      },
      {
        id: "vd-3",
        titulo: "Cómo exportar el reporte del día",
        resumen: "Descarga un archivo Excel con tus ventas.",
        pasos: [
          {
            texto:
              "En Venta del día, busca el botón de exportar (ícono de hoja de cálculo).",
          },
          { texto: "Toca el botón y espera mientras se genera el archivo." },
          {
            texto:
              "Selecciona cómo quieres compartir el archivo: WhatsApp, correo, Google Drive, etc.",
          },
          {
            texto:
              "El archivo Excel incluye todas las ventas del día con sus detalles.",
          },
        ],
      },
    ],
  },

  // ── 6. Historial de ventas ─────────────────────────────────────────────────
  {
    id: "historial",
    titulo: "Historial de ventas",
    descripcion: "Consulta ventas anteriores con filtros",
    icono: "chart-line",
    color: "#14B8A6",
    colorLight: "#E9FFFC",
    articulos: [
      {
        id: "hist-1",
        titulo: "Cómo buscar ventas anteriores",
        resumen: "Filtra y encuentra ventas por fecha, cliente o estado.",
        pasos: [
          { texto: "Ve a Historial desde el menú principal." },
          {
            texto:
              "Usa los filtros en la parte superior para seleccionar un rango de fechas.",
          },
          {
            texto:
              "Puedes filtrar por estado: Todas, Paz y salvo, Debe o Anulada.",
          },
          {
            texto:
              "Escribe en la barra de búsqueda para encontrar ventas por nombre de cliente o número de factura.",
          },
          {
            texto:
              "Los resultados se actualizan automáticamente según tus filtros.",
          },
        ],
      },
      {
        id: "hist-2",
        titulo: "Cómo ver el detalle de una venta",
        resumen:
          "Revisa los productos, cobro y datos completos de cualquier venta.",
        pasos: [
          { texto: "En Historial, toca cualquier venta de la lista." },
          {
            texto:
              "Verás el detalle completo: fecha, hora, cliente, productos y cantidades.",
          },
          {
            texto:
              "También aparecerá el método de pago y el estado de la venta.",
          },
          { texto: "Desde aquí puedes anular la venta si es necesario." },
        ],
      },
    ],
  },

  // ── 7. Créditos ────────────────────────────────────────────────────────────
  {
    id: "creditos",
    titulo: "Créditos",
    descripcion: "Gestiona pagos pendientes y deudas",
    icono: "hand-coin",
    color: "#FF4D8D",
    colorLight: "#FFF0F6",
    articulos: [
      {
        id: "cred-1",
        titulo: "Cómo ver los créditos pendientes",
        resumen: "Revisa qué clientes tienen deudas activas.",
        pasos: [
          { texto: "Ve a Créditos desde el menú principal." },
          {
            texto: "Verás la lista de todos los clientes con saldo pendiente.",
          },
          {
            texto:
              "Cada tarjeta muestra el nombre del cliente y el monto total que debe.",
          },
          {
            texto:
              "Toca una tarjeta para ver el historial de ventas a crédito y abonos de ese cliente.",
          },
        ],
      },
      {
        id: "cred-2",
        titulo: "Cómo registrar un abono",
        resumen: "Registra cuando un cliente paga parte o todo su crédito.",
        pasos: [
          { texto: "Ve a Créditos y toca al cliente que está pagando." },
          { texto: "Toca el botón Registrar abono o el ícono de pago." },
          { texto: "Ingresa el monto que el cliente está pagando." },
          {
            texto:
              "Toca Guardar. El saldo pendiente se actualizará automáticamente.",
          },
          {
            texto:
              "Si el abono cubre toda la deuda, el crédito queda marcado como Paz y salvo.",
          },
        ],
        tip: "Puedes hacer abonos parciales cuantas veces sea necesario hasta saldar la deuda completa.",
      },
    ],
  },

  // ── 8. Gastos ──────────────────────────────────────────────────────────────
  {
    id: "gastos",
    titulo: "Gastos",
    descripcion: "Registra y controla tus gastos diarios",
    icono: "cash-minus",
    color: "#EF4444",
    colorLight: "#FEF2F2",
    articulos: [
      {
        id: "gasto-1",
        titulo: "Cómo registrar un gasto",
        resumen: "Lleva el control de lo que gastas en tu negocio.",
        pasos: [
          { texto: "Ve a Gastos desde el menú principal." },
          { texto: "Toca el botón + (agregar) en la parte inferior." },
          {
            texto:
              "Ingresa la descripción del gasto (ej: arriendo, servicios, insumos).",
          },
          { texto: "Escribe el monto del gasto." },
          {
            texto:
              "Toca Guardar. El gasto queda registrado con la fecha y hora actuales.",
          },
        ],
        tip: "Registrar todos los gastos te permite conocer la ganancia real de tu negocio al cerrar la caja.",
      },
      {
        id: "gasto-2",
        titulo: "Cómo eliminar un gasto",
        resumen: "Borra un gasto registrado por error.",
        pasos: [
          { texto: "Ve a Gastos y encuentra el gasto que quieres eliminar." },
          { texto: "Toca los tres puntos (···) de la tarjeta del gasto." },
          { texto: "Selecciona Eliminar y confirma la acción." },
        ],
      },
    ],
  },

  // ── 9. Historial de Caja ───────────────────────────────────────────────────
  {
    id: "historial-caja",
    titulo: "Historial de Caja",
    descripcion: "Revisa aperturas, cierres y cuadres",
    icono: "cash-register",
    color: "#6366F1",
    colorLight: "#EEF2FF",
    articulos: [
      {
        id: "caja-1",
        titulo: "Cómo revisar el historial de caja",
        resumen: "Consulta cada apertura y cierre de caja que has hecho.",
        pasos: [
          { texto: "Ve a Historial de Caja desde el menú principal." },
          { texto: "Verás una lista de todos los días en que abriste caja." },
          {
            texto:
              "Cada registro muestra: fecha, base inicial, total de ventas y cierre.",
          },
          {
            texto: "Toca un registro para ver el detalle completo de ese día.",
          },
        ],
      },
      {
        id: "caja-2",
        titulo: "Cómo cerrar la caja al final del día",
        resumen: "Registra el cierre y guarda el cuadre de caja.",
        pasos: [
          { texto: "Ve a Venta del día." },
          { texto: "En el widget de caja, toca el botón Cerrar caja." },
          { texto: "Ingresa el dinero físico que contaste en la caja." },
          {
            texto:
              "La app mostrará si hay diferencia entre lo esperado y lo contado.",
          },
          {
            texto:
              "Toca Confirmar cierre. El registro queda guardado en Historial de Caja.",
          },
        ],
        tip: "Cierra la caja todos los días para mantener un control exacto de tu efectivo.",
      },
    ],
  },

  // ── 10. Ajustes ────────────────────────────────────────────────────────────
  {
    id: "ajustes",
    titulo: "Ajustes",
    descripcion: "Configura tu aplicación",
    icono: "cog-outline",
    color: "#64748B",
    colorLight: "#F1F5F9",
    articulos: [
      {
        id: "aj-1",
        titulo: "Control de inventario",
        resumen: "Cómo activar o desactivar el seguimiento de stock.",
        pasos: [
          { texto: "Ve a Ajustes desde el menú principal." },
          {
            texto:
              "Busca la opción Control de inventario y toca el interruptor para activarlo o desactivarlo.",
          },
          {
            texto:
              "Con el inventario activo, el stock se descuenta automáticamente al hacer ventas.",
          },
          {
            texto:
              "Con el inventario inactivo, puedes vender sin restricción de stock.",
          },
        ],
      },
      {
        id: "aj-2",
        titulo: "Exportar base de datos",
        resumen: "Cómo hacer una copia de seguridad de tus datos.",
        pasos: [
          { texto: "Ve a Ajustes." },
          { texto: "Toca Descargar base de datos." },
          {
            texto:
              "Se abrirá el menú para compartir el archivo. Guárdalo en Google Drive, WhatsApp o donde prefieras.",
          },
          {
            texto:
              "Este archivo contiene todos tus productos, clientes, ventas y configuraciones.",
          },
        ],
        tip: "Haz una copia de seguridad periódicamente para no perder tu información.",
      },
    ],
  },
];
