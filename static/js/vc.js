import { maskToken, getTokens } from './utils.js';
import { settings } from './settings.js';

let vcConnections = [];

export function initVC() {
    const vcJoinBtn = document.getElementById("vc-join-btn");
    const vcLeaveBtn = document.getElementById("vc-leave-btn");
    const vcStatusBody = document.getElementById("vc-status-body");

    vcJoinBtn.addEventListener("click", () => {
        const tokens = getTokens();
        const serverId = document.getElementById("vc-server-id").value.trim();
        const channelId = document.getElementById("vc-channel-id").value.trim();

        if (!serverId) {
            toast.error("Error", "Please enter a server ID");
            return;
        }
        const options = {
            mute: document.getElementById("vc-join-muted").checked,
            deaf: document.getElementById("vc-join-deafened").checked,
            randomize_options: document.getElementById("vc-randomize-options").checked,
        };

        window.pywebview.api.join_vc_multi(tokens, serverId, channelId, options);
    });

    vcLeaveBtn.addEventListener("click", () => {
        const tokens = getTokens();
        const serverId = document.getElementById("vc-server-id").value.trim();
        const channelId = document.getElementById("vc-channel-id").value.trim();

        window.pywebview.api.leave_vc_multi(tokens, serverId, channelId);
    });

    window.addVCConnection = function(token, serverId, channelId, status) {
        const exists = vcConnections.some(c =>
            c.token === token && c.serverId === serverId && c.channelId === channelId
        );
        if (!exists) {
            vcConnections.push({ token, serverId, channelId, status });
            updateVCStatusTable(vcStatusBody);
        }
    };

    window.removeVCConnection = function(token, serverId, channelId) {
        vcConnections = vcConnections.filter(c => !(c.token === token && c.serverId === serverId && c.channelId === channelId));
        updateVCStatusTable(vcStatusBody);
    };
}

function updateVCStatusTable(vcStatusBody) {
    if (vcConnections.length === 0) {
        vcStatusBody.innerHTML = "<tr><td colspan='5'>No active connections</td></tr>";
        return;
    }

    vcStatusBody.innerHTML = vcConnections.map((conn, index) => `
        <tr>
            <td>${maskToken(conn.token)}</td>
            <td>${conn.serverId}</td>
            <td>${conn.channelId || "Auto"}</td>
            <td>${conn.status}</td>
            <td>
                <button class="secondary-btn disconnect-btn" 
                        data-index="${index}" 
                        style="padding:5px 10px; font-size:12px;">
                    Disconnect
                </button>
            </td>
        </tr>
    `).join("");

    vcStatusBody.querySelectorAll(".disconnect-btn").forEach(button => {
        console.log("VC table updated", vcConnections.length);

        button.addEventListener("click", () => {
            const idx = Number(button.getAttribute("data-index"));
            const conn = vcConnections[idx];

            console.log("Disconnect clicked:", conn);

            window.pywebview.api.leave_vc(conn.token, conn.serverId, conn.channelId)
                .then(res => {
                    if (res.success) {
                        window.removeVCConnection(conn.token, conn.serverId, conn.channelId);
                    } else {
                        console.error("Leave VC failed:", res.error || "Unknown error");
                    }
                })
                .catch(err => {
                    console.error("Error calling leave_vc:", err);
                });
        });
    });

}
