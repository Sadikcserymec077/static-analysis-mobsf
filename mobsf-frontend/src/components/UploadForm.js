// src/components/UploadForm.js
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button, Spinner, ProgressBar } from "react-bootstrap";

/**
 * UploadForm
 * - Paste this file at: mobsf-frontend/src/components/UploadForm.js
 *
 * Props (optional):
 * - onUploadSuccess(hash)  -> called right after upload returns a hash
 * - onScanComplete(hash)   -> called after scan completes and JSON is saved
 * - refreshScans()         -> optional callback to refresh scan list in parent
 *
 * Requirements:
 * - REACT_APP_API_BASE in .env.local (e.g. http://localhost:4000)
 *
 * Notes:
 * - Upload endpoint: POST ${API_BASE}/api/upload (multipart/form-data)
 * - Trigger scan: POST ${API_BASE}/api/scan (x-www-form-urlencoded { hash })
 * - Poll logs: POST ${API_BASE}/api/scan_logs (x-www-form-urlencoded { hash })
 * - Save JSON: GET  ${API_BASE}/api/report_json/save?hash=${hash}
 *   (adjust these if your backend uses different endpoints)
 */

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";

export default function UploadForm({ onUploadSuccess, onScanComplete, refreshScans }) {
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [progress, setProgress] = useState(0); // 0-100
  const [isScanning, setIsScanning] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [message, setMessage] = useState("");
  const [hash, setHash] = useState(null);

  // refs for timers/intervals so we can clear them
  const heuristicTimerRef = useRef(null);
  const pollTimerRef = useRef(null);
  const lastLogIndexRef = useRef(0);
  const heuristicValueRef = useRef(0);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (heuristicTimerRef.current) clearInterval(heuristicTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const handleChange = (e) => {
    setSelectedFiles(e.target.files);
    if (e.target.files && e.target.files[0]) {
      setCurrentFileName(e.target.files[0].name);
    } else {
      setCurrentFileName("");
    }
    // reset UI for new selection
    setProgress(0);
    setIsScanning(false);
    setStatusText("");
    setMessage("");
  };

  const startHeuristicProgress = () => {
    // start at 1%
    heuristicValueRef.current = 1;
    setProgress(1);
    setStatusText("Scanning... 1%");
    // increase slowly up to 95% while waiting for real logs
    heuristicTimerRef.current = setInterval(() => {
      // only increment when scanning
      if (!isScanning) return;
      const cur = heuristicValueRef.current;
      const inc = cur < 50 ? Math.ceil(Math.random() * 4) : Math.ceil(Math.random() * 2); // earlier faster, later slower
      heuristicValueRef.current = Math.min(95, cur + inc);
      setProgress(Math.floor(heuristicValueRef.current));
      setStatusText(`Scanning... ${Math.floor(heuristicValueRef.current)}%`);
    }, 700);
  };

  const stopHeuristicProgress = () => {
    if (heuristicTimerRef.current) {
      clearInterval(heuristicTimerRef.current);
      heuristicTimerRef.current = null;
    }
    heuristicValueRef.current = 0;
  };

  const pollScanLogs = (theHash) => {
    // clear existing poll if any
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    lastLogIndexRef.current = 0;

    pollTimerRef.current = setInterval(async () => {
      try {
        const body = new URLSearchParams({ hash: theHash }).toString();
        const resp = await axios.post(`${API_BASE}/api/scan_logs`, body, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        const logs = resp?.data?.logs || [];
        // if logs length increased, bump heuristic a bit
        if (logs.length > lastLogIndexRef.current) {
          // bump by a few percent for each new log
          heuristicValueRef.current = Math.min(98, (heuristicValueRef.current || 1) + 4 + (logs.length - lastLogIndexRef.current));
          setProgress(Math.floor(heuristicValueRef.current));
          setStatusText(`Scanning... ${Math.floor(heuristicValueRef.current)}%`);
          lastLogIndexRef.current = logs.length;
        }

        // look for keywords indicating completion/generation
        const last = logs[logs.length - 1];
        const statusTextLower = last?.status?.toString?.().toLowerCase?.() || "";

        const doneKeywords = [
          "generating report",
          "report generated",
          "report generation complete",
          "scan completed",
          "completed",
          "generating json",
          "saved report",
          "report saved",
          "done"
        ];

        const isDone = doneKeywords.some((kw) => statusTextLower.includes(kw));

        if (isDone) {
          // finalize
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;

          stopHeuristicProgress();
          setProgress(100);
          setStatusText("✅ Scan Complete");
          setIsScanning(false);
          setMessage("Scan complete. Saving report...");

          // fetch/save the JSON via backend method (adjust endpoint if necessary)
          try {
            // GET /api/report_json/save?hash=<hash>
            await axios.get(`${API_BASE}/api/report_json/save?hash=${theHash}`);
            setMessage("Report saved.");
            setHash(theHash);
            if (typeof onScanComplete === "function") onScanComplete(theHash);
            if (typeof refreshScans === "function") refreshScans();
          } catch (err) {
            console.error("Failed to save JSON report:", err);
            setMessage("Scan complete but failed to fetch report JSON (check backend).");
          }
        }
      } catch (err) {
        // network or server error - keep polling but show temporary message
        console.warn("Polling logs error:", err?.message || err);
        setMessage("Polling logs... (temporary network error)");
      }
    }, 1500);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!selectedFiles || selectedFiles.length === 0) {
      setMessage("Select a file first.");
      return;
    }

    const file = selectedFiles[0];
    const formData = new FormData();
    formData.append("file", file);

    // reset UI state for new upload
    setProgress(0);
    setIsScanning(false);
    setStatusText("");

    try {
      setMessage("Uploading...");
      // upload with axios to backend proxy
      const res = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const p = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // cap upload progress to 85 so scanning shows later
          const up = Math.min(85, Math.max(1, Math.floor(p * 0.9)));
          setProgress(up);
          setStatusText(`Uploading... ${up}%`);
        },
      });

      // get hash from backend response (different backends may return different keys)
      const returnedHash = res?.data?.hash || res?.data?.MD5 || res?.data?.md5 || res?.data?.file_hash;
      if (!returnedHash) {
        setMessage("Upload succeeded but server did not return a hash.");
        return;
      }

      setMessage("Upload successful. Triggering scan...");
      if (typeof onUploadSuccess === "function") onUploadSuccess(returnedHash);

      // Start scanning UI
      setIsScanning(true);
      setProgress(1);
      setStatusText("Scanning... 1%");
      startHeuristicProgress();

      // trigger scan (x-www-form-urlencoded)
      const body = new URLSearchParams({ hash: returnedHash }).toString();
      await axios.post(`${API_BASE}/api/scan`, body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      // start polling scan logs for completion
      pollScanLogs(returnedHash);
    } catch (err) {
      console.error("Upload/scan error:", err);
      const friendly = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Upload failed";
      setMessage(String(friendly));
      setIsScanning(false);
      stopHeuristicProgress();
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }
  };

  return (
    <div>
      <form onSubmit={handleUpload}>
        <div className="mb-2">
          <input type="file" accept=".apk,.aab,.zip,.ipa" onChange={handleChange} />
          <Button type="submit" variant="secondary" size="sm" style={{ marginLeft: 8 }}>
            Upload & Start Scan
          </Button>
        </div>

        {currentFileName && <div>Selected: <strong>{currentFileName}</strong></div>}

        {/* Progress UI */}
        { (isScanning || progress > 0) && (
          <div style={{ marginTop: 12 }}>
            <div className="d-flex align-items-center" style={{ gap: 12 }}>
              <div>
                {isScanning ? <Spinner animation="border" size="sm" /> : <Spinner animation="grow" size="sm" />}
              </div>
              <div style={{ flex: 1 }}>
                <ProgressBar
                  now={progress}
                  label={`${progress}%`}
                  animated
                  striped
                  variant={progress < 100 ? "info" : "success"}
                  style={{ height: 10 }}
                />
                <div style={{ marginTop: 6 }}>
                  <small className="text-muted">
                    {statusText || (progress < 100 ? `Uploading... ${progress}%` : "✅ Scan Complete")}
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}

        {message && <div className="mt-2"><small>{message}</small></div>}
      </form>
    </div>
  );
}
