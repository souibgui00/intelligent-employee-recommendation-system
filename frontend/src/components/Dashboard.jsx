import { useEffect, useState } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    api.get('/dashboard')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load dashboard');
        setLoading(false);
      });
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div>Loading Dashboard...</div>;
  if (error) return <div>{error}</div>;
  if (!data) return null;

  const departments = Array.isArray(data.departments) ? data.departments : [];
  const activities = Array.isArray(data.activities) ? data.activities : [];
  const users = data.users || {};
  const activitiesStats = data.activities && !Array.isArray(data.activities) ? data.activities : {};

  return (
    <div>
      <h1>Dashboard</h1>
      {data.user && <p>Welcome, {data.user.name}</p>}
      {users.total !== undefined && <p>{users.total}</p>}
      {activitiesStats.total !== undefined && <p>{activitiesStats.total}</p>}
      <section>
        <h2>Departments</h2>
        {departments.length === 0
          ? <p>No departments found</p>
          : departments.map(d => (
              <div key={d.id}>{d.name} — {d.employeeCount} employees</div>
            ))
        }
      </section>
      <section>
        <h2>Recent Activities</h2>
        {activities.length === 0
          ? <p>No recent activities</p>
          : activities.map(a => (
              <div key={a.id}>{a.title}</div>
            ))
        }
      </section>
      <button onClick={fetchData}>Refresh</button>
    </div>
  );
};

export default Dashboard;
