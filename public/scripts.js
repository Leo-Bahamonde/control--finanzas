// ============================================================
// Control de Finanzas — Frontend
// Conecta con backend Express (mismo origen via express.static)
// Rutas: GET/POST/DELETE /ingresos y /egresos
// ============================================================

// URL base vacía = rutas relativas al mismo origen.
// Funciona tanto en localhost:3000 como en producción (Render),
// porque Express sirve el frontend y la API desde el mismo servidor.
const API_URL = "";

let ingresos = [];
let egresos = [];
let isLoading = false;

const inputDescIngreso = document.querySelector('.input-des-ingreso');
const inputMontoIngreso = document.querySelector('.input-importe-ingreso');
const btnAgregarIngreso = document.querySelector('.btn-ingresos');
const tbodyIngresos = document.querySelector('.resultadoIngreso');

const inputDescEgreso = document.querySelector('.descripcionEgresos');
const inputMontoEgreso = document.querySelector('.importesEgresos');
const btnAgregarEgreso = document.querySelector('.btn-guardarEgresos');
const tbodyEgresos = document.querySelector('.resultadoEgreso');

const elTotalIngresos = document.querySelector('#total-ingresos');
const elTotalEgresos = document.querySelector('#total-egresos');
const elTotalDiezmo = document.querySelector('#total-diezmo');
const elSaldoActual = document.querySelector('#saldo-actual');

// === Inicialización ===

document.addEventListener('DOMContentLoaded', () => {
  cargarDatos();
  validarInputs();
});

// === Listeners de inputs (validación en tiempo real) ===

[inputDescIngreso, inputMontoIngreso].forEach((el) => {
  el.addEventListener('input', () => validarBoton(inputDescIngreso, inputMontoIngreso, btnAgregarIngreso));
});

[inputDescEgreso, inputMontoEgreso].forEach((el) => {
  el.addEventListener('input', () => validarBoton(inputDescEgreso, inputMontoEgreso, btnAgregarEgreso));
});

btnAgregarIngreso.addEventListener('click', () => agregarTransaccion('ingreso'));
btnAgregarEgreso.addEventListener('click', () => agregarTransaccion('egreso'));

tbodyIngresos.addEventListener('click', manejarClickTabla);
tbodyEgresos.addEventListener('click', manejarClickTabla);

// === Comunicación con el Backend (fetch) ===

// Carga ingresos y egresos en paralelo desde MySQL via Express
async function cargarDatos() {
  try {
    setLoading(true);

    const [resIngresos, resEgresos] = await Promise.all([
      fetch(`${API_URL}/ingresos`),
      fetch(`${API_URL}/egresos`),
    ]);

    if (!resIngresos.ok || !resEgresos.ok) {
      throw new Error("Error al cargar datos del servidor");
    }

    ingresos = await resIngresos.json();
    egresos = await resEgresos.json();

    renderizarIngresos();
    renderizarEgresos();
    actualizarTotales();
  } catch (error) {
    console.error('Error cargando datos:', error);
    mostrarError('No se pudieron cargar los datos. ¿Está corriendo el servidor?');
  } finally {
    setLoading(false);
  }
}

async function agregarTransaccion(tipo) {
  if (isLoading) return;

  const esIngreso = tipo === 'ingreso';
  const descInput = esIngreso ? inputDescIngreso : inputDescEgreso;
  const montoInput = esIngreso ? inputMontoIngreso : inputMontoEgreso;
  const endpoint = esIngreso ? '/ingresos' : '/egresos';

  if (!validarCampos(descInput, montoInput)) return;

  try {
    setLoading(true);

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descripcion: descInput.value.trim(),
        monto: Number(montoInput.value),
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al guardar");
    }

    // El backend devuelve el registro completo con id y fecha asignados por MySQL
    const nuevoRegistro = await res.json();

    if (esIngreso) {
      ingresos.unshift(nuevoRegistro); // Al inicio porque ordenamos DESC
      renderizarIngresos();
    } else {
      egresos.unshift(nuevoRegistro);
      renderizarEgresos();
    }

    actualizarTotales();

    // Limpiar inputs
    descInput.value = '';
    montoInput.value = '';
    validarBoton(descInput, montoInput, esIngreso ? btnAgregarIngreso : btnAgregarEgreso);
  } catch (error) {
    console.error(`Error al guardar ${tipo}:`, error);
    mostrarError(`No se pudo guardar el ${tipo}. ${error.message}`);
  } finally {
    setLoading(false);
  }
}

