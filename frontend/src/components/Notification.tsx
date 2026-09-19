type NotificationItem = {
	id: number;
	title: string;
	message: string;
	date: string;
	read: boolean;
}

const notifications: NotificationItem[] = [
	{
		id: 1,
		title: "New Message",
		message: "Message de test",
		date: "y'a 30 min",
		read: false
	},
	{
		id: 2,
		title: "Demande d'ami",
		message: "Tom veut devenir ton ami",
		date: "y'a 15 min",
		read: false
	},
	{
		id: 3,
		title: "Demande acceptee",
		message: "Alexis t'as accepte",
		date: "Avant-hier",
		read: true
	}
]


export function Notification() {
	return (
		<div className="border border-neutral rounded-box bg-base-200 p-3">
			<h2 className="text-info font-bold mb-3">Notifications</h2>

			{notifications.map((notification) => (
				<div
					key={notification.id}
					className={`border-b border-neutral py-2 ${
						notification.read ? "opacity-60" : "bg-info/10"
					}`}
				>
					<p className="font-bold">{notification.title}</p>
					<p className="text-sm">{notification.message}</p>
					<p className="text-xs text-base-content/60">{notification.date}</p>
				</div>
			))}
		</div>
	)
}
