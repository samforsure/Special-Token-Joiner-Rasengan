function minimizeWindow() {
    if (window.pywebview) {
        window.pywebview.api.minimize();
    } else {
        console.warn("pywebview not available");
    }
}

function closeWindow() {
    if (window.pywebview) {
        window.pywebview.api.close();
    } else {
        console.warn("pywebview not available");
    }
}

async function fetchLogs() {
    try {
        const logs = await window.pywebview.api.get_logs();
        logs.forEach(log => {
            addLog(log.message, log.type);
        });
    } catch (e) {
        console.error('Error fetching logs:', e);
    }
}

setInterval(async () => {
    await fetchLogs();
}, 500);
