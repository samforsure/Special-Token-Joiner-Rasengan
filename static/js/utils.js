export let tokens = [];
export let proxies = [];
export let serverInvites = [];
export let pfpRandomImages = [];
export let selectedPfp = null;

export function setTokens(t) { tokens = t; }
export function getTokens() { return tokens; }

export function setProxies(p) { proxies = p; }
export function getProxies() { return proxies; }

export function setInvites(i) { serverInvites = i; }
export function getInvites() { return serverInvites; }

export function setPfps(p) { pfpRandomImages = p; }
export function getPfps() { return pfpRandomImages; }

export function setSelectedPfp(p) { selectedPfp = p; }
export function getSelectedPfp() { return selectedPfp; }


export function addLog(message, type = "info") {
    const logContainer = document.getElementById("log-container");
    const now = new Date();
    const timeString = now.toTimeString().split(" ")[0];

    const ansiRegex = /\x1b\[([0-9;]+)m/g;

    const ansiToHtml = (msg) => {
        let openTags = [];
        return msg.replace(ansiRegex, (match, codes) => {
            const parts = codes.split(";");
            const first = parseInt(parts[0]);

            if (first === 0) {
                if (openTags.length > 0) {
                    return openTags.pop();
                }
                return "";
            }

            if (first === 38 && parts[1] === "2") {
                const [r, g, b] = parts.slice(2).map(Number);
                openTags.push("</span>");
                return `<span style="color:rgb(${r},${g},${b})">`;
            }

            const basicMap = {
                30: "black",
                31: "red",
                32: "green",
                33: "yellow",
                34: "blue",
                35: "magenta",
                36: "cyan",
                37: "white"
            };
            if (basicMap[first]) {
                openTags.push("</span>");
                return `<span style="color:${basicMap[first]}">`;
            }

            return "";
        }) + openTags.reverse().join("");
    };

    const formattedMessage = ansiToHtml(message);

    const logEntry = document.createElement("div");
    logEntry.className = `log-entry ${type === "error" ? "log-error" : ""} ${type === "success" ? "log-success" : ""}`;

    logEntry.innerHTML = `
        <span class="log-time">${timeString}</span>
        <span class="log-message">${formattedMessage}</span>
    `;

    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}


export function maskToken(token) {
    if (!token || token.length < 20) return token;
    return token.substring(0, 6) + "..." + token.substring(token.length - 5);
}

export function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function updateStatsAndProgress(stats) {
    document.querySelector(`[data-type="nexus"][data-stat="successful"]`).textContent = stats.successful;
    document.querySelector(`[data-type="nexus"][data-stat="failed"]`).textContent = stats.failed;
    document.querySelector(`[data-type="nexus"][data-stat="pending"]`).textContent = stats.pending;

    const percent = stats.total > 0 ? (stats.current / stats.total) * 100 : 0;
    document.querySelector(`.progress[data-type="nexus"]`).style.width = `${percent}%`;
    document.querySelector(`.progress-text[data-type="nexus"]`).textContent = `${stats.current}/${stats.total}`;
}

export function checkTokens(tokens) {
    if (!tokens || tokens.length === 0) {
        addLog("Error: No tokens loaded", "error");
        toast.error("Error", "No tokens loaded");
        return false;
    }
    return true;
}

document.getElementById('clear-log-btn').addEventListener('click', function () {
    document.getElementById('log-container').innerHTML = '';
    addLog("Log cleared")
});

addLog("💀 rasengan initialized")
window.addLog = addLog;
window.updateStatsAndProgress = updateStatsAndProgress;