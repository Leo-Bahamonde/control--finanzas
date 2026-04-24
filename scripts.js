// === CONFIGURACIÓN API ===
const API_URL = '/api/transacciones';

// === Variables Globales ===
let ingresos = [];
let egresos = [];
let isLoading = false;

// === Selectores ===
// Ingresos
const inputDescIngreso = document.querySelector(".input-des-ingreso");
const inputMontoIngreso = document.querySelector(".input-importe-ingreso");
const btnAgregarIngreso = document.querySelector(".btn-ingresos");
const tbodyIngresos = document.querySelector(".resultadoIngreso");

// Egresos
const inputDescEgreso = document.querySelector(".descripcionEgresos");
const inputMontoEgreso = document.querySelector(".importesEgresos");
const btnAgregarEgreso = document.querySelector(".btn-guardarEgresos");
const tbodyEgresos = document.querySelector(".resultadoEgreso");

// Totales
const elTotalIngresos = document.querySelector("#total-ingresos");
const elTotalEgresos = document.querySelector("#total-egresos");
const elTotalDiezmo = document.querySelector("#total-diezmo");
const elSaldoActual = document.querySelector("#saldo-actual");

// === Inicialización ===
document.addEventListener("DOMContentLoaded", () => {
  cargarDatos();
  validarInputs(); // Estado inicial botones
});

// === Event Listeners ===
// Validaciones
[inputDescIngreso, inputMontoIngreso].forEach(el => el.addEventListener("input", () => validarBoton(inputDescIngreso, inputMontoIngreso, btnAgregarIngreso)));
[inputDescEgreso, inputMontoEgreso].forEach(el => el.addEventListener("input", () => validarBoton(inputDescEgreso, inputMontoEgreso, btnAgregarEgreso)));

// Agregar
btnAgregarIngreso.addEventListener("click", () => agregarTransaccion('ingreso'));
btnAgregarEgreso.addEventListener("click", () => agregarTransaccion('egreso'));

// Borrar (Delegación de eventos en tablas)
tbodyIngresos.addEventListener("click", (e) => manejarClickTabla(e));
tbodyEgresos.addEventListener("click", (e) => manejarClickTabla(e));

// === Funciones API ===

async function cargarDatos() {
  try {
    setLoading(true);
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error al cargar datos');
    }
    
    const todasTransacciones = result.data || [];
    
    // Separar por tipo
    ingresos = todasTransacciones.filter(t => t.tipo === 'ingreso');
    egresos = todasTransacciones.filter(t => t.tipo === 'egreso');

    renderizarIngresos();
    renderizarEgresos();
    actualizarTotales();
  } catch (error) {
    console.error('Error cargando datos:', error);
    mostrarError('No se pudieron cargar los datos. Por favor, recarga la página.');
    ingresos = [];
    egresos = [];
  } finally {
    setLoading(false);
  }
}

async function guardarTransaccion(transaccion) {
  try {
    setLoading(true);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaccion)
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error al guardar');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error guardando transacción:', error);
    mostrarError('No se pudo guardar la transacción. Intenta nuevamente.');
    throw error;
  } finally {
    setLoading(false);
  }
}

