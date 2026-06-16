import { useEffect, useState } from 'react';
import Alert from '../components/Alert';
import { api } from '../services/api';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
    };

    try {
      if (editingId) {
        await api.updateCustomer(editingId, payload);
        setSuccess('Customer updated successfully.');
      } else {
        await api.createCustomer(payload);
        setSuccess('Customer created successfully.');
      }
      resetForm();
      await loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (customer) => {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    setError('');
    try {
      await api.deleteCustomer(id);
      setSuccess('Customer deleted.');
      await loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Customers</h2>
          <p>Maintain customer records with unique email addresses.</p>
        </div>
      </div>

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="grid-two">
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Customer' : 'Add Customer'}</h3>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>
          <label>
            Address
            <textarea name="address" value={form.address} onChange={handleChange} rows={3} />
          </label>
          <div className="form-actions">
            {editingId && (
              <button type="button" className="button secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
            <button type="submit" className="button primary">
              {editingId ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>

        <div className="card table-card">
          <div className="table-header">
            <h3>Customer List</h3>
            <span>{customers.length} customers</span>
          </div>
          {loading ? (
            <p className="muted">Loading customers...</p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <strong>{customer.name}</strong>
                        {customer.address && <div className="muted small">{customer.address}</div>}
                      </td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || '—'}</td>
                      <td className="actions">
                        <button type="button" className="button ghost" onClick={() => startEdit(customer)}>
                          Edit
                        </button>
                        <button type="button" className="button danger" onClick={() => handleDelete(customer.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
