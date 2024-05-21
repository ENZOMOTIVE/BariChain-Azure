import React, { useState } from 'react';

function App() {
  const [userData, setUserData] = useState({ ph: '', temp: '', turbidity: '' });
  const [response, setResponse] = useState('');

  const handleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/user-interface', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
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

export default App;
