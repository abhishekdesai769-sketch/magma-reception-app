import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle,
  DollarSign,
  Clock,
  ShoppingCart,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import PageWrapper from '../components/Layout/PageWrapper';
import { useSharePointList } from '../hooks/useSharePointList';
import { createPurchaseOrder } from '../services/graphApi';

const statusColor = {
  Ordered: '#00d4ff',
  Shipped: '#ffab00',
  Received: '#00e676',
  Delegated: '#a855f7',
  Cancelled: '#ff3d5a',
};

const vendorChoices = ['Amazon', 'Instacart', 'MCS', 'Denis', 'Walmart', 'Superstore', 'Dollarama', 'Ikea', 'Other'];
const deptChoices = ['Administration', 'Reception', 'Settlement', 'Language', 'IT', 'Finance', 'HR', 'Facilities', 'CELPIP', 'Kitchen'];

const vendorColor = {
  Amazon: '#ff9900', Instacart: '#43b02a', MCS: '#00d4ff', Denis: '#a855f7',
  Walmart: '#0071dc', Superstore: '#e1261c', Dollarama: '#ffd700', Ikea: '#ffda1a', Other: '#8b949e',
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

// ─── Form styles (shared pattern) ───
const f = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20,
  },
  modal: {
    background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
    borderRadius: 16, padding: 32, width: '100%', maxWidth: 540,
    maxHeight: '90vh', overflowY: 'auto', position: 'relative',
  },
  title: {
    fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: 14, minHeight: 48, outline: 'none' },
  textarea: { width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: 14, minHeight: 70, outline: 'none', resize: 'vertical' },
  group: { marginBottom: 20 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: (active, color = '#00d4ff') => ({
    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
    background: active ? color + '20' : 'rgba(255,255,255,0.04)',
    color: active ? color : 'var(--text-muted)',
    borderWidth: 1, borderStyle: 'solid',
    borderColor: active ? color + '50' : 'var(--glass-border)',
  }),
  submitBtn: (loading, success) => ({
    width: '100%', padding: 16, borderRadius: 10, border: 'none',
    fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
    minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
    background: loading ? 'rgba(0,212,255,0.1)' : success ? 'rgba(0,230,118,0.2)' : 'linear-gradient(135deg, #00d4ff 0%, #0090b3 100%)',
    color: loading ? '#00d4ff' : success ? '#00e676' : '#0a0a0f',
  }),
  error: { color: '#ff3d5a', fontSize: 13, textAlign: 'center', marginTop: 8 },
};

const s = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' },
  newBtn: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #00d4ff 0%, #0090b3 100%)', color: '#0a0a0f', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer', minHeight: 48, border: 'none' },
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-8)' },
  summaryCard: { background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur))', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' },
  summaryIconWrap: (color) => ({ width: 44, height: 44, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: color + '15', flexShrink: 0 }),
  summaryValue: (color) => ({ fontSize: '1.5rem', fontWeight: 700, color, lineHeight: 1 }),
  summaryLabel: { fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 },
  tableWrap: { background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur))', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' },
  th: { textAlign: 'left', padding: 'var(--space-4) var(--space-5)', color: 'var(--text-muted)', fontWeight: 600, fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-default)', whiteSpace: 'nowrap' },
  td: { padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' },
  statusBadge: (color) => ({ display: 'inline-block', padding: '3px 12px', borderRadius: 'var(--radius-full)', background: color + '18', color, fontSize: 'var(--text-xs)', fontWeight: 600 }),
  cost: { fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)', color: 'var(--text-muted)' },
  errorWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)', color: '#ff3d5a' },
  retryBtn: { padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', background: 'rgba(255,61,90,0.15)', border: '1px solid rgba(255,61,90,0.3)', color: '#ff3d5a', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr), 'MMM d, yyyy'); } catch { return dateStr; }
}

