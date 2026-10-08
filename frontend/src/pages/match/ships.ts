import carrier from "../../assets/boats/intact/carrier.png"
import cruiser from "../../assets/boats/intact/cruiser.png"
import destroyer from "../../assets/boats/intact/destroyer.png"
import frigate from "../../assets/boats/intact/frigate.png"
import submarine from "../../assets/boats/intact/submarine.png"
import type { Ship } from "../../types/events"

export const SHIPS: Ship[] = [
	{ name: "carrier", size: 5, image: carrier, start: { x: -1, y: -1 }, end: { x: -1, y: -1 } },
	{ name: "cruiser", size: 4, image: cruiser, start: { x: -1, y: -1 }, end: { x: -1, y: -1 } },
	{ name: "destroyer", size: 3, image: destroyer, start: { x: -1, y: -1 }, end: { x: -1, y: -1 } },
	{ name: "frigate", size: 3, image: frigate, start: { x: -1, y: -1 }, end: { x: -1, y: -1 } },
	{ name: "submarine", size: 2, image: submarine, start: { x: -1, y: -1 }, end: { x: -1, y: -1 } },
]