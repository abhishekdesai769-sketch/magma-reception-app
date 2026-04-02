import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  AlertTriangle,
  Package,
  UserPlus,
  PlusCircle,
  ScanBarcode,
  Clock,
  Loader2,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, isToday, parseISO } from 'date-fns';
import PageWrapper from '../components/Layout/PageWrapper';
import { useSharePointList } from '../hooks/useSharePointList';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const quickActions = [
  { label: 'Log Client', icon: UserPlus, color: '#00d4ff', path: '/client-log' },
  { label: 'New Request', icon: PlusCircle, color: '#ff006e', path: '/supply-requests' },
  { label: 'Scan Inventory', icon: ScanBarcode, color: '#00e676', path: '/inventory' },
];

const styles = {
  hero: {
    textAlign: 'center',
    marginBottom: 'var(--space-10)',
    paddingTop: 'var(--space-4)',
  },
  heroTitle: {
    fontSize: '2.4rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #00d4ff 0%, #ff006e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: 'var(--space-2)',
  },
  heroSub: {
    color: 'var(--text-muted)',
    fontSize: 'var(--text-lg)',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 'var(--space-6)',
    marginBottom: 'var(--space-8)',
  },
  kpiCard: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-5)',
    cursor: 'pointer',
    minHeight: 100,
  },
  kpiIconWrap: (color) => ({
    width: 52,
    height: 52,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: color + '15',
    flexShrink: 0,
  }),
  kpiNumber: (color) => ({
    fontSize: '2rem',
    fontWeight: 700,
    color,
    lineHeight: 1,
  }),
  kpiLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 'var(--space-6)',
    marginBottom: 'var(--space-8)',
  },
  chartCard: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
  },
  chartTitle: {
    fontSize: 'var(--text-md)',
    fontWeight: 600,
    marginBottom: 'var(--space-4)',
    color: 'var(--text-primary)',
  },
  actionsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-8)',
  },
  actionBtn: (color) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-4) var(--space-6)',
    borderRadius: 'var(--radius-md)',
    background: color + '18',
    border: `1px solid ${color}40`,
    color,
    fontWeight: 600,
    fontSize: 'var(--text-md)',
    cursor: 'pointer',
    minHeight: 56,
  }),
  sectionTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 600,
    marginBottom: 'var(--space-4)',
  },
  feedList: {
    maxHeight: 280,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  feedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
  },
  feedTime: {
    marginLeft: 'auto',
    color: 'var(--text-dim)',
    fontSize: 'var(--text-xs)',
    whiteSpace: 'nowrap',
  },
  loadingInline: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--text-dim)',
    fontSize: 'var(--text-xs)',
  },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#161b22',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 13,
    }}>
      <p style={{ color: '#e6edf3', fontWeight: 600 }}>{label || payload[0].name}</p>
      <p style={{ color: payload[0].color || '#00d4ff' }}>
        {payload[0].value}
      </p>
    </div>
  );
};

