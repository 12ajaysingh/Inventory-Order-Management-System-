import { useEffect, useState } from 'react';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import { api } from '../services/api';

const emptyForm = {
  name: '',
  sku: '',
  description: '',
  price: '',
  stock_quantity: '',
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inventoryModal, setInventoryModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
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
      sku: form.sku.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity),
    };

    try {
      if (editingId) {
        await api.updateProduct(editingId, {
          name: payload.name,
          description: payload.description,
          price: payload.price,
          stock_quantity: payload.stock_quantity,
        });
        setSuccess('Product updated successfully.');
      } else {
        await api.createProduct(payload);
        setSuccess('Product created successfully.');
      }
      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      price: String(product.price),
      stock_quantity: String(product.stock_quantity),
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setError('');
    try {
      await api.deleteProduct(id);
      setSuccess('Product deleted.');
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const openInventory = async (product) => {
    try {
      const logs = await api.getProductInventory(product.id);
      setInventoryModal({ product, logs });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p>Manage catalog items, stock levels, and unique SKUs.</p>
        </div>
      </div>

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="grid-two">
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Product' : 'Add Product'}</h3>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            SKU
            <input name="sku" value={form.sku} onChange={handleChange} required disabled={Boolean(editingId)} />
          </label>
          <label>
            Description
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
          </label>
          <div className="form-row">
            <label>
              Price
              <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required />
            </label>
            <label>
              Stock
              <input name="stock_quantity" type="number" min="0" value={form.stock_quantity} onChange={handleChange} required />
            </label>
          </div>
          <div className="form-actions">
            {editingId && (
              <button type="button" className="button secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
            <button type="submit" className="button primary">
              {editingId ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>

        <div className="card table-card">
          <div className="table-header">
            <h3>Product List</h3>
            <span>{products.length} items</span>
          </div>
          {loading ? (
            <p className="muted">Loading products...</p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        {product.description && <div className="muted small">{product.description}</div>}
                      </td>
                      <td>{product.sku}</td>
                      <td>${Number(product.price).toFixed(2)}</td>
                      <td>
                        <span className={product.stock_quantity <= 5 ? 'badge warning' : 'badge success'}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="actions">
                        <button type="button" className="button ghost" onClick={() => openInventory(product)}>
                          Inventory
                        </button>
                        <button type="button" className="button ghost" onClick={() => startEdit(product)}>
                          Edit
                        </button>
                        <button type="button" className="button danger" onClick={() => handleDelete(product.id)}>
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

      {inventoryModal && (
        <Modal title={`Inventory History: ${inventoryModal.product.name}`} onClose={() => setInventoryModal(null)}>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Change</th>
                  <th>Previous</th>
                  <th>New</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {inventoryModal.logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                    <td>{log.change_amount}</td>
                    <td>{log.previous_stock}</td>
                    <td>{log.new_stock}</td>
                    <td>{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </section>
  );
}
