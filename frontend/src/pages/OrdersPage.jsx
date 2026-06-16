import { useEffect, useMemo, useState } from 'react';
import Alert from '../components/Alert';
import { api } from '../services/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [lineItems, setLineItems] = useState([{ product_id: '', quantity: 1 }]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const productMap = useMemo(
    () => Object.fromEntries(products.map((product) => [String(product.id), product])),
    [products],
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, customersData, productsData] = await Promise.all([
        api.getOrders(),
        api.getCustomers(),
        api.getProducts(),
      ]);
      setOrders(ordersData);
      setCustomers(customersData);
      setProducts(productsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateLineItem = (index, field, value) => {
    setLineItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  };

  const addLineItem = () => {
    setLineItems((current) => [...current, { product_id: '', quantity: 1 }]);
  };

  const removeLineItem = (index) => {
    setLineItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const estimatedTotal = lineItems.reduce((total, item) => {
    const product = productMap[item.product_id];
    if (!product) return total;
    return total + Number(product.price) * Number(item.quantity || 0);
  }, 0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      customer_id: Number(customerId),
      items: lineItems.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      })),
    };

    try {
      await api.createOrder(payload);
      setSuccess('Order placed successfully. Stock has been reduced automatically.');
      setCustomerId('');
      setLineItems([{ product_id: '', quantity: 1 }]);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>Orders</h2>
          <p>Create orders with inventory validation and automatic stock reduction.</p>
        </div>
      </div>

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="grid-two">
        <form className="card form-card" onSubmit={handleSubmit}>
          <h3>Create Order</h3>
          <label>
            Customer
            <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
          </label>

          <div className="line-items">
            <div className="line-items-header">
              <h4>Line Items</h4>
              <button type="button" className="button ghost" onClick={addLineItem}>
                Add Item
              </button>
            </div>

            {lineItems.map((item, index) => {
              const product = productMap[item.product_id];
              const insufficient = product && Number(item.quantity) > product.stock_quantity;

              return (
                <div className="line-item" key={index}>
                  <label>
                    Product
                    <select
                      value={item.product_id}
                      onChange={(event) => updateLineItem(index, 'product_id', event.target.value)}
                      required
                    >
                      <option value="">Select product</option>
                      {products.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.name} ({entry.sku}) — stock: {entry.stock_quantity}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Quantity
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => updateLineItem(index, 'quantity', event.target.value)}
                      required
                    />
                  </label>
                  {lineItems.length > 1 && (
                    <button type="button" className="button danger" onClick={() => removeLineItem(index)}>
                      Remove
                    </button>
                  )}
                  {insufficient && (
                    <p className="field-error">Insufficient stock for selected quantity.</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="summary-box">
            <span>Estimated total</span>
            <strong>${estimatedTotal.toFixed(2)}</strong>
          </div>

          <button type="submit" className="button primary" disabled={!customerId || lineItems.length === 0}>
            Place Order
          </button>
        </form>

        <div className="card table-card">
          <div className="table-header">
            <h3>Recent Orders</h3>
            <span>{orders.length} orders</span>
          </div>
          {loading ? (
            <p className="muted">Loading orders...</p>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <article className="order-card" key={order.id}>
                  <div className="order-card-header">
                    <div>
                      <strong>Order #{order.id}</strong>
                      <div className="muted small">{order.customer_name}</div>
                    </div>
                    <div className="order-meta">
                      <span className="badge success">{order.status}</span>
                      <strong>${Number(order.total_amount).toFixed(2)}</strong>
                    </div>
                  </div>
                  <ul>
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.product_name} ({item.product_sku}) × {item.quantity}
                      </li>
                    ))}
                  </ul>
                  <p className="muted small">{new Date(order.created_at).toLocaleString()}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
