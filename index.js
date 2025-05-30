const PORT = 8000;

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("This is the Tasks App Backed");
});

app.use(require("./routers/getRoutes"));
app.use(require("./routers/postRoutes"));
app.use(require("./routers/updateRoutes"));
app.use(require("./routers/deleteRoutes"));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
 
 
