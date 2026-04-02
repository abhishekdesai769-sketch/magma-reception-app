import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Check,
  Loader2,
  User,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import PageWrapper from '../components/Layout/PageWrapper';
import { useSharePointList } from '../hooks/useSharePointList';
import { createClientLogEntry } from '../services/graphApi';

const reasonOptions = [
  'Settlement Services',
  'Language Assessment',
  'Information Request',
  'Document Assistance',
  'Appointment',
  'Walk-in',
  'Phone Call',
  'Referral',
  'Other',
];

const statusOptions = [
  { label: 'PR', color: '#00d4ff' },
  { label: 'WP', color: '#00e676' },
  { label: 'SP', color: '#a855f7' },
  { label: 'VV', color: '#ffab00' },
  { label: 'AS', color: '#ff006e' },
  { label: 'Refugee', color: '#26a69a' },
];

const interactionTypes = ['In-Person Visit', 'Phone Call', 'Email'];
const interactionLabels = { 'In-Person Visit': 'In-Person', 'Phone Call': 'Phone', 'Email': 'Email' };

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const s = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-6)',
    flexWrap: 'wrap',
  },
  badge: {
    padding: '4px 14px',
    borderRadius: 'var(--radius-full)',
    background: 'rgba(0,212,255,0.15)',
    color: '#00d4ff',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
  },
  formCard: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-8)',
    marginBottom: 'var(--space-8)',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-6)',
  },
  label: {
    display: 'block',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    marginBottom: 'var(--space-2)',
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-md)',
    minHeight: 48,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  sectionLabel: {
    fontSize: 'var(--text-md)',
    fontWeight: 600,
    marginBottom: 'var(--space-3)',
    color: 'var(--text-primary)',
  },
  optionGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-6)',
  },
  optionBtn: (selected) => ({
    padding: 'var(--space-3) var(--space-5)',
    borderRadius: 'var(--radius-md)',
    background: selected ? 'rgba(0,212,255,0.18)' : 'rgba(255,255,255,0.04)',
    border: selected ? '1px solid rgba(0,212,255,0.5)' : '1px solid var(--glass-border)',
    color: selected ? '#00d4ff' : 'var(--text-muted)',
    fontWeight: 500,
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
    minHeight: 48,
    minWidth: 48,
    transition: 'all 0.2s',
  }),
  statusBtn: (selected, color) => ({
    padding: 'var(--space-3) var(--space-5)',
    borderRadius: 'var(--radius-md)',
    background: selected ? color + '22' : 'rgba(255,255,255,0.04)',
    border: selected ? `1px solid ${color}60` : '1px solid var(--glass-border)',
    color: selected ? color : 'var(--text-muted)',
    fontWeight: 600,
    fontSize: 'var(--text-md)',
    cursor: 'pointer',
    minHeight: 48,
    minWidth: 56,
    transition: 'all 0.2s',
  }),
  langToggle: {
    display: 'flex',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-6)',
  },
  langBtn: (active) => ({
    flex: 1,
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    background: active ? 'rgba(0,212,255,0.18)' : 'rgba(255,255,255,0.04)',
    border: active ? '1px solid rgba(0,212,255,0.5)' : '1px solid var(--glass-border)',
    color: active ? '#00d4ff' : 'var(--text-muted)',
    fontWeight: 600,
    fontSize: 'var(--text-md)',
    cursor: 'pointer',
    minHeight: 48,
  }),
  stepper: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-6)',
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-primary)',
  },
  stepperNum: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#00d4ff',
    minWidth: 48,
    textAlign: 'center',
  },
  interactionRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-6)',
  },
  interactionBtn: (selected) => ({
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    background: selected ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.04)',
    border: selected ? '1px solid rgba(0,230,118,0.4)' : '1px solid var(--glass-border)',
    color: selected ? '#00e676' : 'var(--text-muted)',
    fontWeight: 600,
    fontSize: 'var(--text-md)',
    cursor: 'pointer',
    minHeight: 52,
  }),
  collapseHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) 0',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    marginBottom: 'var(--space-2)',
  },
  submitBtn: (loading, success) => ({
    width: '100%',
    padding: 'var(--space-4)',
    borderRadius: 'var(--radius-md)',
    background: loading
      ? 'rgba(0,212,255,0.1)'
      : success
      ? 'rgba(0,230,118,0.2)'
      : 'linear-gradient(135deg, #00d4ff 0%, #0090b3 100%)',
    border: 'none',
    color: loading ? '#00d4ff' : success ? '#00e676' : '#0a0a0f',
    fontWeight: 700,
    fontSize: 'var(--text-lg)',
    cursor: loading ? 'not-allowed' : 'pointer',
    minHeight: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    marginTop: 'var(--space-4)',
  }),
  entriesCard: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
  },
  entryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--border-default)',
  },
  entryName: {
    fontWeight: 600,
    flex: 1,
  },
  entryReason: {
    color: 'var(--text-muted)',
    fontSize: 'var(--text-sm)',
  },
  entryBadge: (color) => ({
    padding: '2px 10px',
    borderRadius: 'var(--radius-full)',
    background: color + '20',
    color,
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
  }),
  entryTime: {
    color: 'var(--text-dim)',
    fontSize: 'var(--text-xs)',
    whiteSpace: 'nowrap',
  },
};

