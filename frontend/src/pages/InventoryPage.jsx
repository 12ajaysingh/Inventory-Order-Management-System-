import { useEffect, useState } from 'react';
import Alert from '../components/Alert';
import { api } from '../services/api';

export default function InventoryPage() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const data = await api.getInventoryLogs();
        setLogs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Inventory Tracking</h2>
          <p>Audit stock changes from initial setup, manual adjustments, and orders.</p>
        </div>
      </div>

      <Alert message={error} onClose={() => setError('')} />

      <div className="card table-card">
        {loading ? (
          <p className="muted">Loading inventory logs...</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Change</th>
                  <th>Previous</th>
                  <th>New</th>
                  <th>Reason</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                    <td>{log.product_name}</td>
                    <td>{log.product_sku}</td>
                    <td className={log.change_amount < 0 ? 'negative' : 'positive'}>
                      {log.change_amount > 0 ? `+${log.change_amount}` : log.change_amount}
                    </td>
                    <td>{log.previous_stock}</td>
                    <td>{log.new_stock}</td>
                    <td>{log.reason}</td>
                    <td>{log.reference_id ? `#${log.reference_id}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
