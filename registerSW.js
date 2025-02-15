if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker.register("/pwa-clock/sw.js", { scope: "/" });
	});
}
