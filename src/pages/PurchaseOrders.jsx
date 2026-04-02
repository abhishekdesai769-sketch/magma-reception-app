import { motion } from 'framer-motion';
import {
  PlusCircle,
  DollarSign,
  Clock,
  ShoppingCart,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import PageWrapper from '../components/Layout/PageWrapper';
import { useSharePointList } from '../hooks/useSharePointList';

const statusColor = {
  Ordered: '#00d4ff',
  Shipped: '#ffab00',
  Received: '#00e676',
  Delegated: '#a855f7',
  Cancelled: '#ff3d5a',
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const s = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 'var(--space-6)',
    flexWrap: 'wrap',
    gap: 'var(--space-4)',
  },
  newBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-5)',
    borderRadius: 'var(--radius-md)',
    background: 'linear-gradient(135deg, #00d4ff 0%, #0090b3 100%)',
    color: '#0a0a0f',
    fontWeight: 700,
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
    minHeight: 48,
    border: 'none',
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'var(--space-5)',
    marginBottom: 'var(--space-8)',
  },
  summaryCard: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  summaryIconWrap: (color) => ({
    width: 44,
    height: 44,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: color + '15',
    flexShrink: 0,
  }),
  summaryValue: (color) => ({
    fontSize: '1.5rem',
    fontWeight: 700,
    color,
    lineHeight: 1,
  }),
  summaryLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  tableWrap: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 'var(--text-sm)',
  },
  th: {
    textAlign: 'left',
    padding: 'var(--space-4) var(--space-5)',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: 'var(--text-xs)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border-default)',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: 'var(--space-4) var(--space-5)',
    borderBottom: '1px solid var(--border-subtle)',
    verticalAlign: 'middle',
  },
  statusBadge: (color) => ({
    display: 'inline-block',
    padding: '3px 12px',
    borderRadius: 'var(--radius-full)',
    background: color + '18',
    color,
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
  }),
  cost: {
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontVariantNumeric: 'tabular-nums',
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-12)',
    gap: 'var(--space-4)',
    color: 'var(--text-muted)',
  },
  errorWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-12)',
    gap: 'var(--space-4)',
    color: '#ff3d5a',
  },
  retryBtn: {
    padding: 'var(--space-3) var(--space-5)',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255,61,90,0.15)',
    border: '1px solid rgba(255,61,90,0.3)',
    color: '#ff3d5a',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export default function PurchaseOrders() {
  const { data: rawData, loading, error, refresh } = useSharePointList('purchaseOrders');

  // Map SharePoint fields to UI shape
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

  const totalSpend = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.cost || 0), 0);

  const pendingCount = orders.filter(
    (o) => o.status === 'Ordered' || o.status === 'Shipped'
  ).length;

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
          <span style={{ fontSize: 'var(--text-xs)', maxWidth: 400, textAlign: 'center', opacity: 0.7 }}>
            {error.message}
          </span>
          <button style={s.retryBtn} onClick={refresh}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Purchase Orders">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        {/* Header */}
        <motion.div style={s.header} variants={fadeInUp} custom={0}>
          <motion.button
            style={s.newBtn}
            whileHover={{
              scale: 1.04,
              boxShadow: '0 0 20px rgba(0,212,255,0.4)',
            }}
            whileTap={{ scale: 0.96 }}
          >
            <PlusCircle size={18} />
            New Order
          </motion.button>
        </motion.div>

        {/* Summary Cards */}
        <motion.div style={s.summaryRow} variants={stagger}>
          {summaryCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                style={s.summaryCard}
                variants={fadeInUp}
                custom={1 + i}
                whileHover={{
                  scale: 1.03,
                  boxShadow: `0 0 16px ${card.color}25`,
                }}
              >
                <div style={s.summaryIconWrap(card.color)}>
                  <Icon size={22} color={card.color} />
                </div>
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
                <tr>
                  <td colSpan={7} style={{ ...s.td, textAlign: 'center', color: 'var(--text-dim)', padding: 'var(--space-8)' }}>
                    No purchase orders found.
                  </td>
                </tr>
              )}
              {orders.map((order) => (
                <motion.tr
                  key={order.id}
                  style={{ cursor: 'pointer' }}
                  whileHover={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                  }}
                  transition={{ duration: 0.15 }}
                >
                  <td
                    style={{
                      ...s.td,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {order.title}
                  </td>
                  <td style={s.td}>{order.item}</td>
                  <td style={s.td}>{order.vendor}</td>
                  <td style={s.td}>
                    <span
                      style={s.statusBadge(
                        statusColor[order.status] || '#8b949e'
                      )}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td style={{ ...s.td, ...s.cost }}>
                    ${(order.cost || 0).toFixed(2)}
                  </td>
                  <td
                    style={{
                      ...s.td,
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {order.dateOrdered}
                  </td>
                  <td
                    style={{
                      ...s.td,
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {order.expectedDelivery}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
