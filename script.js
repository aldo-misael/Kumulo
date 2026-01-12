import { db } from "./firebase.js";
import { collection, doc, setDoc, getDoc, getDocs }
    from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Crear fila dinámica con eliminación automática si está vacía
function crearFila(listaId) {
    const lista = document.getElementById(listaId);
    const fila = document.createElement("tr");

    const descInput = document.createElement("input");
    descInput.type = "text";
    descInput.placeholder = "Descripción";

    const montoInput = document.createElement("input");
    montoInput.type = "number";
    montoInput.value = "0";

    const celdaDesc = document.createElement("td");
    const celdaMonto = document.createElement("td");

    celdaDesc.appendChild(descInput);
    const montoWrapper = document.createElement("div");
    montoWrapper.className = "input-con-simbolo";

    const simbolo = document.createElement("span");
    simbolo.className = "simbolo";
    simbolo.textContent = "$";

    montoWrapper.appendChild(simbolo);
    montoWrapper.appendChild(montoInput);
    celdaMonto.appendChild(montoWrapper);

    fila.appendChild(celdaDesc);
    fila.appendChild(celdaMonto);
    lista.appendChild(fila);

    // Agrega nueva fila si es la última y se empieza a escribir
    [descInput, montoInput].forEach(input => {
        input.addEventListener("input", () => {
            if (fila === lista.lastElementChild && (descInput.value || montoInput.value > 0)) {
                crearFila(listaId);
            }
        });
    });
}

// Inicializar todas las listas dinámicas
["interesesLista", "ingresosBR", "accionesLista", "activosBR", "otrosPasivos", "pasivosBR", "gastosExtra"].forEach(id => crearFila(id));

// Eliminar filas vacías al hacer clic fuera
document.addEventListener("click", () => {
    ["interesesLista", "ingresosBR", "accionesLista", "activosBR", "otrosPasivos", "pasivosBR", "gastosExtra"].forEach(id => {
        const lista = document.getElementById(id);
        const filas = Array.from(lista.querySelectorAll("tr"));
        filas.forEach(fila => {
            const desc = fila.children[0].querySelector("input").value.trim();
            const monto = fila.children[1].querySelector("input").value.trim();
            if (!desc && (!monto || monto === "0") && fila !== lista.lastElementChild) {
                fila.remove();
            }
        });
    });
});

// Calcular totales y actualizar resumen
function calcularTotales() {
    let total = Number(document.getElementById("salario").value);

    // Sumar intereses y bienes raíces (ambos con inputs)
    document.querySelectorAll("#interesesLista input[type='number'], #ingresosBR input[type='number']").forEach(i => {
        total += Number(i.value);
    });

    document.getElementById("resumenIngresos").innerText = "$" + total.toFixed(3);

    let gastos = 0;
    document.querySelectorAll("#tablaGastos > tbody input[type='number']").forEach(i => gastos += Number(i.value));
    document.getElementById("resumenGastos").innerText = "-$" + gastos.toFixed(3);

    const pasivo = Array.from(document.querySelectorAll("#interesesLista input[type='number'], #ingresosBR input[type='number']"))
        .reduce((acc, el) => acc + Number(el.value), 0);
    //document.getElementById("resumenPasivo").innerText = "$" + pasivo;

    const payday = total - gastos;
    document.getElementById("resumenPayday").innerText = "$" + payday.toFixed(3);

    document.getElementById("valorPasivo").innerText = "$" + pasivo;
    document.getElementById("valorGastos").innerText = "$" + gastos;
    const barraVisual = document.getElementById("barraProgresoVisual");
    const porcentaje = gastos > 0 ? Math.min((pasivo / gastos) * 100, 100) : 0;
    barraVisual.style.width = porcentaje + "%";
    barraVisual.setAttribute("data-label", `$${pasivo}`);

    const estado = document.getElementById("estadoCarrera");
    estado.innerText = pasivo >= gastos
        ? "¡Has salido de la carrera de la rata! 🏁"
        : "Aún estás en la carrera de la rata...";
}

