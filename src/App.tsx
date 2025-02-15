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

	const audioRef = useRef<HTMLAudioElement>(null);

	// Register service worker
	useEffect(() => {
		const registerSW = async () => {
			try {
				if ("serviceWorker" in navigator) {
					// With Vite PWA, we don't need to register manually
					const registration = await navigator.serviceWorker.ready;
					console.log("Service Worker registered:", registration);
					setSwRegistration(registration);

					// Set up message listener
					navigator.serviceWorker.addEventListener("message", (event) => {
						console.log("Received message from SW:", event.data);
						if (event.data.type === "ALARM_TRIGGERED") {
							handleAlarmTrigger();
						}
					});
				}
			} catch (error) {
				console.error("Service Worker registration failed:", error);
			}
		};

		registerSW();
	}, []);

	// Update current time
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	const handleSetAlarm = async () => {
		if (!swRegistration) {
			alert("Service Worker not registered. Background alarms won't work.");
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
		alarmDate.setHours(hours, minutes, 0, 0);

		// If alarm time is in the past, set it for tomorrow
		if (alarmDate.getTime() <= Date.now()) {
			alarmDate.setDate(alarmDate.getDate() + 1);
		}

		const timestamp = alarmDate.getTime();
		console.log("Setting alarm for:", alarmDate.toLocaleString());

		swRegistration.active?.postMessage({
			type: "SET_ALARM",
			timestamp,
		});

		setIsAlarmSet(true);
	};

	const handleStopAlarm = () => {
		swRegistration?.active?.postMessage({
			type: "CLEAR_ALARM",
		});

		setIsAlarmSet(false);
		setIsAlarmRinging(false);
		setAlarmTime("");

		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}
	};

	const handleAlarmTrigger = async () => {
		console.log("Alarm triggered!");
		setIsAlarmRinging(true);

		if (audioRef.current) {
			try {
				audioRef.current.currentTime = 0;
				await audioRef.current.play();
			} catch (error) {
				console.error("Error playing alarm sound:", error);
			}
		}
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

					<div className="w-full flex gap-4">
						<input
							type="time"
							value={alarmTime}
							onChange={(e) => setAlarmTime(e.target.value)}
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

					{isAlarmSet && (
						<div className="text-sm text-muted-foreground">
							Alarm set for {alarmTime}
						</div>
					)}

					<audio ref={audioRef} controls loop className="w-full mt-4">
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
