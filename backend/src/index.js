const express = require("express");
const cors = require("cors");
const ordersRouter = require("./routes/orders");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "desintesa-backend" });
});

app.use("/api", ordersRouter);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    message: "Error interno del servidor.",
    detail: error.message
  });
});

app.listen(PORT, () => {
  console.log(`Desintesa API activa en http://localhost:${PORT}`);
});