//Ajustar total de ingresos al modificar el salario
//document.getElementById("salario").addEventListener("input", calcularTotales);

// Día de Pago: botón y modal
const btnPayday = document.getElementById("btnPayday");
const modal = document.getElementById("modalConfirmacion");
const confirmar = document.getElementById("confirmarPago");
const cancelar = document.getElementById("cancelarPago");

btnPayday.addEventListener("click", () => {
    modal.classList.remove("hidden");
});

cancelar.addEventListener("click", () => {
    modal.classList.add("hidden");
});

confirmar.addEventListener("click", async () => {
    const payday = parseFloat(document.getElementById("resumenPayday").innerText.replace("$", "")) || 0;
    const efectivoActual = parseFloat(document.getElementById("resumenEfectivo").innerText.replace("$", "")) || 0;
    const nuevoEfectivo = efectivoActual + payday;
    document.getElementById("resumenEfectivo").innerText = "$" + nuevoEfectivo.toFixed(2);

    //Hipoteca
    const gastoHipoteca = parseFloat(document.getElementById("gastoHipoteca").value) || 0;
    const pasivoHipotecaInput = document.getElementById("pasivoHipoteca");

    if (pasivoHipotecaInput) {
        let deudaActual = parseFloat(pasivoHipotecaInput.value) || 0;
        pasivoHipotecaInput.value = Math.max(deudaActual - gastoHipoteca, 0).toFixed(2);
        let calculo = parseFloat(pasivoHipotecaInput.value) / parseFloat(gastoHipoteca);
        if (calculo < 1) {
            document.getElementById("gastoHipoteca").value = parseFloat(pasivoHipotecaInput.value);
        }
    }

    //Auto
    const gastoAuto = parseFloat(document.getElementById("gastoAuto").value) || 0;
    const pasivoAutoInput = document.getElementById("pasivoAuto");

    if (pasivoAutoInput) {
        let deudaActual = parseFloat(pasivoAutoInput.value) || 0;
        pasivoAutoInput.value = Math.max(deudaActual - gastoAuto, 0).toFixed(2);
        let calculo = parseFloat(pasivoAutoInput.value) / parseFloat(gastoAuto);
        if (calculo < 1) {
            document.getElementById("gastoAuto").value = parseFloat(pasivoAutoInput.value);
        }
    }

    //Tarjeta Credito
    const gastoTC = parseFloat(document.getElementById("gastoTC").value) || 0;
    const pasivoTCInput = document.getElementById("pasivoTC");

    if (pasivoTCInput) {
        let deudaActual = parseFloat(pasivoTCInput.value) || 0;
        pasivoTCInput.value = Math.max(deudaActual - gastoTC, 0).toFixed(2);
        let calculo = parseFloat(pasivoTCInput.value) / parseFloat(gastoTC);
        if (calculo < 1) {
            document.getElementById("gastoTC").value = parseFloat(pasivoTCInput.value);
        }
    }

    //Deuda de Tienda
    const gastoTienda = parseFloat(document.getElementById("gastoTienda").value) || 0;
    const pasivoTiendaInput = document.getElementById("pasivoTienda");

    if (pasivoTiendaInput) {
        let deudaActual = parseFloat(pasivoTiendaInput.value) || 0;
        pasivoTiendaInput.value = Math.max(deudaActual - gastoTienda, 0).toFixed(2);
        let calculo = parseFloat(pasivoTiendaInput.value) / parseFloat(gastoTienda);
        if (calculo < 1) {
            document.getElementById("gastoTienda").value = parseFloat(pasivoTiendaInput.value);
        }
    }

    const datos = recolectarDatos(); // tu función que arma ingresos, gastos, activos, pasivos, resumen
    const fechaHoy = new Date().toISOString().split("T")[0];

    try {
        await setDoc(doc(db, "EstadosFinancieros", fechaHoy), datos);
        calcularTotales();
        console.log("Datos guardados en Día de Pago ✅");
        mostrarToast("Datos guardados ✅");
    } catch (e) {
        console.error("Error al guardar Día de Pago:", e);
        mostrarToast("Error al guardar Día de Pago:", e);
    }

    modal.classList.add("hidden");
});

