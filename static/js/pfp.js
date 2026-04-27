import { settings } from './settings.js';
import { getTokens, getSelectedPfp, getPfps, getProxies} from './utils.js';

let isUpdatingPfp = false;

export function initPfp() {
    const pfpAddBtn = document.getElementById("pfp-add-btn");
    const pfpStopBtn = document.getElementById("pfp-stop-btn");

    const pfpRandomCheckbox = document.getElementById("pfp-random");
    const singlePfpUpload = document.getElementById("single-pfp-upload");
    const pfpFolderUpload = document.getElementById("pfp-folder-upload");

    pfpAddBtn.addEventListener("click", () => startPfpUpdate());
    pfpStopBtn.addEventListener("click", () => stopPfpUpdate());

    pfpRandomCheckbox.addEventListener("change", function () {
        if (this.checked) {
            pfpFolderUpload.style.display = "block";
            singlePfpUpload.style.display = "none";
        } else {
            pfpFolderUpload.style.display = "none";
            singlePfpUpload.style.display = "block";
        }
    });
}

function startPfpUpdate() {
    const tokens = getTokens();
    if (!tokens || tokens.length === 0) return;

    const selectedPfp = getSelectedPfp();
    const pfpRandomImages = getPfps();
    const proxies = getProxies(); 

    if (!selectedPfp && pfpRandomImages.length === 0) {
        toast.error("Error", "Select a profile picture first");
        return;
    }

    if (isUpdatingPfp) return;
    isUpdatingPfp = true;
    document.getElementById("pfp-add-btn").disabled = true;
    document.getElementById("pfp-stop-btn").disabled = false;

    const pfpRandomCheckbox = document.getElementById("pfp-random");
    let images;

    if (pfpRandomCheckbox.checked) {
        images = pfpRandomImages;
    } else {
        images = selectedPfp ? [selectedPfp] : [];
    }

    if (images.length === 0) {
        toast.error("Error", "No profile picture(s) selected");
        stopPfpUpdate();
        return;
    }

    window.pywebview.api.update_pfp_multi(
        tokens,
        images,
        settings.delay.enabled,
        settings.delay.min,
        settings.delay.max,
        proxies
    );
}

function stopPfpUpdate() {
    isUpdatingPfp = false;
    document.getElementById("pfp-add-btn").disabled = false;
    document.getElementById("pfp-stop-btn").disabled = true;

    window.pywebview.api.stop_pfp();
}

window.onPfpUpdateComplete = function () {
    stopPfpUpdate();
    toast.success("Done", "Profile picture update completed!");
};
