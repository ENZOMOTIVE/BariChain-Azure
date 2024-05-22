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
      <h1>Admin Interface</h1>
      <form onSubmit={handleSubmit}>
        <label>
          pH:
          <input type="number" name="ph" value={adminCriteria.ph} onChange={handleChange} />
        </label>
        <br />
        <label>
          Temperature:
          <input type="number" name="temp" value={adminCriteria.temp} onChange={handleChange} />
        </label>
        <br />
        <label>
          Turbidity:
          <input type="text" name="turbidity" value={adminCriteria.turbidity} onChange={handleChange} />
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default AdminInterface;
