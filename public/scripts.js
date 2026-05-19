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
let currentDate = new Date();

// Tabs Navigation
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.target).classList.add('active');
  });
});

// Month Navigation UI Elements
const elMonthDisplay = document.getElementById('current-month-display');
const btnPrevMonth = document.getElementById('btn-prev-month');
const btnNextMonth = document.getElementById('btn-next-month');
const elPrevMonthName = document.getElementById('prev-month-name');
const elNextMonthName = document.getElementById('next-month-name');

function updateMonthUI() {
  const options = { month: 'long', year: 'numeric' };
  let monthStr = currentDate.toLocaleDateString('es-AR', options);
  monthStr = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
  elMonthDisplay.textContent = monthStr;
  
  const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  
  elPrevMonthName.textContent = prevDate.toLocaleDateString('es-AR', { month: 'long' }).charAt(0).toUpperCase() + prevDate.toLocaleDateString('es-AR', { month: 'long' }).slice(1);
  elNextMonthName.textContent = nextDate.toLocaleDateString('es-AR', { month: 'long' }).charAt(0).toUpperCase() + nextDate.toLocaleDateString('es-AR', { month: 'long' }).slice(1);
  
  const now = new Date();
  if (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() === now.getMonth()) {
    btnNextMonth.disabled = true;
  } else {
    btnNextMonth.disabled = false;
  }
}

btnPrevMonth.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateMonthUI();
  cargarDatos();
});

btnNextMonth.addEventListener('click', () => {
  const now = new Date();
  if (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() >= now.getMonth()) return;
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateMonthUI();
  cargarDatos();
});

const inputFechaIngreso = document.querySelector('.input-fecha-ingreso');
const inputDescIngreso = document.querySelector('.input-des-ingreso');
const inputMontoIngreso = document.querySelector('.input-importe-ingreso');
const btnAgregarIngreso = document.querySelector('.btn-ingresos');
const tbodyIngresos = document.querySelector('.resultadoIngreso');

const inputFechaEgreso = document.querySelector('.fechaEgresos');
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
  updateMonthUI();
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

    const mes = currentDate.getMonth() + 1;
    const anio = currentDate.getFullYear();

    const [resIngresos, resEgresos] = await Promise.all([
      fetch(`${API_URL}/ingresos?mes=${mes}&anio=${anio}`),
      fetch(`${API_URL}/egresos?mes=${mes}&anio=${anio}`),
    ]);

    if (!resIngresos.ok || !resEgresos.ok) {
      throw new Error("Error al cargar datos del servidor");
    }

    ingresos = await resIngresos.json();
    egresos = await resEgresos.json();

    renderizarIngresos();
    renderizarEgresos();
    renderizarTop5('ingreso');
    renderizarTop5('egreso');
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
  const fechaInput = esIngreso ? inputFechaIngreso : inputFechaEgreso;
  const descInput = esIngreso ? inputDescIngreso : inputDescEgreso;
  const montoInput = esIngreso ? inputMontoIngreso : inputMontoEgreso;
  const endpoint = esIngreso ? '/ingresos' : '/egresos';

  if (!validarCampos(descInput, montoInput)) return;

  try {
    setLoading(true);

    const payload = {
      descripcion: descInput.value.trim(),
      monto: Number(montoInput.value),
    };

    if (fechaInput.value) {
      payload.fecha = fechaInput.value;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al guardar");
    }

    // El backend devuelve el registro completo con id y fecha asignados por MySQL
    const nuevoRegistro = await res.json();

    actualizarTotales();

    // Limpiar inputs
    fechaInput.value = '';
    descInput.value = '';
    montoInput.value = '';
    validarBoton(descInput, montoInput, esIngreso ? btnAgregarIngreso : btnAgregarEgreso);
    
    // Solo agregar si pertenece al mes actual que se está viendo
    const anioSeleccionado = currentDate.getFullYear();
    const mesSeleccionado = currentDate.getMonth() + 1;
    
    const fechaRegistro = new Date(nuevoRegistro.fecha);
    const registroAnio = fechaRegistro.getFullYear();
    const registroMes = fechaRegistro.getMonth() + 1;
    
    if (registroAnio === anioSeleccionado && registroMes === mesSeleccionado) {
      if (esIngreso) {
        ingresos.unshift(nuevoRegistro);
        renderizarIngresos();
        renderizarTop5('ingreso');
      } else {
        egresos.unshift(nuevoRegistro);
        renderizarEgresos();
        renderizarTop5('egreso');
      }
      actualizarTotales();
    } else {
      alert("Registro añadido a otro mes. Cambia de mes para visualizarlo.");
    }

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
      renderizarTop5('ingreso');
    } else {
      egresos = egresos.filter((t) => t.id !== id);
      renderizarEgresos();
      renderizarTop5('egreso');
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

function renderizarTop5(tipo) {
  const isIngreso = tipo === 'ingreso';
  const data = isIngreso ? ingresos : egresos;
  const container = document.getElementById(isIngreso ? 'top5-ingresos-container' : 'top5-egresos-container');
  const summary = document.getElementById(isIngreso ? 'top5-ingresos-summary' : 'top5-egresos-summary');
  
  container.innerHTML = '';
  summary.innerHTML = '';
  
  if (data.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:var(--text-muted)">No hay datos para este mes</p>`;
    return;
  }
  
  const map = {};
  let totalGeneral = 0;
  
  data.forEach(item => {
    const cat = item.descripcion.trim().toLowerCase();
    const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
    if (!map[catName]) map[catName] = 0;
    map[catName] += Number(item.monto);
    totalGeneral += Number(item.monto);
  });
  
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const top5 = sorted.slice(0, 5);
  
  let totalTop5 = 0;
  
  let tableHTML = `
    <div class="list-container" style="margin-bottom: 15px;">
      <table>
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Monto</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  let barsHTML = `<div class="top5-bars">`;
  
  top5.forEach(([cat, monto]) => {
    totalTop5 += monto;
    const pct = totalGeneral > 0 ? ((monto / totalGeneral) * 100).toFixed(1) : "0.0";
    
    tableHTML += `
      <tr>
        <td>${cat}</td>
        <td>${formatoMoneda(monto)}</td>
        <td>${pct}%</td>
      </tr>
    `;
    
    barsHTML += `
      <div class="top5-item">
        <div class="top5-header">
          <span class="top5-cat">${cat}</span>
        </div>
        <div class="top5-bar-bg">
          <div class="top5-bar-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  });
  
  tableHTML += `</tbody></table></div>`;
  barsHTML += `</div>`;
  
  container.innerHTML = tableHTML + barsHTML;
  
  const pctTop5 = totalGeneral > 0 ? ((totalTop5 / totalGeneral) * 100).toFixed(1) : "0.0";
  const resto = totalGeneral - totalTop5;
  const pctResto = totalGeneral > 0 ? (100 - pctTop5).toFixed(1) : "0.0";
  
  summary.innerHTML = `
    <h4>Subtotal Top 5</h4>
    <p>${formatoMoneda(totalTop5)} (${pctTop5}%)</p>
    <h4 style="margin-top: 10px;">Resto (${sorted.length > 5 ? sorted.length - 5 : 0} categorías)</h4>
    <p>${formatoMoneda(resto)} (${pctResto}%)</p>
  `;
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