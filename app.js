require("dotenv").config();
const express = require("express");
const { mongoConnect } = require("./database");
const routes = require("./routes");

const port = process.env.PORT || 5000;

const app = express();

app.use(express.json());

app.use("/api", routes);

mongoConnect(async () => {
  app.listen(port, () => {
    console.log(`server running on port ${port}`);
  });
});
