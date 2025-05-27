const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const PORT = 5000;

app.use(bodyParser.json());

app.post("/notify", (req, res) => {
  const data = req.body;

  console.log("🚨 Notification received:");
  console.log(data);

  fs.appendFileSync("notifications.log", JSON.stringify(data) + "\n");

  res.status(200).send("Notification received");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
