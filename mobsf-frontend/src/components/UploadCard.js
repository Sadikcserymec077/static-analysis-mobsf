// src/components/UploadCard.js
// Replace your file with this (or patch the saveAndNotify logic)
import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, ProgressBar, Form, Badge } from 'react-bootstrap';
import { uploadFile, triggerScan, getScanLogs, saveJsonReport, getReportJSON } from '../api';

export default function UploadCard({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | uploading | uploaded | scanning | ready | error
  const [message, setMessage] = useState('');
  const [hash, setHash] = useState(null);
  const pollRef = useRef(null);
  const errorCountRef = useRef(0);
  const backoffRef = useRef(5000);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const startPolling = (h) => {
    if (pollRef.current) clearInterval(pollRef.current);
    errorCountRef.current = 0;
    backoffRef.current = 5000;

    const readyKeywords = [
      'generating report','generation complete','completed','finished',
      'saving to database','saved to database','report generated',
      'saving results','saving to db'
    ];

    async function pollOnce() {
      try {
        const r = await getScanLogs(h);
        const logs = r.data.logs || [];
        const joined = JSON.stringify(logs).toLowerCase();

        const isReady = readyKeywords.some(k => joined.includes(k));
        if (isReady) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setStatus('ready');
          setMessage('Scan complete.');
          // Save JSON but do NOT display its path — only notify parent
          try {
            await saveJsonReport(h);
          } catch (e) {
            // ignore save error for UI message; parent still notified
            console.error('saveJsonReport error', e?.response?.data || e?.message || e);
          }
          onUploaded && onUploaded({ hash: h }); // notify parent (no path)
          return;
        }

        // fallback probe
        try {
          const probe = await getReportJSON(h);
          if (probe?.status === 200 && probe?.data) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setStatus('ready');
            setMessage('Scan complete.');
            try { await saveJsonReport(h); } catch(e){ console.error('saveJsonReport error', e); }
            onUploaded && onUploaded({ hash: h });
            return;
          }
        } catch (probeErr) {
          // ignore
        }

        setStatus('scanning');
        const last = logs.length ? logs[logs.length - 1] : null;
        if (last && last.status) setMessage(`${last.timestamp || ''} — ${last.status}`);
        else setMessage('Scanning... (waiting for logs)');
        errorCountRef.current = 0;
        backoffRef.current = 5000;
      } catch (err) {
        console.error('scan_logs polling error:', err?.response?.status, err?.response?.data || err?.message || err);
        // fallback probe attempt
        try {
          const probe = await getReportJSON(h);
          if (probe?.status === 200 && probe?.data) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setStatus('ready');
            setMessage('Scan complete.');
            try { await saveJsonReport(h); } catch(e){ console.error('saveJsonReport error', e); }
            onUploaded && onUploaded({ hash: h });
            return;
          }
        } catch (probeErr) {
          console.warn('report_json probe failed:', probeErr?.response?.data || probeErr?.message || probeErr);
        }

        errorCountRef.current += 1;
        if (errorCountRef.current >= 6) {
          setMessage('Temporary connection problems fetching logs. Will keep checking in background.');
        } else {
          setMessage('Polling logs... (temporary error, retrying)');
        }
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = setInterval(pollOnce, backoffRef.current);
          backoffRef.current = Math.min(backoffRef.current * 1.8, 60000);
        }
      }
    }

    pollOnce();
    pollRef.current = setInterval(pollOnce, backoffRef.current);
  };

  const handleUpload = async () => {
    if (!file) return setMessage('Choose an APK first.');
    setStatus('uploading'); setProgress(2); setMessage('Uploading...');
    try {
      const res = await uploadFile(file, (pe) => setProgress(Math.round((pe.loaded * 100) / pe.total)));
      const h = res.data.hash || res.data.MD5 || res.data.md5;
      setHash(h);
      setStatus('uploaded');
      setMessage('Uploaded — hash: ' + h);
      setStatus('scanning');
      await triggerScan(h);
      setMessage('Scan triggered — polling logs...');
      startPolling(h);
    } catch (err) {
      console.error('upload error:', err?.response?.status, err?.response?.data || err?.message || err);
      setStatus('error');
      const errMsg = err?.response?.data?.error || err?.message || 'Upload failed';
      setMessage(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    }
  };

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <h5 className="mb-0">Upload APK</h5>
            <small className="text-muted">Status: <Badge bg={status === 'ready' ? 'success' : status === 'error' ? 'danger' : 'secondary'}>{status}</Badge></small>
          </div>
        </div>

        <Form.Group controlId="fileInput" className="mb-2">
          <Form.Control type="file" accept=".apk,.zip,.xapk,.apks" onChange={handleChange} />
        </Form.Group>

        <div className="d-flex gap-2">
          <Button variant="primary" onClick={handleUpload} disabled={!file || status === 'uploading' || status === 'scanning'}>
            {status === 'uploading' ? 'Uploading…' : 'Upload & Scan'}
          </Button>
          <Button variant="outline-secondary" onClick={() => { setFile(null); setProgress(0); setMessage(''); setHash(null); }}>
            Reset
          </Button>
        </div>

        <div className="mt-3">
          <ProgressBar now={progress} label={progress > 0 ? `${progress}%` : ''} animated={status === 'uploading'} />
          <div className="mt-2 text-break" style={{ whiteSpace: 'pre-wrap' }}>{message}</div>
          {hash && <div className="small text-muted mt-1">Hash: {hash}</div>}
        </div>
      </Card.Body>
    </Card>
  );
}
