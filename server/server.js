import express from "express";
const port = 4000;
const app = express();
app.get("/backend/users", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