async function manejarClickTabla(e) {
  if (!e.target.closest('.btn-borrar')) return;

  const btn = e.target.closest('.btn-borrar');
  const id = Number(btn.dataset.id);
  const tipo = btn.dataset.tipo;

  if (!confirm('¿Estás seguro de eliminar este registro?')) return;

  const endpoint = tipo === 'ingreso' ? '/ingresos' : '/egresos';

  try {
    setLoading(true);

    const res = await fetch(`${API_URL}${endpoint}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al eliminar");
    }

    // Eliminar del array local sin necesidad de recargar todo desde el servidor
    if (tipo === 'ingreso') {
      ingresos = ingresos.filter((t) => t.id !== id);
      renderizarIngresos();
    } else {
      egresos = egresos.filter((t) => t.id !== id);
      renderizarEgresos();
    }

    actualizarTotales();
  } catch (error) {
    console.error("Error al eliminar:", error);
    mostrarError(`No se pudo eliminar. ${error.message}`);
  } finally {
    setLoading(false);
  }
}

// === Renderizado de tablas ===

function renderizarIngresos() {
  tbodyIngresos.innerHTML = '';

  if (ingresos.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4" style="text-align: center; color: #666;">No hay ingresos registrados</td>';
    tbodyIngresos.appendChild(row);
    return;
  }

  ingresos.forEach((item) => {
    const row = document.createElement('tr');
    const fecha = new Date(item.fecha).toLocaleDateString('es-AR');

    row.innerHTML = `
      <td>${fecha}</td>
      <td>${item.descripcion}</td>
      <td>${formatoMoneda(item.monto)}</td>
      <td class="acciones">
        <button class="btn btn-mini btn-borrar" data-id="${item.id}" data-tipo="ingreso">X</button>
      </td>
    `;
    tbodyIngresos.appendChild(row);
  });
}

function renderizarEgresos() {
  tbodyEgresos.innerHTML = '';

  if (egresos.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4" style="text-align: center; color: #666;">No hay egresos registrados</td>';
    tbodyEgresos.appendChild(row);
    return;
  }

  egresos.forEach((item) => {
    const row = document.createElement('tr');
    const fecha = new Date(item.fecha).toLocaleDateString('es-AR');

    row.innerHTML = `
      <td>${fecha}</td>
      <td>${item.descripcion}</td>
      <td>${formatoMoneda(item.monto)}</td>
      <td class="acciones">
        <button class="btn btn-mini btn-borrar" data-id="${item.id}" data-tipo="egreso">X</button>
      </td>
    `;
    tbodyEgresos.appendChild(row);
  });
}

// === Cálculos y utilidades ===

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
  return numero.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// === UI helpers ===

function setLoading(loading) {
  isLoading = loading;
  btnAgregarIngreso.disabled = loading || !validarCampos(inputDescIngreso, inputMontoIngreso);
  btnAgregarEgreso.disabled = loading || !validarCampos(inputDescEgreso, inputMontoEgreso);
  document.body.style.cursor = loading ? 'wait' : 'default';
}

function mostrarError(mensaje) {
  alert(mensaje);
}

function validarCampos(inputDesc, inputMonto) {
  const descripcionOk = inputDesc.value.trim() !== '';
  const monto = Number(inputMonto.value);
  return descripcionOk && Number.isFinite(monto) && monto > 0;
}

function validarBoton(inputDesc, inputMonto, btn) {
  if (validarCampos(inputDesc, inputMonto) && !isLoading) {
    btn.disabled = false;
    btn.classList.remove('btn-disabled');
  } else {
    btn.disabled = true;
    btn.classList.add('btn-disabled');
  }
}

function validarInputs() {
  validarBoton(inputDescIngreso, inputMontoIngreso, btnAgregarIngreso);
  validarBoton(inputDescEgreso, inputMontoEgreso, btnAgregarEgreso);
}