const STORAGE_KEY = 'resumen-del-mes-transacciones';

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

document.addEventListener('DOMContentLoaded', () => {
  cargarDatosLocales();
  validarInputs();
});

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

function cargarDatosLocales() {
  try {
    setLoading(true);
    const guardadas = localStorage.getItem(STORAGE_KEY);
    const transacciones = guardadas ? JSON.parse(guardadas) : [];

    ingresos = transacciones.filter((t) => t.tipo === 'ingreso');
    egresos = transacciones.filter((t) => t.tipo === 'egreso');

    renderizarIngresos();
    renderizarEgresos();
    actualizarTotales();
  } catch (error) {
    console.error('Error cargando datos locales:', error);
    mostrarError('No se pudieron cargar tus datos guardados en este navegador.');
    ingresos = [];
    egresos = [];
  } finally {
    setLoading(false);
  }
}

function guardarDatosLocales() {
  const todas = [...ingresos, ...egresos];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todas));
}

function crearIdLocal() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

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

function agregarTransaccion(tipo) {
  if (isLoading) return;

  const esIngreso = tipo === 'ingreso';
  const descInput = esIngreso ? inputDescIngreso : inputDescEgreso;
  const montoInput = esIngreso ? inputMontoIngreso : inputMontoEgreso;

  const nuevaTransaccion = {
    id: crearIdLocal(),
    fecha: new Date().toISOString().split('T')[0],
    descripcion: descInput.value.trim(),
    monto: Number(montoInput.value),
    tipo,
  };

  if (esIngreso) {
    ingresos.push(nuevaTransaccion);
    renderizarIngresos();
  } else {
    egresos.push(nuevaTransaccion);
    renderizarEgresos();
  }

  guardarDatosLocales();
  actualizarTotales();

  descInput.value = '';
  montoInput.value = '';
  validarBoton(descInput, montoInput, esIngreso ? btnAgregarIngreso : btnAgregarEgreso);
}

function manejarClickTabla(e) {
  if (!e.target.closest('.btn-borrar')) return;

  const btn = e.target.closest('.btn-borrar');
  const id = Number(btn.dataset.id);

  if (!confirm('¿Estás seguro de eliminar este registro?')) return;

  ingresos = ingresos.filter((t) => t.id !== id);
  egresos = egresos.filter((t) => t.id !== id);

  guardarDatosLocales();
  renderizarIngresos();
  renderizarEgresos();
  actualizarTotales();
}

function renderizarIngresos() {
  tbodyIngresos.innerHTML = '';

  if (ingresos.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4" style="text-align: center; color: #666;">No hay ingresos registrados</td>';
    tbodyIngresos.appendChild(row);
    return;
  }

  const ingresosOrdenados = [...ingresos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  ingresosOrdenados.forEach((item) => {
    const row = document.createElement('tr');
    const fecha = new Date(`${item.fecha}T00:00:00`).toLocaleDateString('es-AR');

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
  tbodyEgresos.innerHTML = '';

  if (egresos.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4" style="text-align: center; color: #666;">No hay egresos registrados</td>';
    tbodyEgresos.appendChild(row);
    return;
  }

  const egresosOrdenados = [...egresos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  egresosOrdenados.forEach((item) => {
    const row = document.createElement('tr');
    const fecha = new Date(`${item.fecha}T00:00:00`).toLocaleDateString('es-AR');

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
  return numero.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function validarInputs() {
  validarBoton(inputDescIngreso, inputMontoIngreso, btnAgregarIngreso);
  validarBoton(inputDescEgreso, inputMontoEgreso, btnAgregarEgreso);
}


//Guardar datos en MySQL
async function guardarMovimiento(descripcion, importe, tipo) {
  try {
    const res = await fetch("http://localhost:3000/movimientos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        descripcion,
        importe: Number(importe),
        tipo // "ingreso" o "egreso"
      })
    });

    const data = await res.text();
    console.log(data);

  } catch (error) {
    console.error("Error al guardar:", error);
  }
}
// Guardar datos en MySQL
btnGuardarIngresos.addEventListener("click", () => {
  const descripcion = descripcionIngresos.value.trim();
  const importe = importesIngresos.value.trim();

  if (!descripcion || !importe) return;

  guardarMovimiento(descripcion, importe, "ingreso");

  descripcionIngresos.value = "";
  importesIngresos.value = "";
});

//egresos

btnGuardarEgresos.addEventListener("click", () => {
  const descripcion = descripcionEgresos.value.trim();
  const importe = importesEgresos.value.trim();

  if (!descripcion || !importe) return;

  guardarMovimiento(descripcion, importe, "egreso");

  descripcionEgresos.value = "";
  importesEgresos.value = "";
});

//obtener datos
async function obtenerMovimientos() {
  try {
    const res = await fetch("http://localhost:3000/movimientos");
    const data = await res.json();

    renderMovimientos(data);

  } catch (error) {
    console.error("Error al obtener:", error);
  }
}

//Renderizar (separar ingresos y egresos)

function renderMovimientos(data) {
  tbodyIngresos.innerHTML = "";
  tbodyEgresos.innerHTML = "";

  let totalIng = 0;
  let totalEgr = 0;

  data.forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.fecha}</td>
      <td>${item.descripcion}</td>
      <td>${Number(item.importe).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0
      })}</td>
    `;

    if (item.tipo === "ingreso") {
      tbodyIngresos.appendChild(row);
      totalIng += Number(item.importe);
    } else {
      tbodyEgresos.appendChild(row);
      totalEgr += Number(item.importe);
    }
  });

  actualizarTotales(totalIng, totalEgr);
}

//totales y saldo

function actualizarTotales(ingresos, egresos) {
  document.querySelector("#total-ingresos").textContent =
    ingresos.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 });

  document.querySelector("#total-egresos").textContent =
    egresos.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 });

  const saldo = ingresos - egresos;

  document.querySelector("#saldo-actual").textContent =
    saldo.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 });
}

//Ejecutar al cargar

document.addEventListener("DOMContentLoaded", () => {
  obtenerMovimientos();
});


//Agregar botón con ID
row.innerHTML = `
  <td>${item.fecha}</td>
  <td>${item.descripcion}</td>
  <td>${Number(item.importe).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0
  })}</td>
  <td>
    <button class="btn-borrar" data-id="${item.id}">Borrar</button>
  </td>
`;

//evento borrar
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-borrar")) {

    const id = e.target.dataset.id;

    await fetch(`http://localhost:3000/movimientos/${id}`, {
      method: "DELETE"
    });

    obtenerMovimientos(); // 🔥 recarga datos desde MySQL
  }
});