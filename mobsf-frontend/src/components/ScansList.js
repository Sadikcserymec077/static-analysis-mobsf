import React, { useEffect, useState } from 'react';
import { getScans } from '../api';

export default function ScansList({ onSelect }) {
  const [scans, setScans] = useState([]);
  useEffect(() => {
    getScans(1, 20).then(r => setScans(r.data.content || []))
      .catch(e => { console.error(e); });
  }, []);

  return (
    <div>
      <h3>Recent Scans</h3>
      <ul>
        {scans.map(s => (
          <li key={s.MD5 || s.id}>
            <button onClick={() => onSelect(s)} style={{marginRight:8}}>Open</button>
            {s.APP_NAME} — {s.PACKAGE_NAME} — {s.MD5}
          </li>
        ))}
      </ul>
    </div>
  );
}
