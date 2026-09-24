import { prisma } from './db/client.ts'

const ranks = [
	{ en_label: 'seaman', fr_label: 'matelot', min: 0 },
	{ en_label: 'petty officer', fr_label: 'quartier-maître', min: 150 },
	{ en_label: 'ensign', fr_label: 'enseigne de vaisseau', min: 400 },
	{ en_label: 'lieutenant', fr_label: 'lieutenant de vaisseau', min: 800 },
	{ en_label: 'commander', fr_label: 'capitaine de frégate', min: 1400 },
	{ en_label: 'captain', fr_label: 'capitaine de vaisseau', min: 2200 },
	{ en_label: 'admiral', fr_label: 'amiral', min: 3500 }
]

async function main() {
	for (const rank of ranks) {
		await prisma.ranks.upsert({
			where: { en_label: rank.en_label },
			update: rank,
			create: rank
		})
	}
}

main()
	.then(() => prisma.$disconnect())
	.catch(async (e) => {
		console.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})