function getStatusColor(status) {
  const opt = statusOptions.find((o) => o.label === status);
  return opt ? opt.color : '#8b949e';
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'h:mm a');
  } catch {
    return '';
  }
}

export default function ClientLog() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [reason, setReason] = useState('');
  const [statusCanada, setStatusCanada] = useState('');
  const [language, setLanguage] = useState('English');
  const [familyMembers, setFamilyMembers] = useState(1);
  const [interaction, setInteraction] = useState('In-Person Visit');
  const [showMore, setShowMore] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const { data: rawData, loading, error, refresh } = useSharePointList('clientLog');

  // Map SharePoint fields to UI shape
  const entries = rawData.map((item) => ({
    id: item.id,
    name: item.fields?.Title || `${item.fields?.FirstName || ''} ${item.fields?.LastName || ''}`.trim() || 'Unknown',
    reason: item.fields?.ReasonForVisit || '—',
    status: item.fields?.StatusInCanada || '—',
    time: formatTime(item.fields?.DateOfInteraction),
  }));

  const handleSubmit = async () => {
    if (!firstName || !lastName) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createClientLogEntry({
        Title: `${firstName} ${lastName}`,
        FirstName: firstName,
        LastName: lastName,
        ReasonForVisit: reason || undefined,
        StatusInCanada: statusCanada || undefined,
        PreferredLanguage: language,
        NumberOfFamilyMembers: familyMembers,
        InteractionType: interaction,
        PhoneNumber: phone || undefined,
        EmailAddress: email || undefined,
        Notes: notes || undefined,
      });
      setSuccess(true);
      setFirstName('');
      setLastName('');
      setReason('');
      setStatusCanada('');
      setLanguage('English');
      setFamilyMembers(1);
      setInteraction('In-Person Visit');
      setPhone('');
      setEmail('');
      setNotes('');
      refresh();
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to submit client log:', err);
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper title="Client Log">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        {/* Header with count badge */}
        <motion.div style={s.header} variants={fadeInUp} custom={0}>
          <span style={s.badge}>
            {loading ? '...' : entries.length} clients logged
          </span>
        </motion.div>

        {/* Form */}
        <motion.div style={s.formCard} variants={fadeInUp} custom={1}>
          {/* Name row */}
          <div style={s.row}>
            <div>
              <label style={s.label}>First Name</label>
              <input
                style={s.input}
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label style={s.label}>Last Name</label>
              <input
                style={s.input}
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Reason for Visit */}
          <p style={s.sectionLabel}>Reason for Visit</p>
          <div style={s.optionGrid}>
            {reasonOptions.map((opt) => (
              <motion.button
                key={opt}
                style={s.optionBtn(reason === opt)}
                onClick={() => setReason(opt)}
                whileTap={{ scale: 0.95 }}
                animate={
                  reason === opt
                    ? { boxShadow: '0 0 12px rgba(0,212,255,0.3)' }
                    : { boxShadow: 'none' }
                }
              >
                {opt}
              </motion.button>
            ))}
          </div>

          {/* Status in Canada */}
          <p style={s.sectionLabel}>Status in Canada</p>
          <div style={s.optionGrid}>
            {statusOptions.map((opt) => (
              <motion.button
                key={opt.label}
                style={s.statusBtn(statusCanada === opt.label, opt.color)}
                onClick={() => setStatusCanada(opt.label)}
                whileTap={{ scale: 0.95 }}
                animate={
                  statusCanada === opt.label
                    ? { boxShadow: `0 0 12px ${opt.color}40` }
                    : { boxShadow: 'none' }
                }
              >
                {opt.label}
              </motion.button>
            ))}
          </div>

          {/* Preferred Language */}
          <p style={s.sectionLabel}>Preferred Language</p>
          <div style={s.langToggle}>
            {['English', 'French'].map((lang) => (
              <motion.button
                key={lang}
                style={s.langBtn(language === lang)}
                onClick={() => setLanguage(lang)}
                whileTap={{ scale: 0.97 }}
              >
                {lang}
              </motion.button>
            ))}
          </div>

          {/* Family Members */}
          <p style={s.sectionLabel}>Number of Family Members</p>
          <div style={s.stepper}>
            <motion.button
              style={s.stepperBtn}
              whileTap={{ scale: 0.9 }}
              onClick={() => setFamilyMembers(Math.max(1, familyMembers - 1))}
            >
              <Minus size={20} />
            </motion.button>
            <span style={s.stepperNum}>{familyMembers}</span>
            <motion.button
              style={s.stepperBtn}
              whileTap={{ scale: 0.9 }}
              onClick={() => setFamilyMembers(familyMembers + 1)}
            >
              <Plus size={20} />
            </motion.button>
          </div>

          {/* Interaction Type */}
          <p style={s.sectionLabel}>Interaction Type</p>
          <div style={s.interactionRow}>
            {interactionTypes.map((type) => (
              <motion.button
                key={type}
                style={s.interactionBtn(interaction === type)}
                onClick={() => setInteraction(type)}
                whileTap={{ scale: 0.95 }}
                animate={
                  interaction === type
                    ? { boxShadow: '0 0 12px rgba(0,230,118,0.3)' }
                    : { boxShadow: 'none' }
                }
              >
                {interactionLabels[type] || type}
              </motion.button>
            ))}
          </div>

          {/* Collapsible More Details */}
          <div style={s.collapseHeader} onClick={() => setShowMore(!showMore)}>
            {showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            More Details
          </div>
          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ ...s.row, marginBottom: 'var(--space-4)' }}>
                  <div>
                    <label style={s.label}>Phone</label>
                    <input
                      style={s.input}
                      placeholder="Phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={s.label}>Email</label>
                    <input
                      style={s.input}
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label style={s.label}>Notes</label>
                  <textarea
                    style={{ ...s.input, minHeight: 80, resize: 'vertical' }}
                    placeholder="Additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Error */}
          {submitError && (
            <div style={{ color: '#ff3d5a', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)', textAlign: 'center' }}>
              {submitError}
            </div>
          )}

          {/* Submit */}
          <motion.button
            style={s.submitBtn(submitting, success)}
            onClick={handleSubmit}
            disabled={submitting || !firstName || !lastName}
            whileHover={
              !submitting && !success
                ? { scale: 1.02, boxShadow: '0 0 30px rgba(0,212,255,0.4)' }
                : {}
            }
            whileTap={!submitting ? { scale: 0.98 } : {}}
          >
            {submitting ? (
              <>
                <Loader2
                  size={20}
                  style={{ animation: 'clientlog-spin 1s linear infinite' }}
                />
                Submitting...
              </>
            ) : success ? (
              <>
                <Check size={20} />
                Submitted!
              </>
            ) : (
              'Log Client Visit'
            )}
          </motion.button>
        </motion.div>

        {/* Recent Entries */}
        <motion.div variants={fadeInUp} custom={2}>
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              marginBottom: 'var(--space-4)',
            }}
          >
            Recent Entries
          </h2>
        </motion.div>

        {loading && rawData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
            <Loader2 size={24} style={{ animation: 'clientlog-spin 1s linear infinite' }} />
          </div>
        ) : error && rawData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: '#ff3d5a' }}>
            <AlertCircle size={24} />
            <p style={{ marginTop: 8 }}>Failed to load entries</p>
            <button style={{ ...s.input, maxWidth: 120, cursor: 'pointer', marginTop: 8, textAlign: 'center' }} onClick={refresh}>
              Retry
            </button>
          </div>
        ) : (
          <motion.div style={s.entriesCard} variants={stagger}>
            {entries.length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-dim)' }}>
                No entries yet. Log your first client visit above.
              </div>
            )}
            {entries.slice(0, 20).map((entry, i) => (
              <motion.div
                key={entry.id}
                style={s.entryItem}
                variants={fadeInUp}
                custom={3 + i}
              >
                <User size={16} color="var(--text-dim)" />
                <div style={{ flex: 1 }}>
                  <div style={s.entryName}>{entry.name}</div>
                  <div style={s.entryReason}>{entry.reason}</div>
                </div>
                <span style={s.entryBadge(getStatusColor(entry.status))}>
                  {entry.status}
                </span>
                <span style={s.entryTime}>{entry.time}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Spin keyframes */}
        <style>{`
          @keyframes clientlog-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </motion.div>
    </PageWrapper>
  );
}
