import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors, { CorsOptions } from "cors";
import routes from "./routes";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({
    path: path.resolve(__dirname, "../", ".env.dev"),
    quiet: true,
  });
}

const app = express();
const PORT = process.env.PORT || 3000;

// ---- cors config ----
const whitelist = ["http://localhost:8080", "http://localhost:3000"];

const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsConfig));

// ---- Parse JSON body
app.use(express.json());

// ---- Routes ----
app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`🟢 Server is running on port ${PORT}`);
});
