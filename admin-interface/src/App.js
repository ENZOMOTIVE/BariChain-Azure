import React, { useState } from 'react';
import './App.css';

function AdminInterface() {
  const [adminCriteria, setAdminCriteria] = useState({ ph: '', temp: '', turbidity: '' });

  const handleChange = (e) => {
    setAdminCriteria({
      ...adminCriteria,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/admin-interface', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adminCriteria)
      });
      const data = await res.json();
      alert(data.message);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Admin Interface</h1>
      </header>
      <form onSubmit={handleSubmit} className="admin-form">
        <label>
          pH:
          <input type="number" name="ph" value={adminCriteria.ph} onChange={handleChange} />
        </label>
        <label>
          Temperature:
          <input type="number" name="temp" value={adminCriteria.temp} onChange={handleChange} />
        </label>
        <label>
          Turbidity:
          <input type="text" name="turbidity" value={adminCriteria.turbidity} onChange={handleChange} />
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default AdminInterface;
