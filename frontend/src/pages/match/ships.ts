import carrier from "../../assets/boats/intact/carrier.png"
import cruiser from "../../assets/boats/intact/cruiser.png"
import destroyer from "../../assets/boats/intact/destroyer.png"
import frigate from "../../assets/boats/intact/frigate.png"
import submarine from "../../assets/boats/intact/submarine.png"
import type { Ship } from "../../types/events"

export const SHIPS: Ship[] = [
	{ name: "carrier", size: 5, image: carrier },
	{ name: "cruiser", size: 4, image: cruiser },
	{ name: "destroyer", size: 3, image: destroyer },
	{ name: "frigate", size: 3, image: frigate },
	{ name: "submarine", size: 2, image: submarine },
]