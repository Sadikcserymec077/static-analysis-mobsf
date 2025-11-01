// src/components/ScansCard.js
import React, { useEffect, useState } from 'react';
import { Card, ListGroup, Button, Badge } from 'react-bootstrap';
import { getScans } from '../api';

export default function ScansCard({ onSelect, refreshKey }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchScans(); }, []); // initial load
  useEffect(() => { if (refreshKey !== undefined) fetchScans(); }, [refreshKey]); // refresh when key changes

  async function fetchScans() {
    setLoading(true);
    try {
      const r = await getScans(1, 10);
      setScans(r.data.content || []);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Card.Title>Recent Scans</Card.Title>
        <ListGroup variant="flush">
          {scans.length === 0 && <div className="text-muted">No recent scans</div>}
          {scans.map((s) => (
            <ListGroup.Item key={s.MD5 || s.id} className="d-flex justify-content-between align-items-start">
              <div>
                <div className="fw-bold">{s.APP_NAME || s.FILE_NAME}</div>
                <div className="text-muted small">{s.PACKAGE_NAME}</div>
                <div className="text-muted small">v{ s.VERSION_NAME || '?' } • { new Date(s.TIMESTAMP).toLocaleString() }</div>
              </div>
              <div className="text-end">
                <Button size="sm" onClick={() => onSelect && onSelect(s)}>Open</Button>
                <div className="mt-2">
                  <Badge bg="secondary">{s.SCAN_TYPE}</Badge>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
        <div className="mt-2">
          <Button variant="link" size="sm" onClick={fetchScans} disabled={loading}>Refresh</Button>
        </div>
      </Card.Body>
    </Card>
  );
}
