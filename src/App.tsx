import React, { useState, useEffect, useRef } from "react";
import { Bell, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AlarmClock: React.FC = () => {
	const [currentTime, setCurrentTime] = useState<Date>(new Date());
	const [alarmTime, setAlarmTime] = useState<string>("");
	const [isAlarmSet, setIsAlarmSet] = useState<boolean>(false);
	const [isAlarmRinging, setIsAlarmRinging] = useState<boolean>(false);
	const [permission, setPermission] = useState<NotificationPermission>(
		Notification.permission
	);
	const [swRegistration, setSwRegistration] =
		useState<ServiceWorkerRegistration | null>(null);
	const [timeUntilAlarm, setTimeUntilAlarm] = useState<string>("");

	const audioRef = useRef<HTMLAudioElement>(null);
	const alarmTimeRef = useRef<number | null>(null);

	// Register service worker on component mount
	useEffect(() => {
		const registerServiceWorker = async (): Promise<void> => {
			if ("serviceWorker" in navigator) {
				try {
					const registration = await navigator.serviceWorker.ready;
					setSwRegistration(registration);

					const messageHandler = (event: MessageEvent) => {
						console.log("Received message from service worker:", event.data);
						if (event.data.type === "ALARM_TRIGGERED") {
							console.log("Alarm triggered, attempting to play sound");
							handleAlarmTrigger();
						}
					};

					navigator.serviceWorker.addEventListener("message", messageHandler);
					// return () => {
					// 	navigator.serviceWorker.removeEventListener(
					// 		"message",
					// 		messageHandler
					// 	);
					// };
				} catch (error) {
					console.error("Service worker registration failed:", error);
				}
			}
		};

		registerServiceWorker();
	}, []);

	// Update current time and check alarm
	useEffect(() => {
		const timer = setInterval(() => {
			const now = new Date();
			setCurrentTime(now);

			// Update countdown if alarm is set
			if (alarmTimeRef.current) {
				const timeLeft = alarmTimeRef.current - now.getTime();
				if (timeLeft > 0) {
					const minutes = Math.floor(timeLeft / 60000);
					const seconds = Math.floor((timeLeft % 60000) / 1000);
					setTimeUntilAlarm(`${minutes}m ${seconds}s`);
				}
			}
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

		const [hours, minutes] = alarmTime.split(":").map(Number);
		const alarmDate = new Date();
		alarmDate.setHours(hours, minutes, 0, 0); // Set seconds and milliseconds to 0

		// If alarm time is in the past, set it for tomorrow
		if (alarmDate.getTime() <= Date.now()) {
			alarmDate.setDate(alarmDate.getDate() + 1);
		}

		const timestamp = alarmDate.getTime();
		alarmTimeRef.current = timestamp;

		console.log("Setting alarm for:", alarmDate.toLocaleString());
		console.log("Current time:", new Date().toLocaleString());
		console.log(
			"Time until alarm:",
			(timestamp - Date.now()) / 1000,
			"seconds"
		);

		if (swRegistration.active) {
			swRegistration.active.postMessage({
				type: "SET_ALARM",
				timestamp: timestamp,
			});
			setIsAlarmSet(true);
		} else {
			alert("Service Worker is not active. Please try again.");
		}
	};

	const handleStopAlarm = (): void => {
		console.log("Stopping alarm");
		if (swRegistration?.active) {
			swRegistration.active.postMessage({
				type: "CLEAR_ALARM",
			});
			setIsAlarmSet(false);
			setIsAlarmRinging(false);
			setAlarmTime("");
			setTimeUntilAlarm("");
			alarmTimeRef.current = null;

			// Stop audio
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current.currentTime = 0;
			}
		}
	};

	const handleAlarmTrigger = async (): Promise<void> => {
		console.log("=== Alarm Trigger Sequence Start ===");
		console.log("Current Time:", new Date().toLocaleString());
		console.log("Alarm State:", { isAlarmSet, isAlarmRinging });

		setIsAlarmRinging(true);

		// Show notification
		if (permission === "granted" && swRegistration) {
			console.log("Showing notification");
			const options = {
				body: "Your alarm is ringing!",
				icon: "icons/icon-192x192.png",
				tag: "alarm",
				renotify: true,
			};

			swRegistration.showNotification("Alarm!", options);
		}

		// Play sound
		if (audioRef.current) {
			console.log("Audio element found, attempting to play");
			console.log("Audio element state:", {
				currentTime: audioRef.current.currentTime,
				paused: audioRef.current.paused,
				volume: audioRef.current.volume,
				muted: audioRef.current.muted,
				readyState: audioRef.current.readyState,
			});

			try {
				const playPromise = audioRef.current.play();
				console.log("Play method called");

				await playPromise;
				console.log("Audio playback started successfully");

				// Add event listeners for audio state changes
				audioRef.current.onplay = () => console.log("Audio play event fired");
				audioRef.current.onplaying = () =>
					console.log("Audio playing event fired");
				audioRef.current.onpause = () => console.log("Audio pause event fired");
				audioRef.current.onerror = (e) =>
					console.error("Audio error event:", e);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (error: any) {
				console.error("Error playing alarm sound:", error);
				console.error("Error details:", {
					name: error.name,
					message: error.message,
					stack: error.stack,
				});
			}
		} else {
			console.error("Audio element not found in ref");
		}

		console.log("=== Alarm Trigger Sequence End ===");
	};

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center justify-center gap-2">
					<Clock className="h-6 w-6" />
					PWA Alarm Clock
					{isAlarmRinging && (
						<Bell className="h-6 w-6 animate-bounce text-red-500" />
					)}
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

					<div className="text-4xl font-bold">
						{currentTime.toLocaleTimeString()}
					</div>

					{timeUntilAlarm && isAlarmSet && !isAlarmRinging && (
						<div className="text-sm font-medium text-blue-500">
							Time until alarm: {timeUntilAlarm}
						</div>
					)}

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
								className={`flex items-center gap-2 ${
									isAlarmRinging ? "animate-pulse" : ""
								}`}
							>
								Stop Alarm
							</Button>
						)}
					</div>

					{isAlarmSet && !isAlarmRinging && (
						<div className="text-sm text-muted-foreground">
							Alarm set for {alarmTime}
						</div>
					)}

					<audio
						ref={audioRef}
						preload="auto"
						loop
						controls
						className="w-full mt-4"
					>
						<source src="/alarm-sound.mp3" type="audio/mpeg" />
						<source src="/alarm-sound.wav" type="audio/wav" />
						Your browser does not support the audio element.
					</audio>
				</div>
			</CardContent>
		</Card>
	);
};

export default AlarmClock;
