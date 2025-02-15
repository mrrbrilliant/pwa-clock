/// <reference lib="webworker" />

interface AlarmMessage {
	type: "SET_ALARM" | "CLEAR_ALARM";
	timestamp?: number;
}

let alarmTimeout: ReturnType<typeof setTimeout> | undefined;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
addEventListener("install", (event: ExtendableEvent) => {
	self.skipWaiting();
});

addEventListener("activate", (event: ExtendableEvent) => {
	event.waitUntil(self.clients.claim());
});

// Handle messages from the main app
addEventListener("message", (event: ExtendableMessageEvent) => {
	const message = event.data as AlarmMessage;

	if (message.type === "SET_ALARM" && message.timestamp) {
		// Clear any existing alarm
		if (alarmTimeout) {
			clearTimeout(alarmTimeout);
		}

		// Set new alarm
		const msUntilAlarm = message.timestamp - Date.now();
		if (msUntilAlarm > 0) {
			alarmTimeout = setTimeout(async () => {
				// Notify all clients (tabs/windows) of the alarm
				const clients = await self.clients.matchAll();
				clients.forEach((client) => {
					client.postMessage({
						type: "ALARM_TRIGGERED",
					});
				});

				// Show notification with standard options
				await self.registration.showNotification("Alarm!", {
					body: "Your alarm is ringing!",
					icon: "/pwa-alarm-clock/icons/icon-192x192.png",
					tag: "alarm",
					// renotify: true,
				});
			}, msUntilAlarm);
		}
	} else if (message.type === "CLEAR_ALARM") {
		if (alarmTimeout) {
			clearTimeout(alarmTimeout);
		}
	}
});

// Handle notification clicks
addEventListener("notificationclick", (event: NotificationEvent) => {
	event.notification.close();

	// Focus existing window or open new one
	event.waitUntil(
		self.clients.matchAll({ type: "window" }).then((windowClients) => {
			if (windowClients.length > 0) {
				windowClients[0].focus();
			} else {
				self.clients.openWindow("/pwa-alarm-clock/");
			}
		})
	);
});
