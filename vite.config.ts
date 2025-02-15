import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		VitePWA({
			strategies: "injectManifest",
			srcDir: "src",
			filename: "sw.ts",
			registerType: "autoUpdate",
			manifest: {
				name: "PWA Alarm Clock",
				short_name: "Alarm",
				description:
					"A Progressive Web App Alarm Clock with background alarms and notifications",
				theme_color: "#ffffff",
				background_color: "#ffffff",
				display: "standalone",
				orientation: "portrait",
				scope: "/",
				start_url: "/",
				icons: [
					{
						src: "icons/icon-192x192.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "any maskable",
					},
				],
			},
			devOptions: {
				enabled: true,
				type: "module",
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		host: true,
		port: 4444,
	},
});
