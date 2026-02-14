// background.js

chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
        const result = await chrome.storage.local.get("installed");
        if (!result.installed) {
            chrome.tabs.create({ url: "https://roybuilds.vercel.app/Clipboard_web/clipboard.html" });
            await chrome.storage.local.set({ installed: true });
        }
    }
});