function activarRecalculoEnCampos(selector) {
    document.addEventListener("input", e => {
        if (e.target.matches(selector)) {
            calcularTotales();
        }
    });
}
activarRecalculoEnCampos("input[type='number']");

window.addEventListener("DOMContentLoaded", () => {
    calcularTotales();
});

const resumenEfectivo = document.getElementById("resumenEfectivo");
const editEfectivo = document.getElementById("editEfectivo");

editEfectivo.addEventListener("click", () => {
    resumenEfectivo.setAttribute("contenteditable", "true");
    resumenEfectivo.focus();
});

resumenEfectivo.addEventListener("blur", () => {
    resumenEfectivo.removeAttribute("contenteditable");
    const nuevoValor = resumenEfectivo.innerText.replace("$", "").trim();
    console.log("Nuevo efectivo:", nuevoValor);
    // Aquí podrías guardar en Firestore
});

function recolectarPasivos() {
    const pasivos = {};

    // Pasivos fijos con IDs
    pasivos["Hipoteca de Casa"] = parseFloat(document.getElementById("pasivoHipoteca").value) || 0;
    pasivos["Préstamos de Auto"] = parseFloat(document.getElementById("pasivoAuto").value) || 0;
    pasivos["Tarjetas de Crédito"] = parseFloat(document.getElementById("pasivoTC").value) || 0;
    pasivos["Deuda de Tienda"] = parseFloat(document.getElementById("pasivoTienda").value) || 0;

    // Pasivos dinámicos: otros préstamos
    pasivos["OtrosPasivos"] = [];
    document.querySelectorAll("#otrosPasivos tr").forEach(fila => {
        const desc = fila.querySelector("input[type='text']")?.value || "";
        const monto = parseFloat(fila.querySelector("input[type='number']")?.value) || 0;
        if (desc || monto > 0) pasivos["OtrosPasivos"].push({ descripcion: desc, monto });
    });

    // Pasivos dinámicos: bienes raíces / negocios
    pasivos["PasivosBR"] = [];
    document.querySelectorAll("#pasivosBR tr").forEach(fila => {
        const desc = fila.querySelector("input[type='text']")?.value || "";
        const monto = parseFloat(fila.querySelector("input[type='number']")?.value) || 0;
        if (desc || monto > 0) pasivos["PasivosBR"].push({ descripcion: desc, monto });
    });

    return pasivos;
}

function recolectarDatos() {
    // --- Ingresos ---
    const ingresos = {
        Salario: parseFloat(document.getElementById("salario").value) || 0,
        Intereses: [],
        BienesRaicesNegocios: []
    };

    document.querySelectorAll("#interesesLista tr").forEach(fila => {
        const desc = fila.querySelector("input[type='text']")?.value || "";
        const monto = parseFloat(fila.querySelector("input[type='number']")?.value) || 0;
        if (desc || monto > 0) ingresos.Intereses.push({ descripcion: desc, monto });
    });

    document.querySelectorAll("#ingresosBR tr").forEach(fila => {
        const desc = fila.querySelector("input[type='text']")?.value || "";
        const monto = parseFloat(fila.querySelector("input[type='number']")?.value) || 0;
        if (desc || monto > 0) ingresos.BienesRaicesNegocios.push({ descripcion: desc, monto });
    });

    // --- Gastos ---
    const gastos = {};

    // Gastos fijos (los que tienen nombre en la primera celda)
    document.querySelectorAll("#tablaGastos tr").forEach(fila => {
        const nombre = fila.querySelector("td:first-child")?.innerText || "";
        const monto = parseFloat(fila.querySelector("input[type='number']")?.value) || 0;
        if (nombre) gastos[nombre] = monto;
    });

    // Gastos dinámicos (tbody con id="gastosExtra")
    gastos.OtrosGastos = [];
    document.querySelectorAll("#gastosExtra tr").forEach(fila => {
        const desc = fila.querySelector("input[type='text']")?.value.trim();
        const monto = parseFloat(fila.querySelector("input[type='number']")?.value) || 0;
        if (desc || monto > 0) {
            gastos.OtrosGastos.push({ descripcion: desc, monto });
        }
    });

    // --- Activos ---
    const activos = {
        AccionesFondos: [],
        BienesRaicesNegocios: []
    };

    document.querySelectorAll("#accionesLista tr").forEach(fila => {
        const desc = fila.querySelector("input[type='text']")?.value || "";
        const monto = parseFloat(fila.querySelector("input[type='number']")?.value) || 0;
        if (desc || monto > 0) activos.AccionesFondos.push({ descripcion: desc, monto });
    });

    document.querySelectorAll("#activosBR tr").forEach(fila => {
        const desc = fila.querySelector("input[type='text']")?.value || "";
        const monto = parseFloat(fila.querySelector("input[type='number']")?.value) || 0;
        if (desc || monto > 0) activos.BienesRaicesNegocios.push({ descripcion: desc, monto });
    });

    // --- Pasivos ---
    const pasivos = recolectarPasivos();

    // --- Resumen ---
    const resumen = {
        efectivo: parseFloat(
            document.getElementById("resumenEfectivo").innerText.replace("$", "")
        ) || 0
    };

    return { ingresos, gastos, activos, pasivos, resumen };
}

