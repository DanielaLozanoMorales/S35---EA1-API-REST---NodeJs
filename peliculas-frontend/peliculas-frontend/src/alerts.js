import Swal from "sweetalert2";

export const ok = (texto) =>
  Swal.fire({ icon: "success", title: texto, timer: 1600, showConfirmButton: false });
export const fail = (texto) => Swal.fire({ icon: "error", title: "No se pudo completar", text: texto });
export const confirmar = (texto) =>
  Swal.fire({
    icon: "warning", title: "¿Eliminar registro?", text: texto,
    showCancelButton: true, confirmButtonText: "Eliminar", cancelButtonText: "Cancelar",
    confirmButtonColor: "#b4472f",
  }).then((r) => r.isConfirmed);
