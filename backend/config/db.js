const mongoose = require("mongoose");
require("dotenv").config;

async function db() {
  try {
    const res = await mongoose.connect(process.env.MONGO_URL);

    if (res) {
      console.log("db connected successfully");
    }
  } catch (err) {
    console.error("Failed to parse data:", err.message);
  }
}
module.exports = db;
