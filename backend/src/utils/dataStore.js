const fs = require("fs/promises");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "orders.json");

async function readOrders() {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeOrders(orders) {
  await fs.writeFile(DATA_FILE, JSON.stringify(orders, null, 2), "utf-8");
}

module.exports = {
  readOrders,
  writeOrders
};
