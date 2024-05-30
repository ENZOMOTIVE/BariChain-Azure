import React, { useState, useEffect } from 'react';
import './App.css';

function UserInterface() {
  const [userData, setUserData] = useState({ ph: '', temp: '', turbidity: '' });
  const [response, setResponse] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  // Simulate fetching data from an IoT device
  const fetchIoTData = () => {
    // Generate random data
    const newData = {
      ph: Math.floor(Math.random() * 14), // Simulating pH value between 0 and 14, rounded to integer
      temp: Math.floor(Math.random() * 100), // Simulating temperature value, rounded to integer
      turbidity: Math.random().toFixed(2) // Simulating turbidity value and converting to string with 2 decimal places
    };
    setUserData(newData);
  };
  
  useEffect(() => {
    // Fetch IoT data every 5 seconds
    const interval = setInterval(fetchIoTData, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    });
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        console.log('Connected to wallet:', accounts[0]);
      } catch (error) {
        console.error('User rejected the request.');
      }
    } else {
      console.error('MetaMask is not installed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/user-interface', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...userData, walletAddress })
      });
      const data = await res.json();
      setResponse(data.validation);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>User Interface</h1>
        <button className="connect-button" onClick={connectWallet}>Connect Wallet</button>
        {walletAddress && <p>Connected: {walletAddress}</p>}
      </header>
      <form onSubmit={handleSubmit}>
        <label>
          pH:
          <input type="number" name="ph" value={userData.ph} onChange={handleChange} />
        </label>
        <label>
          Temperature:
          <input type="number" name="temp" value={userData.temp} onChange={handleChange} />
        </label>
        <label>
          Turbidity:
          <input type="number" name="turbidity" value={userData.turbidity} onChange={handleChange} />
        </label>
        <button type="submit">Submit</button>
      </form>
      {response && <p className="response-message">{response}</p>}
    </div>
  );
}

export default UserInterface;
