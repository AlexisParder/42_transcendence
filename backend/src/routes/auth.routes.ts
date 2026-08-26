import { Router } from "express"
import bcrypt from "bcryptjs"
import { prisma } from "../db/client.ts"
import jwt from "jsonwebtoken"

const router = Router()

router.post("/register", async (req, res) => {
	const {email, username, password} = req.body

	if (!email || !username || !password) {
		res.status(400).json({error: "email, username and password are required"})
		return
	}
	if (password.length < 8) {
		res.status(400).json({error: "password must be at least 8 characters"})
		return
	}

	const existing = await prisma.user.findFirst({
		where: {OR: [{email}, {username}]}
	})
	if (existing) {
		res.status(409).json({error: "email or username already in use"})
		return
	}

	const hash = await bcrypt.hash(password, 10)

	const user = await prisma.user.create({
		data: {email, username, password: hash}
	})

	const {password: _pw, ...safeUser} = user
	res.status(201).json(safeUser)
})

router.post("/login", async (req, res) => {
	const {email, password} = req.body

	if (!email || !password) {
		res.status(400).json({error: "email ans password are required"})
		return
	}

	const user = await prisma.user.findUnique({where: {email}})
	if (!user) {
		res.status(401).json({error: "Invalid credentials"})
		return
	}

	const valid = await bcrypt.compare(password, user.password)
	if (!valid) {
		res.status(401).json({error: "invalid credentials"})
		return
	}

	const token = jwt.sign(
		{sub: user.id, username: user.username},
		process.env.JWT_SECRET as string,
		{ expiresIn: "1h"}
	)

	res.json({token})
})

export default router;