import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function LogsModal({ show, onHide, logs }) {
  const [scrollRef, setScrollRef] = useState(null);

  useEffect(() => {
    if (scrollRef) scrollRef.scrollTop = scrollRef.scrollHeight;
  }, [logs, scrollRef]);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Scan Logs</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div ref={el => setScrollRef(el)} style={{ maxHeight: 400, overflow: 'auto', background:'#fafafa', padding:10 }}>
          {logs && logs.length === 0 && <div className="text-muted">No logs</div>}
          <ul className="mb-0">
            {logs?.map((l, i) => <li key={i}>{l.timestamp ? `${l.timestamp} — ${l.status}` : JSON.stringify(l)}</li>)}
          </ul>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
