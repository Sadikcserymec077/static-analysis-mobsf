// src/App.js (relevant parts)
import React, { useState } from 'react';
import NavBar from './components/NavBar';
import UploadCard from './components/UploadCard';
import ScansCard from './components/ScansCard';
import ReportPanel from './components/ReportPanel';

function App() {
  const [selected, setSelected] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploaded = (data) => {
    // data = { hash }
    setSelected({ hash: data.hash });
    // bump refreshKey to signal ScansCard to reload
    setRefreshKey(k => k + 1);
  };

  return (
    <>
      <NavBar />
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-4">
            <UploadCard onUploaded={handleUploaded} />
            <ScansCard onSelect={(s) => setSelected({ hash: s.MD5 || s.MD5 || s.MD5 })} refreshKey={refreshKey} />
          </div>
          <div className="col-md-8">
            <ReportPanel hash={selected?.hash} />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
