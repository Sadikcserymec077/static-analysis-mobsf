// src/components/ReportPanel.js
import React, { useState, useEffect } from "react";
import { Card, Button, Badge } from "react-bootstrap";
import { savePdfReport, saveJsonReport, getReportJSON } from "../api";
import HumanReport from "./HumanReport";

export default function ReportPanel({ hash, initialJsonPath }) {
  const [report, setReport] = useState(null);
  const [jsonPath, setJsonPath] = useState(initialJsonPath || null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [msg, setMsg] = useState("");
  const [viewMode, setViewMode] = useState("none"); // 'none' | 'json' | 'pdf'

  useEffect(() => {
    // Reset when hash changes
    setReport(null);
    setJsonPath(initialJsonPath || null);
    setPdfUrl(null);
    setMsg("");
    setViewMode("none");

    if (!hash) return;

    // Auto-load saved JSON report when a new hash is selected
    (async () => {
      setLoading(true);
      setMsg("Loading report...");
      try {
        const r = await saveJsonReport(hash);
        const payload = r.data.data || r.data;
        setReport(payload);
        setJsonPath(r.data.path || `/reports/json/${hash}`);
        setViewMode("json");
        setMsg("");
      } catch (e) {
        // fallback to GET proxy
        try {
          const r2 = await getReportJSON(hash);
          setReport(r2.data);
          setViewMode("json");
          setMsg("");
        } catch (e2) {
          setMsg("Failed to load report JSON: " + (e2?.response?.data || e2?.message || e?.message));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [hash, initialJsonPath]);

  // Explicit Summary button handler (reloads JSON and shows human report)
  const handleShowSummary = async () => {
    if (!hash) { setMsg("No hash selected"); return; }
    setLoading(true);
    setMsg("Loading summary...");
    try {
      const r = await saveJsonReport(hash);
      const payload = r.data.data || r.data;
      setReport(payload);
      setJsonPath(r.data.path || `/reports/json/${hash}`);
      setViewMode("json");
      setMsg("");
    } catch (e) {
      // fallback to GET proxy
      try {
        const r2 = await getReportJSON(hash);
        setReport(r2.data);
        setViewMode("json");
        setMsg("");
      } catch (e2) {
        setMsg("Failed to load summary: " + (e2?.response?.data || e2?.message || e?.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewPDF = async () => {
    if (!hash) { setMsg("No hash selected"); return; }
    setLoading(true); setMsg("Fetching PDF...");
    try {
      const r = await savePdfReport(hash); // blob
      const blob = new Blob([r.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setViewMode("pdf");
      setMsg("PDF preview loaded below.");
    } catch (e) {
      setMsg("PDF fetch failed: " + (e?.response?.data || e?.message));
    } finally { setLoading(false); }
  };

  const handleDownloadPdf = async () => {
    if (!hash) { setMsg("No hash selected"); return; }
    setMsg("Preparing PDF for download...");
    try {
      const r = await savePdfReport(hash);
      const blob = new Blob([r.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${hash}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg("Download started.");
    } catch (e) {
      setMsg("Download failed: " + (e?.response?.data || e?.message));
    }
  };

  const closePdf = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setViewMode("none");
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <Card.Title>Report</Card.Title>
            <div className="text-muted">Hash: <Badge bg="light" text="dark">{hash || "none"}</Badge></div>
          </div>

          <div>
            {/* Summary button to switch to human-friendly report */}
            <Button variant="outline-secondary" size="sm" onClick={handleShowSummary} disabled={!hash || loading}>Summary</Button>{' '}
            <Button variant="warning" size="sm" onClick={handlePreviewPDF} disabled={!hash || loading}>Preview PDF</Button>{' '}
            <Button variant="success" size="sm" onClick={handleDownloadPdf} disabled={!hash || loading}>Download PDF</Button>
            {viewMode === 'pdf' && <Button variant="outline-danger" size="sm" onClick={closePdf} style={{ marginLeft: 8 }}>Close PDF</Button>}
          </div>
        </div>

        {msg && <div className="alert alert-info py-1">{msg}</div>}

        {/* Show the human-friendly JSON report */}
        {viewMode === 'json' && report && (
          <div>
            <div style={{ marginBottom: 8 }}>
              {jsonPath && <small>Saved JSON: <a href={jsonPath} target="_blank" rel="noreferrer">{jsonPath}</a></small>}
            </div>
            <HumanReport data={report} />
          </div>
        )}

        {/* PDF preview */}
        {viewMode === 'pdf' && pdfUrl && (
          <div>
            <iframe title="report-pdf" src={pdfUrl} style={{ width: '100%', height: 640, border: '1px solid #ddd', borderRadius: 6 }} />
          </div>
        )}

        {/* placeholder */}
        {viewMode === 'none' && <div className="text-muted">Report will load automatically when a scan is selected. Use Preview PDF or Summary to switch views.</div>}
      </Card.Body>
    </Card>
  );
}
