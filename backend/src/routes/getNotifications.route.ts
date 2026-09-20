import type { Request, Response } from "express"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.ts"
import { prisma } from "../db/client.ts"

export async function getNotificationsHandler(req: Request, res: Response) {
    try {
        const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers)
        })

        if (!session)
        return res.status(401).json({ ok: false })

        const notifications = await prisma.notification.findMany({
        where: {
        userId: session.user.id
        },
        orderBy: {
        createdAt: "desc"
        },
        take: 50
    })

    res.json({ notifications })
    } catch (error) {
        console.error("get notifications error:", error)
        res.status(500).json({ ok: false })
    }
}