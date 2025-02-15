/// <reference lib="webworker" />

interface AlarmMessage {
	type: "SET_ALARM" | "CLEAR_ALARM";
	timestamp?: number;
}

let alarmInterval: ReturnType<typeof setInterval> | undefined;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
addEventListener("install", (event: ExtendableEvent) => {
	console.log("Service Worker: Installing");
	self.skipWaiting();
});

addEventListener("activate", (event: ExtendableEvent) => {
	console.log("Service Worker: Activating");
	event.waitUntil(self.clients.claim());
});

// Handle messages from the main app
addEventListener("message", (event: ExtendableMessageEvent) => {
	const message = event.data as AlarmMessage;
	console.log("Service Worker: Received message:", message);

	if (message.type === "SET_ALARM" && message.timestamp) {
		// Clear any existing alarm
		if (alarmInterval) {
			clearInterval(alarmInterval);
		}

		const targetTime = new Date(message.timestamp);
		console.log(
			"Service Worker: Setting alarm for",
			targetTime.toLocaleString()
		);

		// Check every second
		alarmInterval = setInterval(async () => {
			const now = new Date();
			const timeUntilAlarm = message.timestamp! - now.getTime();

			console.log(
				"Service Worker: Time until alarm:",
				Math.floor(timeUntilAlarm / 1000),
				"seconds"
			);

			if (timeUntilAlarm <= 0) {
				console.log("Service Worker: ALARM TIME REACHED!");

				// Clear the interval
				if (alarmInterval) {
					clearInterval(alarmInterval);
					alarmInterval = undefined;
				}

				try {
					// Get all clients
					const clients = await self.clients.matchAll();
					console.log("Service Worker: Found clients:", clients.length);

					// Notify each client
					clients.forEach((client) => {
						console.log("Service Worker: Sending ALARM_TRIGGERED to client");
						client.postMessage({
							type: "ALARM_TRIGGERED",
							timestamp: now.toISOString(),
						});
					});

					// Show notification
					await self.registration.showNotification("Alarm!", {
						body: "Your alarm is ringing!",
						icon: "/icons/icon-192x192.png",
						tag: "alarm",
					});
				} catch (error) {
					console.error("Service Worker: Error triggering alarm:", error);
				}
			}
		}, 1000);
	} else if (message.type === "CLEAR_ALARM") {
		console.log("Service Worker: Clearing alarm");
		if (alarmInterval) {
			clearInterval(alarmInterval);
			alarmInterval = undefined;
		}
	}
});

// Handle notification clicks
addEventListener("notificationclick", (event: NotificationEvent) => {
	event.notification.close();
	event.waitUntil(
		self.clients.matchAll({ type: "window" }).then((windowClients) => {
			if (windowClients.length > 0) {
				windowClients[0].focus();
			} else {
				self.clients.openWindow("/");
			}
		})
	);
});
