import { t } from "./translate"

export function notificationMessage(message: string): string {
	const friendRequest = message.match(/^(.+) sent you a friend request$/)
	if (friendRequest)
		return t("notifications_friend_request_message", { username: friendRequest[1] })

	const newMessage = message.match(/^New message: ([\s\S]*)$/)
	if (newMessage)
		return t("notifications_new_message_body", { message: newMessage[1] })

	return message
}
