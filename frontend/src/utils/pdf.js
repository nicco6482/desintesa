import jsPDF from "jspdf";

export function exportServiceCertificateToPDF(certificateData) {
  const { order, folio, issuedAt } = certificateData;
  const doc = new jsPDF();

  doc.setFillColor(11, 78, 169);
  doc.rect(0, 0, 210, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("DESINTESA - CERTIFICADO DE SERVICIO", 14, 16);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  let y = 38;
  const line = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value || "N/A"), 70, y);
    y += 8;
  };

  line("Folio", folio);
  line("Cliente", order.clientName);
  line("ID Cliente", order.clientId);
  line("Direccion", order.location?.address);
  line("Ubicacion GPS", `${order.location?.gps?.lat}, ${order.location?.gps?.lng}`);
  line("Tipo de plaga", order.pestType);
  line("Nivel de infestacion", order.infestationLevel);
  line("Fecha de aplicacion", order.applicationDate);
  line("Proxima visita", order.nextVisitDate);
  line("Tecnico asignado", order.assignedTechnician);
  line("Fecha de emision", issuedAt ? new Date(issuedAt).toLocaleString("es-MX") : "Pendiente");

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Productos quimicos y registro sanitario", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  order.chemicalsUsed.forEach((chemical, index) => {
    doc.text(
      `${index + 1}. ${chemical.name} | Registro: ${chemical.sanitaryRegistry} | Cantidad: ${chemical.cantidadAplicada || "N/A"} ${chemical.dosisUnidad || ""} | Dilucion: ${chemical.dilucion || "N/A"} | Lote: ${chemical.lote || "N/A"}`,
      14,
      y
    );
    y += 7;
  });

  y += 4;
  doc.setDrawColor(21, 128, 61);
  doc.line(14, y, 196, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(
    "Cumplimiento normativo: servicio ejecutado bajo protocolo de sanidad ambiental y control integrado de plagas.",
    14,
    y,
    { maxWidth: 182 }
  );

  doc.save(`certificado_${folio || order.id}.pdf`);
}
