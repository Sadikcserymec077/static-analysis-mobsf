// src/api.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

// File upload
export const uploadFile = (file, onUploadProgress) => {
  const fd = new FormData();
  fd.append('file', file);
  return axios.post(`${API_BASE}/api/upload`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
};

// Trigger scan
export const triggerScan = (hash, re_scan = 0) =>
  axios.post(`${API_BASE}/api/scan`, { hash, re_scan });

// Get raw JSON report (proxy)
export const getReportJSON = (hash) =>
  axios.get(`${API_BASE}/api/report_json`, { params: { hash } });

// Get "crucial" summarized findings
export const getCrucial = (hash) =>
  axios.get(`${API_BASE}/api/report_json/crucial`, { params: { hash } });

// List recent scans (proxy)
export const getScans = (page = 1, page_size = 10) =>
  axios.get(`${API_BASE}/api/scans`, { params: { page, page_size } });

// Poll scan logs (backend proxies to MobSF)
export const getScanLogs = (hash) =>
  axios.post(`${API_BASE}/api/scan_logs`, `hash=${hash}`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

// Save & cache JSON report on server, returns saved path + data
export const saveJsonReport = (hash) =>
  axios.get(`${API_BASE}/api/report_json/save`, { params: { hash } });

// Save & download PDF (returns blob)
export const savePdfReport = (hash) =>
  axios.get(`${API_BASE}/api/download_pdf/save`, { params: { hash }, responseType: 'blob' });

// List saved reports
export const listSavedReports = () =>
  axios.get(`${API_BASE}/api/reports`);