async function eliminarTransaccion(id) {
  try {
    setLoading(true);
    const response = await fetch(`${API_URL}?id=${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error al eliminar');
    }
    
    return true;
  } catch (error) {
    console.error('Error eliminando transacción:', error);
    mostrarError('No se pudo eliminar la transacción. Intenta nuevamente.');
    throw error;
  } finally {
    setLoading(false);
  }
}

// === Funciones de UI ===

function setLoading(loading) {
  isLoading = loading;
  
  // Deshabilitar botones durante carga
  btnAgregarIngreso.disabled = loading || !validarCampos(inputDescIngreso, inputMontoIngreso);
  btnAgregarEgreso.disabled = loading || !validarCampos(inputDescEgreso, inputMontoEgreso);
  
  // Agregar clase de loading si es necesario
  if (loading) {
    document.body.style.cursor = 'wait';
  } else {
    document.body.style.cursor = 'default';
  }
}

function mostrarError(mensaje) {
  alert(mensaje); // Simple por ahora, puedes mejorar con un toast/notification
}

function validarCampos(inputDesc, inputMonto) {
  return inputDesc.value.trim() !== "" && inputMonto.value.trim() !== "";
}

function validarBoton(inputDesc, inputMonto, btn) {
  if (validarCampos(inputDesc, inputMonto) && !isLoading) {
    btn.disabled = false; // Habilitar
    btn.classList.remove("btn-disabled");
  } else {
    btn.disabled = true; // Deshabilitar
    btn.classList.add("btn-disabled");
  }
}

async function agregarTransaccion(tipo) {
  if (isLoading) return;
  
  const esIngreso = tipo === 'ingreso';
  const descInput = esIngreso ? inputDescIngreso : inputDescEgreso;
  const montoInput = esIngreso ? inputMontoIngreso : inputMontoEgreso;
  
  const nuevaTransaccion = {
    fecha: new Date().toISOString().split('T')[0],
    descripcion: descInput.value.trim(),
    monto: parseFloat(montoInput.value),
    tipo: tipo
  };

  try {
    // Guardar en la base de datos
    const transaccionGuardada = await guardarTransaccion(nuevaTransaccion);
    
    // Agregar a la lista correspondiente con el ID del servidor
    if (esIngreso) {
      ingresos.push(transaccionGuardada);
    } else {
      egresos.push(transaccionGuardada);
    }

    // Renderizar y actualizar
    if (esIngreso) {
      renderizarIngresos();
    } else {
      renderizarEgresos();
    }
    actualizarTotales();

    // Limpiar y resetear validación
    descInput.value = "";
    montoInput.value = "";
    validarBoton(descInput, montoInput, esIngreso ? btnAgregarIngreso : btnAgregarEgreso);
  } catch (error) {
    // El error ya fue manejado en guardarTransaccion
  }
}

async function manejarClickTabla(e) {
  if (e.target.closest(".btn-borrar")) {
    const btn = e.target.closest(".btn-borrar");
    const id = parseInt(btn.dataset.id);
    
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      try {
        // Eliminar de la base de datos
        await eliminarTransaccion(id);
        
        // Eliminar de las listas locales
        ingresos = ingresos.filter(t => t.id !== id);
        egresos = egresos.filter(t => t.id !== id);

        // Renderizar
        renderizarIngresos();
        renderizarEgresos();
        actualizarTotales();
      } catch (error) {
        // El error ya fue manejado en eliminarTransaccion
      }
    }
  }
}

// === Funciones de Renderizado ===

function renderizarIngresos() {
  tbodyIngresos.innerHTML = "";
  
  if (ingresos.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="4" style="text-align: center; color: #666;">No hay ingresos registrados</td>`;
    tbodyIngresos.appendChild(row);
    return;
  }
  
  // Ordenar por fecha descendente
  const ingresosOrdenados = [...ingresos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  ingresosOrdenados.forEach(item => {
    const row = document.createElement("tr");
    const fecha = new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-AR');
    
    row.innerHTML = `
      <td>${fecha}</td>
      <td>${item.descripcion}</td>
      <td>${formatoMoneda(item.monto)}</td>
      <td class="acciones">
        <button class="btn btn-mini btn-borrar" data-id="${item.id}">X</button>
      </td>
    `;
    tbodyIngresos.appendChild(row);
  });
}

function renderizarEgresos() {
  tbodyEgresos.innerHTML = "";
  
  if (egresos.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="4" style="text-align: center; color: #666;">No hay egresos registrados</td>`;
    tbodyEgresos.appendChild(row);
    return;
  }
  
  // Ordenar por fecha descendente
  const egresosOrdenados = [...egresos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  egresosOrdenados.forEach(item => {
    const row = document.createElement("tr");
    const fecha = new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-AR');

    row.innerHTML = `
      <td>${fecha}</td>
      <td>${item.descripcion}</td>
      <td>${formatoMoneda(item.monto)}</td>
      <td class="acciones">
        <button class="btn btn-mini btn-borrar" data-id="${item.id}">X</button>
      </td>
    `;
    tbodyEgresos.appendChild(row);
  });
}

function actualizarTotales() {
  const totalIng = ingresos.reduce((acc, curr) => acc + Number(curr.monto), 0);
  const totalEgr = egresos.reduce((acc, curr) => acc + Number(curr.monto), 0);
  const diezmo = totalIng * 0.1;
  const saldo = totalIng - totalEgr;

  elTotalIngresos.textContent = formatoMoneda(totalIng);
  elTotalEgresos.textContent = formatoMoneda(totalEgr);
  elTotalDiezmo.textContent = formatoMoneda(diezmo);
  elSaldoActual.textContent = formatoMoneda(saldo);
}

function formatoMoneda(valor) {
  const numero = Number(valor);
  return numero.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// Función auxiliar para inicializar validaciones al cargar
function validarInputs() {
  validarBoton(inputDescIngreso, inputMontoIngreso, btnAgregarIngreso);
  validarBoton(inputDescEgreso, inputMontoEgreso, btnAgregarEgreso);
}
