import React, { useState, useEffect } from "react";
import { Bell, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AlarmClock: React.FC = () => {
	const [currentTime, setCurrentTime] = useState<Date>(new Date());
	const [alarmTime, setAlarmTime] = useState<string>("");
	const [isAlarmSet, setIsAlarmSet] = useState<boolean>(false);
	const [permission, setPermission] = useState<NotificationPermission>(
		Notification.permission
	);
	const [swRegistration, setSwRegistration] =
		useState<ServiceWorkerRegistration | null>(null);

	// Register service worker on component mount
	useEffect(() => {
		const registerServiceWorker = async (): Promise<void> => {
			if ("serviceWorker" in navigator) {
				try {
					// For Vite PWA, the service worker is registered automatically
					const registration = await navigator.serviceWorker.ready;
					setSwRegistration(registration);

					// Set up message handling from service worker
					navigator.serviceWorker.addEventListener(
						"message",
						(event: MessageEvent) => {
							if (event.data.type === "ALARM_TRIGGERED") {
								handleAlarmTrigger();
							}
						}
					);
				} catch (error) {
					console.error("Service worker registration failed:", error);
				}
			}
		};

		registerServiceWorker();
	}, []);

	// Update current time every second (when tab is active)
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	const handleSetAlarm = async (): Promise<void> => {
		if (!swRegistration) {
			alert("Service Worker not registered. Alarm may not work in background.");
			return;
		}

		if (permission !== "granted") {
			const newPermission = await Notification.requestPermission();
			setPermission(newPermission);
			if (newPermission !== "granted") {
				alert("Notification permission required for alarm.");
				return;
			}
		}

		// Convert alarm time to timestamp
		const [hours, minutes] = alarmTime.split(":").map(Number);
		const alarmDate = new Date();
		alarmDate.setHours(hours);
		alarmDate.setMinutes(minutes);
		alarmDate.setSeconds(0);

		// If alarm time is in the past, set it for tomorrow
		if (alarmDate < new Date()) {
			alarmDate.setDate(alarmDate.getDate() + 1);
		}

		// Send alarm time to service worker using the registration
		if (swRegistration.active) {
			swRegistration.active.postMessage({
				type: "SET_ALARM",
				timestamp: alarmDate.getTime(),
			});
			setIsAlarmSet(true);
		} else {
			alert("Service Worker is not active. Please try again.");
		}
	};

	const handleStopAlarm = (): void => {
		if (swRegistration?.active) {
			swRegistration.active.postMessage({
				type: "CLEAR_ALARM",
			});
			setIsAlarmSet(false);
			setAlarmTime("");
		}
	};

	const handleAlarmTrigger = (): void => {
		// Show notification
		if (permission === "granted" && swRegistration) {
			const options = {
				body: "Your alarm is ringing!",
				icon: "icons/icon-192x192.png",
				tag: "alarm",
				renotify: true,
			};

			swRegistration.showNotification("Alarm!", options);
		}

		// Play sound (will only work when tab is active)
		const audio = new Audio("alarm-sound.mp3");
		audio.loop = true;
		audio.play().catch(console.error);
	};

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center justify-center gap-2">
					<Clock className="h-6 w-6" />
					PWA Alarm Clock
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col items-center gap-6">
					{!swRegistration && (
						<Alert variant="destructive">
							<AlertDescription>
								Service Worker not registered. Background alarms may not work
								reliably.
							</AlertDescription>
						</Alert>
					)}

					{permission !== "granted" && (
						<Alert>
							<AlertDescription>
								Please allow notifications for alarm alerts to work properly.
							</AlertDescription>
						</Alert>
					)}

					{/* Current Time Display */}
					<div className="text-4xl font-bold">
						{currentTime.toLocaleTimeString()}
					</div>

					{/* Alarm Input */}
					<div className="w-full flex gap-4">
						<input
							type="time"
							value={alarmTime}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setAlarmTime(e.target.value)
							}
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							disabled={isAlarmSet}
						/>
						{!isAlarmSet ? (
							<Button
								onClick={handleSetAlarm}
								disabled={!alarmTime}
								className="flex items-center gap-2"
							>
								<Bell className="h-4 w-4" />
								Set Alarm
							</Button>
						) : (
							<Button
								onClick={handleStopAlarm}
								variant="destructive"
								className="flex items-center gap-2"
							>
								Stop Alarm
							</Button>
						)}
					</div>

					{/* Alarm Status */}
					{isAlarmSet && (
						<div className="text-sm text-muted-foreground">
							Alarm set for {alarmTime}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
};

export default AlarmClock;
