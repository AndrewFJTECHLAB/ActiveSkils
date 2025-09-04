import express from "express";
import path from "path";
import dotenv from "dotenv";
import "dotenv/config";

const envFile =
  process.env.NODE_ENV === "production" ? ".env.prod" : ".env.dev";
dotenv.config({ path: path.resolve(__dirname, "..", envFile), quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/api/Hello", (req, res) => {
  console.info("This is a test for cli - reload");
  res.json({ message: "Hello World" });
});

app.listen(PORT, () => {
    console.log(`🟢 Server is running on port ${PORT}`)
})