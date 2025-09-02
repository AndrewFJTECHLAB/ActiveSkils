import express from "express";
import path from "path";
import dotenv from "dotenv";

const envFile = process.env.NODE_ENV === "production" ? ".env.prod" : ".env.dev"
dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

const app = express()
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/Hello', (req, res) => {
    res.json({ message: 'Hello World' });
})

app.listen(PORT, () => {
    console.log(`🟢 Server is running on port ${PORT}`)
})