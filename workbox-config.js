module.exports = {
	globDirectory: "build/",
	globPatterns: ["**/*.{json,ico,html,png,js,txt,css}"],
	swDest: "build/sw.js",
	swSrc: "src/sw.js",
	injectionPointRegexp: /(const precacheManifest = )\[\](;)/,
};
