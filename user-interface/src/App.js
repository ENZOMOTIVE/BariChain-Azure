import React, { useState } from 'react';
//import Web3 from 'web3';
import './App.css';

function UserInterface() {
  const [userData, setUserData] = useState({ ph: '', temp: '', turbidity: '' });
  const [response, setResponse] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const handleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    });
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      //const web3 = new Web3(window.ethereum);
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
      <h1>User Interface</h1>
      <button onClick={connectWallet}>Connect Wallet</button>
      {walletAddress && <p>Connected: {walletAddress}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          pH:
          <input type="number" name="ph" value={userData.ph} onChange={handleChange} />
        </label>
        <br />
        <label>
          Temperature:
          <input type="number" name="temp" value={userData.temp} onChange={handleChange} />
        </label>
        <br />
        <label>
          Turbidity:
          <input type="text" name="turbidity" value={userData.turbidity} onChange={handleChange} />
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>
      {response && <p>{response}</p>}
    </div>
  );
}

export default UserInterface;
