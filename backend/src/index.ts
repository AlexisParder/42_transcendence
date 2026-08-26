import express from "express"
import cors from "cors"
import authRoutes from "./routes/auth.routes.ts"

const app = express()

app.use(cors({origin: "http://localhost:5173"})) // front Vite
app.use(express.json())

app.use("/api/auth", authRoutes)

app.get("/api/test", (req, res) => {
	res.json({status: "ok"})
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`))