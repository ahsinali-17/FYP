const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import Routes
const batchRoutes = require("./routes/batchRoutes");
const inspectionRoutes = require("./routes/inspectionRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const emailNotificationRoutes = require("./routes/emailNotification");

const app = express();

// Global Middleware
// app.use(
//   cors({
//     origin: true,
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
app.use(cors('*'));
app.use(express.json());

app.get("/", (req, res) => res.send("Backend is Live!"));

app.use("/api/batches", batchRoutes);
app.use("/api/inspections", inspectionRoutes);
app.use("/api/support", ticketRoutes);
app.use("/api/email", emailNotificationRoutes);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Node Server running on port ${PORT}`);
});

module.exports = app;