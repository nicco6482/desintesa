const express = require("express");
const { randomUUID } = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { readOrders, writeOrders } = require("../utils/dataStore");

const router = express.Router();

const ALLOWED_INFESTATION_LEVELS = ["bajo", "medio", "alto"];
const ALLOWED_STATUS = ["programado", "completado", "cancelado"];
const CHEMICALS_FILE = path.join(__dirname, "..", "data", "chemicals.json");

async function readChemicals() {
  const content = await fs.readFile(CHEMICALS_FILE, "utf-8");
  return JSON.parse(content);
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateChemicals(chemicals) {
  if (!Array.isArray(chemicals) || chemicals.length === 0) {
    return "Debe incluir al menos un producto quimico.";
  }

  for (const chemical of chemicals) {
    if (!chemical?.name || !chemical?.sanitaryRegistry) {
      return "Cada producto quimico requiere nombre y registro sanitario.";
    }
    if (chemical?.cantidadAplicada === undefined || chemical?.cantidadAplicada === null || chemical?.cantidadAplicada === "") {
      return "Cada producto quimico requiere cantidad aplicada.";
    }
    if (!chemical?.dilucion || !chemical?.lote) {
      return "Cada producto quimico requiere dilucion y lote.";
    }
  }
  return null;
}

function validateOrderPayload(payload, options = { partial: false }) {
  const errors = [];
  const partial = options.partial === true;

  const requiredFields = [
    "clientId",
    "clientName",
    "location",
    "assignedTechnician",
    "pestType",
    "infestationLevel",
    "chemicalsUsed",
    "applicationDate",
    "nextVisitDate"
  ];

  if (!partial) {
    requiredFields.forEach((field) => {
      if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
        errors.push(`El campo '${field}' es obligatorio.`);
      }
    });
  }

  if (payload.infestationLevel && !ALLOWED_INFESTATION_LEVELS.includes(payload.infestationLevel)) {
    errors.push("El nivel de infestacion debe ser bajo, medio o alto.");
  }

  if (payload.status && !ALLOWED_STATUS.includes(payload.status)) {
    errors.push("El estado debe ser programado, completado o cancelado.");
  }

  if (payload.location) {
    const { address, gps } = payload.location;
    if (!address) {
      errors.push("La direccion del servicio es obligatoria.");
    }
    if (!gps || typeof gps.lat !== "number" || typeof gps.lng !== "number") {
      errors.push("La ubicacion GPS debe incluir lat y lng numericos.");
    }
  }

  if (payload.chemicalsUsed !== undefined) {
    const chemicalsError = validateChemicals(payload.chemicalsUsed);
    if (chemicalsError) errors.push(chemicalsError);
  }

  if (payload.applicationDate || payload.nextVisitDate) {
    const applicationDate = parseDate(payload.applicationDate);
    const nextVisitDate = parseDate(payload.nextVisitDate);

    if (!applicationDate) {
      errors.push("La fecha de aplicacion es invalida.");
    }
    if (!nextVisitDate) {
      errors.push("La fecha de proxima visita es invalida.");
    }
    if (applicationDate && nextVisitDate && nextVisitDate <= applicationDate) {
      errors.push("La fecha de proxima visita debe ser posterior a la fecha de aplicacion.");
    }
  }

  return errors;
}

