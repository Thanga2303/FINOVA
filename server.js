const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const ai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (req, res) => {
    res.send("FINOVA AI Backend is running!");
});

app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                error: "Please enter a message."
            });
        }

        const response = await ai.responses.create({
            model: "gpt-4.1-mini",
            instructions: "You are FINOVA, an educational financial assistant. Explain financial concepts clearly to beginners and advanced users. Never promise returns or present personalised investment recommendations as guaranteed advice.",
            input: message
        });

        res.json({
            reply: response.output_text
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "FINOVA AI encountered an error."
        });
    }
});

app.listen(3000, () => {
    console.log("FINOVA backend running at http://localhost:3000");
});