const statusColorMap = {
  New: '#ff3d5a',
  Received: '#ffab00',
  'Pending Order': '#a855f7',
  'Ready to Pick Up': '#26c6da',
  Completed: '#00e676',
  Cancelled: '#8b949e',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: clientData, loading: clientLoading } = useSharePointList('clientLog');
  const { data: supplyData, loading: supplyLoading } = useSharePointList('supplyRequests');
  const { data: inventoryData, loading: inventoryLoading } = useSharePointList('inventory');
  const { data: orderData, loading: orderLoading } = useSharePointList('purchaseOrders');

  const anyLoading = clientLoading || supplyLoading || inventoryLoading || orderLoading;

  // --- Compute KPIs from real data ---
  const kpis = useMemo(() => {
    const clientsToday = clientData.filter((item) => {
      const dateStr = item.fields?.DateOfInteraction;
      if (!dateStr) return false;
      try { return isToday(parseISO(dateStr)); } catch { return false; }
    }).length;

    const activeRequests = supplyData.filter((item) => {
      const status = item.fields?.Status;
      return status && status !== 'Completed' && status !== 'Cancelled';
    }).length;

    const lowStock = inventoryData.filter((item) => {
      const qty = item.fields?.CurrentQuantity ?? 0;
      const threshold = item.fields?.MinimumThreshold ?? 0;
      return threshold > 0 && qty <= threshold;
    }).length;

    const pendingOrders = orderData.filter((item) => {
      const status = item.fields?.OrderStatus;
      return status && status !== 'Received' && status !== 'Cancelled' && status !== 'Delegated';
    }).length;

    return { clientsToday, activeRequests, lowStock, pendingOrders };
  }, [clientData, supplyData, inventoryData, orderData]);

  // --- Supply status chart data ---
  const supplyStatusData = useMemo(() => {
    const counts = {};
    supplyData.forEach((item) => {
      const status = item.fields?.Status || 'New';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([name]) => name !== 'Cancelled')
      .map(([name, value]) => ({
        name,
        value,
        color: statusColorMap[name] || '#8b949e',
      }));
  }, [supplyData]);

  // --- Client visits by month chart data ---
  const clientVisitsData = useMemo(() => {
    const months = {};
    clientData.forEach((item) => {
      const dateStr = item.fields?.DateOfInteraction;
      if (!dateStr) return;
      try {
        const month = format(parseISO(dateStr), 'MMM yyyy');
        months[month] = (months[month] || 0) + 1;
      } catch { /* skip */ }
    });
    return Object.entries(months)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-6)
      .map(([month, visits]) => ({ month, visits }));
  }, [clientData]);

  // --- Recent activity feed from all lists ---
  const recentActivities = useMemo(() => {
    const activities = [];

    clientData.slice(0, 10).forEach((item) => {
      const name = item.fields?.Title || `${item.fields?.FirstName || ''} ${item.fields?.LastName || ''}`.trim();
      const reason = item.fields?.ReasonForVisit || '';
      const dateStr = item.fields?.DateOfInteraction;
      activities.push({
        id: `client-${item.id}`,
        text: `${name} checked in${reason ? ' — ' + reason : ''}`,
        date: dateStr ? new Date(dateStr) : new Date(0),
        time: dateStr ? formatTimeAgo(new Date(dateStr)) : '',
      });
    });

    supplyData.slice(0, 10).forEach((item) => {
      const title = item.fields?.Title || 'Supply request';
      const status = item.fields?.Status || 'New';
      const dateStr = item.fields?.DateOfRequest;
      activities.push({
        id: `supply-${item.id}`,
        text: `Supply request: ${title} — ${status}`,
        date: dateStr ? new Date(dateStr) : new Date(0),
        time: dateStr ? formatTimeAgo(new Date(dateStr)) : '',
      });
    });

    orderData.slice(0, 5).forEach((item) => {
      const title = item.fields?.Title || 'Purchase order';
      const status = item.fields?.OrderStatus || 'Ordered';
      const dateStr = item.fields?.DateOrdered;
      activities.push({
        id: `order-${item.id}`,
        text: `Purchase order: ${title} — ${status}`,
        date: dateStr ? new Date(dateStr) : new Date(0),
        time: dateStr ? formatTimeAgo(new Date(dateStr)) : '',
      });
    });

    return activities.sort((a, b) => b.date - a.date).slice(0, 8);
  }, [clientData, supplyData, orderData]);

  const kpiCards = [
    { label: 'Clients Today', value: kpis.clientsToday, icon: Users, color: '#00d4ff', glow: '0 0 20px rgba(0,212,255,0.3)' },
    { label: 'Active Requests', value: kpis.activeRequests, icon: ClipboardList, color: '#ff006e', glow: '0 0 20px rgba(255,0,110,0.3)' },
    { label: 'Low Stock', value: kpis.lowStock, icon: AlertTriangle, color: '#ffab00', glow: '0 0 20px rgba(255,171,0,0.3)' },
    { label: 'Pending Orders', value: kpis.pendingOrders, icon: Package, color: '#00e676', glow: '0 0 20px rgba(0,230,118,0.3)' },
  ];

  return (
    <PageWrapper title="Dashboard">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Hero */}
        <motion.div style={styles.hero} variants={fadeInUp} custom={0}>
          <h1 style={styles.heroTitle}>Reception Operations Center</h1>
          <p style={styles.heroSub}>
            Real-time overview of MAGMA reception activity
            {anyLoading && (
              <span style={styles.loadingInline}>
                {' '}
                <Loader2 size={14} style={{ animation: 'dash-spin 1s linear infinite' }} />
                updating...
              </span>
            )}
          </p>
        </motion.div>

        {/* KPI Cards */}
        <motion.div style={styles.kpiGrid} variants={staggerContainer}>
          {kpiCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                style={styles.kpiCard}
                variants={fadeInUp}
                custom={i}
                whileHover={{ scale: 1.03, boxShadow: card.glow }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <div style={styles.kpiIconWrap(card.color)}>
                  <Icon size={26} color={card.color} />
                </div>
                <div>
                  <div style={styles.kpiNumber(card.color)}>{card.value}</div>
                  <div style={styles.kpiLabel}>{card.label}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts */}
        <motion.div style={styles.chartsRow} variants={staggerContainer}>
          {/* Donut Chart */}
          <motion.div style={styles.chartCard} variants={fadeInUp} custom={4}>
            <h3 style={styles.chartTitle}>Supply Request Status</h3>
            {supplyStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={supplyStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {supplyStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(val) => (
                      <span style={{ color: '#8b949e', fontSize: 12 }}>{val}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                No supply requests yet
              </div>
            )}
          </motion.div>

          {/* Bar Chart */}
          <motion.div style={styles.chartCard} variants={fadeInUp} custom={5}>
            <h3 style={styles.chartTitle}>Client Visits by Month</h3>
            {clientVisitsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={clientVisitsData} barSize={36}>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#8b949e', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#8b949e', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="visits" fill="#00d4ff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                No client visits yet
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeInUp} custom={6}>
          <h3 style={styles.sectionTitle}>Quick Actions</h3>
        </motion.div>
        <motion.div style={styles.actionsRow} variants={staggerContainer}>
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                style={styles.actionBtn(action.color)}
                variants={fadeInUp}
                custom={7 + i}
                whileHover={{
                  scale: 1.04,
                  boxShadow: `0 0 24px ${action.color}40`,
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(action.path)}
              >
                <Icon size={22} />
                {action.label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Live Feed */}
        <motion.div variants={fadeInUp} custom={10}>
          <h3 style={styles.sectionTitle}>Recent Activity</h3>
        </motion.div>
        <motion.div style={styles.feedList} variants={staggerContainer}>
          {recentActivities.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-dim)', fontSize: 'var(--text-sm)' }}>
              No recent activity
            </div>
          )}
          {recentActivities.map((item, i) => (
            <motion.div
              key={item.id}
              style={styles.feedItem}
              variants={fadeInUp}
              custom={11 + i}
            >
              <Clock size={14} color="var(--text-dim)" />
              <span>{item.text}</span>
              <span style={styles.feedTime}>{item.time}</span>
            </motion.div>
          ))}
        </motion.div>

        <style>{`
          @keyframes dash-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </motion.div>
    </PageWrapper>
  );
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  try { return format(date, 'MMM d'); } catch { return ''; }
}