export default function PurchaseOrders() {
  const { data: rawData, loading, error, refresh } = useSharePointList('purchaseOrders');

  // ── Form state ──
  const [showForm, setShowForm] = useState(false);
  const [poTitle, setPoTitle] = useState('');
  const [poItem, setPoItem] = useState('');
  const [poQty, setPoQty] = useState('');
  const [poVendor, setPoVendor] = useState('');
  const [poOtherVendor, setPoOtherVendor] = useState('');
  const [poDept, setPoDept] = useState('');
  const [poCost, setPoCost] = useState('');
  const [poDelivery, setPoDelivery] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const resetForm = () => {
    setPoTitle(''); setPoItem(''); setPoQty(''); setPoVendor('');
    setPoOtherVendor(''); setPoDept(''); setPoCost(''); setPoDelivery(''); setPoNotes('');
  };

  const handleSubmit = async () => {
    if (!poTitle || !poItem || !poQty || !poVendor || !poDept || !poCost) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createPurchaseOrder({
        Title: poTitle,
        ItemOrdered: poItem,
        Quantity: parseInt(poQty, 10),
        Vendor: poVendor,
        OtherVendor: poVendor === 'Other' ? poOtherVendor : undefined,
        ForDepartment: poDept,
        Cost: parseFloat(poCost),
        OrderStatus: 'Ordered',
        DateOrdered: new Date().toISOString(),
        ExpectedDelivery: poDelivery || undefined,
        Notes: poNotes || undefined,
      });
      setSubmitSuccess(true);
      resetForm();
      refresh();
      setTimeout(() => { setSubmitSuccess(false); setShowForm(false); }, 1200);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const orders = rawData.map((item) => ({
    id: item.id,
    title: item.fields?.Title || 'Untitled',
    item: item.fields?.ItemOrdered || '—',
    vendor: item.fields?.Vendor || '—',
    status: item.fields?.OrderStatus || 'Ordered',
    cost: item.fields?.Cost ?? 0,
    dateOrdered: formatDate(item.fields?.DateOrdered),
    expectedDelivery: formatDate(item.fields?.ExpectedDelivery),
  }));

  const totalSpend = orders.filter((o) => o.status !== 'Cancelled').reduce((sum, o) => sum + (o.cost || 0), 0);
  const pendingCount = orders.filter((o) => o.status === 'Ordered' || o.status === 'Shipped').length;

  const summaryCards = [
    { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: '#00d4ff' },
    { label: 'Total Spend', value: `$${totalSpend.toFixed(2)}`, icon: DollarSign, color: '#00e676' },
    { label: 'Pending', value: pendingCount, icon: Clock, color: '#ffab00' },
  ];

  if (loading && rawData.length === 0) {
    return (
      <PageWrapper title="Purchase Orders">
        <div style={s.loadingWrap}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading purchase orders...</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </PageWrapper>
    );
  }

  if (error && rawData.length === 0) {
    return (
      <PageWrapper title="Purchase Orders">
        <div style={s.errorWrap}>
          <AlertCircle size={32} />
          <span>Failed to load purchase orders</span>
          <span style={{ fontSize: 'var(--text-xs)', maxWidth: 400, textAlign: 'center', opacity: 0.7 }}>{error.message}</span>
          <button style={s.retryBtn} onClick={refresh}><RefreshCw size={14} /> Retry</button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Purchase Orders">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        {/* Header */}
        <motion.div style={s.header} variants={fadeInUp} custom={0}>
          <motion.button style={s.newBtn}
            whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(0,212,255,0.4)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowForm(true)}
          >
            <PlusCircle size={18} /> New Order
          </motion.button>
        </motion.div>

        {/* Summary Cards */}
        <motion.div style={s.summaryRow} variants={stagger}>
          {summaryCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.label} style={s.summaryCard} variants={fadeInUp} custom={1 + i}
                whileHover={{ scale: 1.03, boxShadow: `0 0 16px ${card.color}25` }}>
                <div style={s.summaryIconWrap(card.color)}><Icon size={22} color={card.color} /></div>
                <div>
                  <div style={s.summaryValue(card.color)}>{card.value}</div>
                  <div style={s.summaryLabel}>{card.label}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Table */}
        <motion.div style={s.tableWrap} variants={fadeInUp} custom={4}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Order Title</th>
                <th style={s.th}>Item</th>
                <th style={s.th}>Vendor</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Cost</th>
                <th style={s.th}>Date Ordered</th>
                <th style={s.th}>Expected Delivery</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', color: 'var(--text-dim)', padding: 'var(--space-8)' }}>No purchase orders found.</td></tr>
              )}
              {orders.map((order) => (
                <motion.tr key={order.id} style={{ cursor: 'pointer' }} whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }} transition={{ duration: 0.15 }}>
                  <td style={{ ...s.td, fontWeight: 600, color: 'var(--text-primary)' }}>{order.title}</td>
                  <td style={s.td}>{order.item}</td>
                  <td style={s.td}>{order.vendor}</td>
                  <td style={s.td}><span style={s.statusBadge(statusColor[order.status] || '#8b949e')}>{order.status}</span></td>
                  <td style={{ ...s.td, ...s.cost }}>${(order.cost || 0).toFixed(2)}</td>
                  <td style={{ ...s.td, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{order.dateOrdered}</td>
                  <td style={{ ...s.td, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{order.expectedDelivery}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </motion.div>

      {/* ── New Order Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div style={f.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div style={f.modal} initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
              <div style={f.title}>
                New Purchase Order
                <button style={f.closeBtn} onClick={() => setShowForm(false)}><X size={20} /></button>
              </div>

              <div style={f.group}>
                <label style={f.label}>Order Title *</label>
                <input style={f.input} placeholder="e.g. Paper order - Amazon" value={poTitle} onChange={(e) => setPoTitle(e.target.value)} />
              </div>

              <div style={f.row2}>
                <div>
                  <label style={f.label}>Item Ordered *</label>
                  <input style={f.input} placeholder="e.g. Paper 8x11 (10 reams)" value={poItem} onChange={(e) => setPoItem(e.target.value)} />
                </div>
                <div>
                  <label style={f.label}>Quantity *</label>
                  <input style={f.input} type="number" min="1" placeholder="0" value={poQty} onChange={(e) => setPoQty(e.target.value)} />
                </div>
              </div>

              <div style={f.group}>
                <label style={f.label}>Vendor *</label>
                <div style={f.chips}>
                  {vendorChoices.map(v => (
                    <button key={v} style={f.chip(poVendor === v, vendorColor[v])} onClick={() => setPoVendor(v)}>{v}</button>
                  ))}
                </div>
              </div>

              {poVendor === 'Other' && (
                <div style={f.group}>
                  <label style={f.label}>Specify Vendor</label>
                  <input style={f.input} placeholder="Vendor name" value={poOtherVendor} onChange={(e) => setPoOtherVendor(e.target.value)} />
                </div>
              )}

              <div style={f.group}>
                <label style={f.label}>Department *</label>
                <div style={f.chips}>
                  {deptChoices.map(d => (
                    <button key={d} style={f.chip(poDept === d)} onClick={() => setPoDept(d)}>{d}</button>
                  ))}
                </div>
              </div>

              <div style={f.row2}>
                <div>
                  <label style={f.label}>Total Cost ($) *</label>
                  <input style={f.input} type="number" min="0" step="0.01" placeholder="0.00" value={poCost} onChange={(e) => setPoCost(e.target.value)} />
                </div>
                <div>
                  <label style={f.label}>Expected Delivery</label>
                  <input style={f.input} type="date" value={poDelivery} onChange={(e) => setPoDelivery(e.target.value)} />
                </div>
              </div>

              <div style={f.group}>
                <label style={f.label}>Notes (optional)</label>
                <textarea style={f.textarea} placeholder="Additional details..." value={poNotes} onChange={(e) => setPoNotes(e.target.value)} />
              </div>

              {submitError && <div style={f.error}>{submitError}</div>}

              <button style={f.submitBtn(submitting, submitSuccess)} onClick={handleSubmit}
                disabled={submitting || !poTitle || !poItem || !poQty || !poVendor || !poDept || !poCost}>
                {submitting ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
                  : submitSuccess ? <><Check size={18} /> Created!</>
                  : 'Create Purchase Order'}
              </button>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