const modal2 = document.getElementById("modalGuardar");
const confirmar2 = document.getElementById("confirmarPago2");
const cancelar2 = document.getElementById("cancelarPago2");
document.getElementById("btnGuardar").addEventListener("click", async () => {
    modal2.classList.remove("hidden");
});

cancelar2.addEventListener("click", () => {
    modal2.classList.add("hidden");
});

confirmar2.addEventListener("click", async () => {
    const datos = recolectarDatos();
    const fechaHoy = new Date().toISOString().split("T")[0]; // ej: 2026-01-11

    try {
        await setDoc(doc(db, "EstadosFinancieros", fechaHoy), datos);
        console.log("Datos guardados correctamente ✅");
        mostrarToast("Datos guardados ✅");
    } catch (e) {
        console.error("Error al guardar: ", e);
        mostrarToast("Error al guardar: ", e);
    }
    modal2.classList.add("hidden");
});

// Auxiliar: asegura que existan suficientes filas en una lista dinámica
function asegurarFilas(listaId, cantidad) {
    const lista = document.getElementById(listaId);
    while (lista.querySelectorAll("tr").length < cantidad) {
        crearFila(listaId); // usa tu función original que ya pone el símbolo $ y listeners
    }
}

// Función que recibe un objeto y asigna valores a la página
function cargarDatosDesdeObjeto(datos) {
    // INGRESOS
    document.getElementById("salario").value = datos.ingresos.Salario || 0;

    asegurarFilas("interesesLista", datos.ingresos.Intereses?.length || 0);
    document.querySelectorAll("#interesesLista tr").forEach((fila, i) => {
        const item = datos.ingresos.Intereses?.[i];
        if (item) {
            fila.querySelector("input[type='text']").value = item.descripcion;
            fila.querySelector("input[type='number']").value = item.monto;
        }
    });

    asegurarFilas("ingresosBR", datos.ingresos.BienesRaicesNegocios?.length || 0);
    document.querySelectorAll("#ingresosBR tr").forEach((fila, i) => {
        const item = datos.ingresos.BienesRaicesNegocios?.[i];
        if (item) {
            fila.querySelector("input[type='text']").value = item.descripcion;
            fila.querySelector("input[type='number']").value = item.monto;
        }
    });

    // GASTOS
    document.getElementById("gastoImpuestos").value = datos.gastos["Impuestos"] || 0;
    document.getElementById("gastoHipoteca").value = datos.gastos["Hipoteca de Casa"] || 0;
    document.getElementById("gastoAuto").value = datos.gastos["Préstamo de Auto"] || 0;
    document.getElementById("gastoTC").value = datos.gastos["Tarjeta de Crédito"] || 0;
    document.getElementById("gastoTienda").value = datos.gastos["Deuda de Tienda"] || 0;
    document.getElementById("otrosGastos").value = datos.gastos["Otros Gastos"] || 0;

    asegurarFilas("gastosExtra", datos.gastos.OtrosGastos?.length || 0);
    document.querySelectorAll("#gastosExtra tr").forEach((fila, i) => {
        const item = datos.gastos.OtrosGastos?.[i];
        if (item) {
            fila.querySelector("input[type='text']").value = item.descripcion;
            fila.querySelector("input[type='number']").value = item.monto;
        }
    });

    // ACTIVOS
    asegurarFilas("accionesLista", datos.activos.AccionesFondos?.length || 0);
    document.querySelectorAll("#accionesLista tr").forEach((fila, i) => {
        const item = datos.activos.AccionesFondos?.[i];
        if (item) {
            fila.querySelector("input[type='text']").value = item.descripcion;
            fila.querySelector("input[type='number']").value = item.monto;
        }
    });

    asegurarFilas("activosBR", datos.activos.BienesRaicesNegocios?.length || 0);
    document.querySelectorAll("#activosBR tr").forEach((fila, i) => {
        const item = datos.activos.BienesRaicesNegocios?.[i];
        if (item) {
            fila.querySelector("input[type='text']").value = item.descripcion;
            fila.querySelector("input[type='number']").value = item.monto;
        }
    });

    // PASIVOS
    document.getElementById("pasivoHipoteca").value = datos.pasivos["Hipoteca de Casa"] || 0;
    document.getElementById("pasivoAuto").value = datos.pasivos["Préstamos de Auto"] || 0;
    document.getElementById("pasivoTC").value = datos.pasivos["Tarjetas de Crédito"] || 0;
    document.getElementById("pasivoTienda").value = datos.pasivos["Deuda de Tienda"] || 0;

    asegurarFilas("otrosPasivos", datos.pasivos.OtrosPasivos?.length || 0);
    document.querySelectorAll("#otrosPasivos tr").forEach((fila, i) => {
        const item = datos.pasivos.OtrosPasivos?.[i];
        if (item) {
            fila.querySelector("input[type='text']").value = item.descripcion;
            fila.querySelector("input[type='number']").value = item.monto;
        }
    });

    asegurarFilas("pasivosBR", datos.pasivos.PasivosBR?.length || 0);
    document.querySelectorAll("#pasivosBR tr").forEach((fila, i) => {
        const item = datos.pasivos.PasivosBR?.[i];
        if (item) {
            fila.querySelector("input[type='text']").value = item.descripcion;
            fila.querySelector("input[type='number']").value = item.monto;
        }
    });

    // RESUMEN (solo efectivo)
    if (datos.resumen?.efectivo !== undefined) {
        document.getElementById("resumenEfectivo").innerText = `$${datos.resumen.efectivo.toFixed(3)}`;
    }

    if (typeof calcularTotales === "function") calcularTotales();
    console.log("Datos cargados en la página ✅");
    mostrarToast("Datos cargados en la página ✅");
}

// Función para traer la colección más reciente
async function cargarMasReciente() {
    try {
        const snapshot = await getDocs(collection(db, "EstadosFinancieros"));
        if (!snapshot.empty) {
            // Obtener todos los IDs (fechas)
            const fechas = snapshot.docs.map(doc => doc.id);
            fechas.sort((a, b) => b.localeCompare(a)); // orden descendente
            const ultimaFecha = fechas[0];
            const datos = snapshot.docs.find(d => d.id === ultimaFecha).data();

            console.log("Cargando colección más reciente:", ultimaFecha);
            cargarDatosDesdeObjeto(datos);
        }
    } catch (e) {
        console.error("Error al cargar colección más reciente:", e);
    }
}

// Ejecutar al abrir la página
window.addEventListener("DOMContentLoaded", cargarMasReciente);

document.getElementById("btnActualizar").addEventListener("click", async () => {
    cargarMasReciente();
});

function mostrarToast(mensaje) {
    const toast = document.createElement("div");
    toast.className = "toast show";
    toast.innerText = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}