router.get("/orders", async (req, res, next) => {
  try {
    const { clientId, status } = req.query;
    const orders = await readOrders();
    const filtered = orders.filter((order) => {
      const byClient = clientId ? order.clientId === clientId : true;
      const byStatus = status ? order.status === status : true;
      return byClient && byStatus;
    });
    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

router.get("/chemicals", async (req, res, next) => {
  try {
    const chemicals = await readChemicals();
    res.json(chemicals);
  } catch (error) {
    next(error);
  }
});

router.post("/orders", async (req, res, next) => {
  try {
    const payload = req.body;
    const errors = validateOrderPayload(payload);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const orders = await readOrders();
    const now = new Date().toISOString();
    const newOrder = {
      id: randomUUID(),
      clientId: payload.clientId,
      clientName: payload.clientName,
      location: payload.location,
      assignedTechnician: payload.assignedTechnician,
      pestType: payload.pestType,
      infestationLevel: payload.infestationLevel,
      chemicalsUsed: payload.chemicalsUsed,
      applicationDate: payload.applicationDate,
      nextVisitDate: payload.nextVisitDate,
      status: payload.status || "programado",
      serviceNotes: payload.serviceNotes || "",
      certificate: {
        issued: false,
        issuedAt: null,
        folio: null
      },
      createdAt: now,
      updatedAt: now
    };

    orders.push(newOrder);
    await writeOrders(orders);
    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
});

router.put("/orders/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const orders = await readOrders();
    const index = orders.findIndex((order) => order.id === id);

    if (index === -1) {
      return res.status(404).json({ message: "Orden no encontrada." });
    }

    const updatedCandidate = {
      ...orders[index],
      ...payload,
      location: payload.location ? { ...orders[index].location, ...payload.location } : orders[index].location,
      certificate: payload.certificate ? { ...orders[index].certificate, ...payload.certificate } : orders[index].certificate
    };

    const errors = validateOrderPayload(updatedCandidate, { partial: false });
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    updatedCandidate.updatedAt = new Date().toISOString();
    orders[index] = updatedCandidate;
    await writeOrders(orders);
    res.json(updatedCandidate);
  } catch (error) {
    next(error);
  }
});

router.delete("/orders/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const orders = await readOrders();
    const index = orders.findIndex((order) => order.id === id);

    if (index === -1) {
      return res.status(404).json({ message: "Orden no encontrada." });
    }

    const [deleted] = orders.splice(index, 1);
    await writeOrders(orders);
    res.json({ message: "Orden eliminada.", deleted });
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard/:clientId", async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const orders = await readOrders();
    const clientOrders = orders.filter((order) => order.clientId === clientId);

    const pendingCertificates = clientOrders
      .filter((order) => order.status === "completado" && !order.certificate?.issued)
      .sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));

    const visitHistory = clientOrders
      .filter((order) => order.status === "completado")
      .sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));

    res.json({
      clientId,
      pendingCertificates,
      visitHistory
    });
  } catch (error) {
    next(error);
  }
});

router.get("/agenda", async (req, res, next) => {
  try {
    const orders = await readOrders();
    const agenda = orders
      .filter((order) => order.status !== "cancelado")
      .sort((a, b) => new Date(a.nextVisitDate) - new Date(b.nextVisitDate));
    res.json(agenda);
  } catch (error) {
    next(error);
  }
});

router.post("/orders/:id/issue-certificate", async (req, res, next) => {
  try {
    const { id } = req.params;
    const orders = await readOrders();
    const index = orders.findIndex((order) => order.id === id);

    if (index === -1) {
      return res.status(404).json({ message: "Orden no encontrada." });
    }

    if (orders[index].status !== "completado") {
      return res.status(400).json({ message: "Solo se pueden certificar servicios completados." });
    }

    const now = new Date().toISOString();
    orders[index].certificate = {
      issued: true,
      issuedAt: now,
      folio: `DES-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    };
    orders[index].updatedAt = now;
    await writeOrders(orders);

    res.json(orders[index]);
  } catch (error) {
    next(error);
  }
});

router.get("/orders/:id/certificate", async (req, res, next) => {
  try {
    const { id } = req.params;
    const orders = await readOrders();
    const order = orders.find((item) => item.id === id);

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada." });
    }

    if (order.status !== "completado") {
      return res.status(400).json({ message: "El servicio debe estar completado para generar certificado." });
    }

    res.json({
      folio: order.certificate?.folio || "PENDIENTE",
      issuedAt: order.certificate?.issuedAt || null,
      order
    });
  } catch (error) {
    next(error);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const orders = await readOrders();
    res.json({
      total: orders.length,
      completados: orders.filter((o) => o.status === "completado").length,
      programados: orders.filter((o) => o.status === "programado").length,
      cancelados: orders.filter((o) => o.status === "cancelado").length,
      conCertificado: orders.filter((o) => o.certificate?.issued).length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

