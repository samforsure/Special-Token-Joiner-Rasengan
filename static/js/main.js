import { initLoading } from './loading.js';
import { loadSettingsIntoUI } from './settings.js';
import { setupDragAndDrop } from './dragdrop.js';
import { initJoiner } from './joiner.js';
import { initVC } from './vc.js';
import { initLeaver } from './leaver.js';
import { initPfp } from './pfp.js';
import { connectToEventStream } from './events.js';
import { initTabs } from './tabs.js';

document.addEventListener("DOMContentLoaded", async () => {
    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.cdnfonts.com/css/game-of-squids');
        
        * { 
            font-family: 'Game of Squids', sans-serif !important; 
            text-transform: uppercase;
        }

        :root {
            --primary: #ff0000 !important;
            --primary-color: #ff0000 !important;
            --accent: #ff0000 !important;
            --rasengan: #ff0000 !important;
            --bg-dark: #0a0000 !important;
        }

        body { background-color: #0a0000 !important; color: #ffffff !important; }
        .card, .container, .sidebar, .navbar { border: 1px solid #ff000055 !important; background: #120000 !important; }
        button, .btn, #join-btn, #stop-btn { background-color: #ff0000 !important; color: white !important; border: none !important; box-shadow: 0 0 10px #ff000055; }
        input, textarea, select { background: #1a0000 !important; border: 1px solid #ff0000 !important; color: white !important; }
        .tab-btn.active { border-bottom: 2px solid #ff0000 !important; color: #ff0000 !important; }
        .progress-bar, .fill { background-color: #ff0000 !important; }
        
        /* Logo & Brand Replacement */
        .navbar-brand, .logo-text, .sidebar-header h1 { visibility: hidden; position: relative; }
        .navbar-brand::after, .logo-text::after, .sidebar-header h1::after { content: '💀 RASENGAN'; visibility: visible; position: absolute; left: 0; color: #ff0000; font-family: 'Game of Squids' !important; }
        img[src*="logo"], .logo-img { content: url('https://img.icons8.com/ios-filled/50/ff0000/skull.png') !important; }

        /* Custom Credit Label */
        .rasengan-credit {
            position: fixed;
            bottom: 10px;
            right: 15px;
            color: #ff0000;
            font-size: 14px;
            z-index: 10000;
            text-shadow: 0 0 5px #ff0000;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);

    const creditDiv = document.createElement('div');
    creditDiv.className = 'rasengan-credit';
    creditDiv.innerText = '💀 RASENGAN 💀';
    document.body.appendChild(creditDiv);

    // Replace any remaining "Nexus" text in the DOM
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
        node.nodeValue = node.nodeValue.replace(/Nexus/gi, 'rasengan');
    }

    await initLoading();
    initTabs();
    loadSettingsIntoUI();
    setupDragAndDrop();
    initJoiner();
    initVC();
    initLeaver();
    initPfp();
    connectToEventStream();
});
