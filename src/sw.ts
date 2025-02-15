/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/// <reference lib="webworker" />
export default null;
declare var self: ServiceWorkerGlobalScope;

// Add type for Workbox Manifest
declare const __WB_MANIFEST: Array<{
	revision: string | null;
	url: string;
}>;

// Inject manifest
// self.__WB_MANIFEST;

let alarmTimeout: number | null = null;

interface AlarmMessage {
	type: "SET_ALARM" | "CLEAR_ALARM";
	timestamp?: number;
}

self.addEventListener("message", (event: ExtendableMessageEvent) => {
	const message = event.data as AlarmMessage;
	console.log("SW received message:", message);

	if (message.type === "SET_ALARM" && message.timestamp) {
		// Clear any existing alarm
		if (alarmTimeout) {
			clearTimeout(alarmTimeout);
			alarmTimeout = null;
		}

		const targetTime = message.timestamp;
		const timeUntilAlarm = targetTime - Date.now();

		console.log("Setting alarm for:", new Date(targetTime).toLocaleString());
		console.log(
			"Time until alarm:",
			Math.floor(timeUntilAlarm / 1000),
			"seconds"
		);

		if (timeUntilAlarm > 0) {
			alarmTimeout = setTimeout(async () => {
				console.log("ALARM TIME!");

				// Notify all clients
				const clients = await self.clients.matchAll({ type: "window" });
				for (const client of clients) {
					client.postMessage({ type: "ALARM_TRIGGERED" });
				}

				// Show notification
				await self.registration.showNotification("Alarm!", {
					body: "Your alarm is ringing!",
					icon: "/icons/icon-192x192.png",
					tag: "alarm",
					requireInteraction: true,
				});
			}, timeUntilAlarm) as unknown as number;
		}
	}

	if (message.type === "CLEAR_ALARM") {
		if (alarmTimeout) {
			clearTimeout(alarmTimeout);
			alarmTimeout = null;
		}
	}
});

self.addEventListener("install", () => {
	console.log("Service Worker installing");
	self.skipWaiting();
});

self.addEventListener("activate", (event: ExtendableEvent) => {
	console.log("Service Worker activating");
	event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
	console.log("Notification clicked");
	event.notification.close();

	event.waitUntil(
		self.clients.matchAll({ type: "window" }).then((clients) => {
			if (clients.length > 0) {
				(clients[0] as WindowClient).focus();
			} else {
				self.clients.openWindow("/");
			}
		})
	);
});
