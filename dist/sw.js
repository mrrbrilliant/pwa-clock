if(!self.define){let e,i={};const n=(n,s)=>(n=new URL(n+".js",s).href,i[n]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=i,document.head.appendChild(e)}else e=n,importScripts(n),i()})).then((()=>{let e=i[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(s,r)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(i[o])return;let c={};const f=e=>n(e,o),t={module:{uri:o},exports:c,require:f};i[o]=Promise.all(s.map((e=>t[e]||f(e)))).then((e=>(r(...e),c)))}}define(["./workbox-5ffe50d4"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"alarm-sound.mp3",revision:"1fe072e089ac3fe306ae8e0a1bb96936"},{url:"assets/index-CzgeRcWs.js",revision:null},{url:"assets/index-XzFcw9Df.css",revision:null},{url:"icons/icon-192x192.png",revision:"f072cda222792406e620e05b10ace7cc"},{url:"icons/icon-96x96.png",revision:"effe0f77e77a4aee5b41deff61359c76"},{url:"icons/icons8-alarm-clock-80.png",revision:"0d00dbe0466153a2c4229b1f7c397b34"},{url:"index.html",revision:"98188322943b1437a0625159fe86ff04"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"vite.svg",revision:"8e3a10e157f75ada21ab742c022d5430"},{url:"icons/icon-192x192.png",revision:"f072cda222792406e620e05b10ace7cc"},{url:"manifest.webmanifest",revision:"5fd7889be84300a6f286b67fd73af7c6"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
