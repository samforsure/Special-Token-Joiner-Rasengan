import { settings } from './settings.js';
import { addLog, updateStatsAndProgress, checkTokens, getTokens, getProxies } from './utils.js';

let isLeaving = false;

export function initLeaver() {
    const leaveBtn = document.getElementById("leave-btn");
    const stopLeaveBtn = document.getElementById("stop-leave-btn");
    const leaveAllServersCheckbox = document.getElementById("leave-all-servers");

    leaveAllServersCheckbox.addEventListener("change", function () {
        const serverIdContainer = document.getElementById("leave-server-id-container");
        serverIdContainer.style.display = this.checked ? "none" : "block";
    });

    (function initVisibility() {
        const serverIdContainer = document.getElementById("leave-server-id-container");
        serverIdContainer.style.display = leaveAllServersCheckbox.checked ? "none" : "block";
    })();

    leaveBtn.addEventListener("click", () => {
        if (isLeaving) return;

        const tokens = getTokens();
        if (!checkTokens(tokens)) return;

        const proxies = getProxies();
        const leaveAll = leaveAllServersCheckbox.checked;
        const serverId = document.getElementById("leave-server-id").value.trim();

        if (!leaveAll && !serverId) {
            addLog("Error: Enter a server ID", "error");
            toast.error("Error", "Enter a server ID");
            return;
        }

        isLeaving = true;
        leaveBtn.disabled = true;
        stopLeaveBtn.disabled = false;

        const payload = {
            tokens,
            leaveAll,
            serverId: leaveAll ? "" : serverId,
            delayEnabled: !!settings.delay.enabled,
            delayMin: Number(settings.delay.min) || 1,
            delayMax: Number(settings.delay.max) || 3,
            maxWorkers: Number(settings.concurrency?.leaver || 20), 
            proxies
        };

        window.pywebview.api.leaver_start(
            payload.tokens,
            payload.leaveAll,
            payload.serverId,
            payload.delayEnabled,
            payload.delayMin,
            payload.delayMax,
            payload.maxWorkers,
            payload.proxies 
        ).then(res => {
            if (!res?.success) {
                isLeaving = false;
                leaveBtn.disabled = false;
                stopLeaveBtn.disabled = true;
                addLog(`Leaver failed to start: ${res?.error || "Unknown"}`, "error");
                toast.error("Error", res?.error || "Failed to start leaving");
            }
        }).catch(err => {
            isLeaving = false;
            leaveBtn.disabled = false;
            stopLeaveBtn.disabled = true;
            addLog(`Leaver error: ${err?.message || err}`, "error");
            toast.error("Error", err?.message || "Unknown error");
        });
    });

    stopLeaveBtn.addEventListener("click", () => {
        window.pywebview.api.leaver_stop().then(() => {
            isLeaving = false;
            leaveBtn.disabled = false;
            stopLeaveBtn.disabled = true;
            addLog("Leaving stopped by user");
        });
    });


    window.leaverUpdateStats = function (stats) {
        updateStatsAndProgress(stats);
    };

    window.leaverDone = function () {
        isLeaving = false;
        leaveBtn.disabled = false;
        stopLeaveBtn.disabled = true;
        addLog("Leaving completed");
        toast.info("Info", "Leaving process completed");
    };

    window.leaverTokenNote = function (msg, type = "info") {
        addLog(msg, type);
    };
}
