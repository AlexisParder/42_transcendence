import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 465,
	secure: true,
	auth: {
		user: process.env.GMAIL_USER,
		pass: process.env.GMAIL_APP_PASSWORD,
	}
})

export async function sendMail({to, subject, html}: {to: string, subject: string, html: string})
{
	await transporter.sendMail({
		from: `Sonar <${process.env.GMAIL_USER}>`,
		to,
		subject,
		html
	})
}