import { addLog } from './utils.js';

export function connectToEventStream() {
    const eventSource = new EventSource('/events');

    eventSource.onmessage = event => {
        const data = JSON.parse(event.data);
        if (data.progress) {
            document.getElementById('progress-bar').style.width = `${data.progress}%`;
            document.getElementById('progress-text').textContent = `${data.current}/${data.total}`;
        }
        if (data.successful) document.getElementById('successful-ops').textContent = data.successful;
        if (data.failed) document.getElementById('failed-ops').textContent = data.failed;
        if (data.pending) document.getElementById('pending-ops').textContent = data.pending;
        if (data.message) addLog(data.message, data.type || 'info');
    };

    eventSource.onerror = () => {
        console.error('EventSource failed.');
        setTimeout(connectToEventStream, 1000);
    };
}
