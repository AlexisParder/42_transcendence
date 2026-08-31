import express from "express"
import cors from "cors"
import { toNodeHandler } from "better-auth/node"
import { auth } from "./auth.ts"
import { setPwdHandler } from "./routes/setPwd.ts"
import { checkPwdHandler } from "./routes/checkPwd.ts"

const app = express()

app.use(cors({ 
	origin: "http://localhost:5173", // front Vite
	credentials: true,
}))

app.all("/api/auth/*splat", toNodeHandler(auth))

app.use(express.json())

app.get("/api/test", (req, res) => {
	res.json({ status: "ok" })
})

app.post("/api/set-pwd", setPwdHandler)
app.post("/api/check-pwd", checkPwdHandler)

const PORT = 3000
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`))