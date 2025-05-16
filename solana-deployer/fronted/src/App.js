import React, { useState } from 'react';
import './App.css';

function App() {
  const [network, setNetwork] = useState('devnet');
  const [rustFile, setRustFile] = useState(null);
  const [authKey, setAuthKey] = useState(null);
  const [result, setResult] = useState('');

  const handleDeploy = async () => {
    const formData = new FormData();
    formData.append('network', network);
    formData.append('rustFile', rustFile);
    formData.append('authKey', authKey);

    const res = await fetch('http://localhost:3001/deploy', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
  };

  return (
    <div className="App">
      <h1>Solana Program Deployment</h1>
      <label>
        Select Network:
        <select value={network} onChange={e => setNetwork(e.target.value)}>
          <option value="devnet">Devnet</option>
          <option value="mainnet">Mainnet</option>
        </select>
      </label>
      <br /><br />
      <input type="file" accept=".rs" onChange={e => setRustFile(e.target.files[0])} />
      <br /><br />
      <input type="file" accept=".json" onChange={e => setAuthKey(e.target.files[0])} />
      <br /><br />
      <button onClick={handleDeploy}>Deploy</button>

      <pre style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>{result}</pre>
    </div>
  );
}

export default App;
