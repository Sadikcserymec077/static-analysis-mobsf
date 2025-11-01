// test-mobsf-key.js
const axios = require('axios');

const URL = 'http://localhost:8000/api/v1/scans';
const KEY = '4f874bda5eeefe8c443247cb65dbdd26ff93e90ef91437cc638eddb43d8a2bc1';

async function run() {
  try {
    const r1 = await axios.get(URL, { headers: { Authorization: KEY } });
    console.log('Auth header result:', r1.status, r1.data);
  } catch (e) {
    console.log('Auth header error:', e.response ? e.response.status : e.message, e.response ? e.response.data : '');
  }

  try {
    const r2 = await axios.get(URL, { headers: { 'X-Mobsf-Api-Key': KEY } });
    console.log('X-Mobsf-Api-Key result:', r2.status, r2.data);
  } catch (e) {
    console.log('X-Mobsf-Api-Key error:', e.response ? e.response.status : e.message, e.response ? e.response.data : '');
  }

  try {
    const r3 = await axios.get(URL, { headers: { Authorization: KEY, 'X-Mobsf-Api-Key': KEY, 'User-Agent': 'test-client' } });
    console.log('Both headers result:', r3.status, r3.data);
  } catch (e) {
    console.log('Both headers error:', e.response ? e.response.status : e.message, e.response ? e.response.data : '');
  }
}

run();
