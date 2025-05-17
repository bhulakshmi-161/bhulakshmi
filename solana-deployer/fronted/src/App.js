import React, { useState, useEffect } from 'react';
import './App.css';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

function App() {
  const [network, setNetwork] = useState('devnet');
  const [rustFile, setRustFile] = useState(null);
  const [authKey, setAuthKey] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [result, setResult] = useState('');


  useEffect(() => {
    if (window.solana && window.solana.isPhantom) {
      window.solana.connect({ onlyIfTrusted: true })
        .then(({ publicKey }) => {
          setWalletAddress(publicKey.toString());
        })
        .catch(() => {
          // user not connected previously
        });
    }
  }, []);
  

  // Connect to Phantom Wallet
  const connectWallet = async () => {
    if ('solana' in window) {
      const provider = window.solana;
      if (provider.isPhantom) {
        try {
          const resp = await provider.connect();
          setWalletAddress(resp.publicKey.toString());
        } catch (err) {
          console.error('Wallet connection error:', err);
        }
      }
    } else {
      alert('Phantom wallet not found. Please install it!');
    }
  };

  const handleDeploy = async () => {
    if (!walletAddress) {
      alert('Please connect your Phantom wallet first.');
      return;
    }

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

      <button onClick={connectWallet}>
        {walletAddress ? `Connected: ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Connect Phantom Wallet'}
      </button>

      <br /><br />
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
