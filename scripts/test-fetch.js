import axios from 'axios';
(async () => {
    try {
        const res = await axios.get('http://localhost:3000', { timeout: 10000 });
        console.log('status', res.status);
        console.log('headers', res.headers);
        console.log('data:', res.data);
    }
    catch (e) {
        console.error('fetch error:', e.message);
        if (e.response) {
            console.error('status', e.response.status);
            console.error('headers', e.response.headers);
            const data = String(e.response.data);
            console.error('data', data);
            const fs = await import('fs');
            await fs.promises.mkdir('logs', { recursive: true });
            await fs.promises.writeFile('logs/server-error.html', data, 'utf-8');
            console.error('Saved response HTML to logs/server-error.html');
        }
    }
})();
//# sourceMappingURL=test-fetch.js.map