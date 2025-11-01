// wait_save_report.js
const axios = require('axios');
const fs = require('fs');

const HASH = 'THE_HASH';
const BACKEND = 'http://localhost:4000';
const POLL_INTERVAL = 10_000;

async function checkLogs() {
  try {
    const r = await axios.post(`${BACKEND}/api/scan_logs`, `hash=${HASH}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return r.data;
  } catch (e) {
    console.error('scan_logs error:', e.response ? e.response.data : e.message);
    return null;
  }
}

async function fetchAndSave() {
  try {
    const r = await axios.get(`${BACKEND}/api/report_json/save`, { params: { hash: HASH } });
    const out = `reports_saved_${HASH}.json`;
    fs.writeFileSync(out, JSON.stringify(r.data.data || r.data, null, 2), 'utf8');
    console.log('Saved to', out);
  } catch (e) {
    console.error('fetch error:', e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message);
  }
}

(async function poll() {
  console.log('Polling scan logs for', HASH);
  while (true) {
    const logs = await checkLogs();
    if (logs && JSON.stringify(logs).toLowerCase().includes('generating report')) {
      console.log('Generating report detected — fetching now');
      await fetchAndSave();
      break;
    }
    if (logs && JSON.stringify(logs).toLowerCase().includes('completed')) {
      console.log('Completed detected — fetching now');
      await fetchAndSave();
      break;
    }
    console.log('Not ready — waiting', POLL_INTERVAL/1000, 's');
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
})();
