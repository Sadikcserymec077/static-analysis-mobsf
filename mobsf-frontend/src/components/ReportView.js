// src/components/ReportView.js
import React from 'react';

export default function ReportView({ hash, savedJsonPath }) {
  if (!hash) return <div>Select an item to view report</div>;

  return (
    <div>
      <h3>Report for {hash}</h3>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => window.open(`/api/report_json?hash=${hash}`, '_blank')}>Open Raw JSON (proxy)</button>
        <button onClick={() => window.open(`/api/report_json/save?hash=${hash}`, '_blank')} style={{ marginLeft: 8 }}>Save & Open JSON</button>
        <button onClick={() => window.open(`/api/download_pdf/save?hash=${hash}`, '_blank')} style={{ marginLeft: 8 }}>Download PDF</button>
      </div>
      {savedJsonPath && (
        <div>
          <strong>Saved JSON:</strong> <a href={savedJsonPath} target="_blank" rel="noreferrer">Open saved JSON</a>
        </div>
      )}
    </div>
  );
}
