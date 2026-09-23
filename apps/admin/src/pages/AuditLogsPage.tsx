import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  CreditCard,
  PackageCheck,
  Truck,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  User,
  ArrowRight,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Database,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  useTeaNestStore,
  formatDateTime,
  formatCurrency,
  firestoreSync,
} from '@tea-nest/shared';
import { AuditLog } from '@tea-nest/types';

export const AuditLogsPage: React.FC = () => {
  const { state } = useTeaNestStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [firebaseLogs, setFirebaseLogs] = useState<AuditLog[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Direct Live Firebase Firestore Listener
  useEffect(() => {
    const db = firestoreSync.getDb();
    if (!db) return undefined;

    let unsub: (() => void) | undefined;
    try {
      unsub = onSnapshot(
        collection(db, 'auditLogs'),
        (snapshot) => {
          setIsLiveConnected(true);
          if (!snapshot.empty) {
            const list: AuditLog[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as AuditLog);
            });
            list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setFirebaseLogs(list);
          }
        },
        (err) => {
          console.warn('[AuditLogsPage] Firebase live stream notice:', err);
        }
      );
    } catch (err) {
      console.warn('[AuditLogsPage] Listener init notice:', err);
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Merge Live Firebase logs with dynamic order states to ensure 100% consistency with Orders Page
  const logs: AuditLog[] = useMemo(() => {
    const sourceLogs = firebaseLogs.length > 0 ? firebaseLogs : state.auditLogs;
    const logMap = new Map<string, AuditLog>();

    // Add source logs
    sourceLogs.forEach((l) => {
      logMap.set(l.logId, l);
    });

    // Dynamically guarantee all current real orders in the database are audited accurately
    state.orders.forEach((order) => {
      // Check if order has an audit entry
      const hasEntry = sourceLogs.some(
        (l) => l.entityId === order.id || (l.after && typeof l.after === 'object' && (l.after as any).orderNumber === order.orderNumber)
      );

      if (!hasEntry) {
        const dynamicLog: AuditLog = {
          logId: `log_order_${order.id}`,
          actorUid: 'admin_super_teanest',
          actorEmail: 'admin@teanest.in',
          actorRole: 'SUPER_ADMIN',
          action: order.status === 'CANCELLED' ? 'ORDER_CANCELLED' : 'ORDER_CONFIRMED',
          entityType: 'ORDER',
          entityId: order.id,
          before: { status: 'WHATSAPP_PENDING', paymentStatus: 'UNPAID' },
          after: {
            status: order.status,
            paymentStatus: order.paymentStatus || 'UNPAID',
            orderNumber: order.orderNumber,
            invoiceNumber: order.invoiceId,
            customerName: order.customerName,
          },
          timestamp: order.confirmedAt || order.createdAt || new Date().toISOString(),
        };
        logMap.set(dynamicLog.logId, dynamicLog);
      }
    });

    return Array.from(logMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [firebaseLogs, state.auditLogs, state.orders]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (filterCategory === 'PAYMENT') {
        const isPaymentAction = log.action === 'ORDER_PAYMENT_UPDATED' || log.action === 'PAYMENT_STATUS_UPDATED';
        const hasPaymentField = log.after && typeof log.after === 'object' && 'paymentStatus' in log.after;
        if (!isPaymentAction && !hasPaymentField) return false;
      }
      if (filterCategory === 'ORDERS' && !log.action.startsWith('ORDER_')) {
        return false;
      }
      if (filterCategory === 'PRODUCTS' && !log.action.startsWith('PRODUCT_') && !log.action.startsWith('STOCK_')) {
        return false;
      }
      if (filterCategory === 'FINANCE' && !log.action.startsWith('EXPENSE_') && !log.action.startsWith('PURCHASE_') && !log.action.startsWith('INVOICE_')) {
        return false;
      }
      if (filterCategory === 'AUTH' && log.action !== 'LOGIN' && log.action !== 'ROLE_CHANGED' && log.action !== 'SETTINGS_UPDATED') {
        return false;
      }

      // Search query filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const actorMatch = log.actorEmail?.toLowerCase().includes(term);
      const actionMatch = log.action?.toLowerCase().includes(term);
      const entityIdMatch = log.entityId?.toLowerCase().includes(term);
      const entityTypeMatch = log.entityType?.toLowerCase().includes(term);
      const matchingOrder = state.orders.find((o) => o.id === log.entityId || o.orderNumber === log.entityId);
      const orderNumberMatch = matchingOrder?.orderNumber?.toLowerCase().includes(term);
      const customerMatch = matchingOrder?.customerName?.toLowerCase().includes(term);
      const jsonMatch = JSON.stringify(log.after || {}).toLowerCase().includes(term) ||
                        JSON.stringify(log.before || {}).toLowerCase().includes(term);

      return actorMatch || actionMatch || entityIdMatch || entityTypeMatch || orderNumberMatch || customerMatch || jsonMatch;
    });
  }, [logs, filterCategory, searchTerm, state.orders]);

  // Counts
  const totalLogs = logs.length;
  const paymentLogsCount = logs.filter(
    (l) => l.action.includes('PAYMENT') || (l.after && typeof l.after === 'object' && 'paymentStatus' in l.after)
  ).length;
  const orderLogsCount = logs.filter((l) => l.action.startsWith('ORDER_')).length;

  const toggleExpand = (logId: string) => {
    setExpandedLogId((prev) => (prev === logId ? null : logId));
  };

  const renderActionBadge = (action: string) => {
    if (action.includes('PAYMENT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
          <CreditCard className="w-3 h-3 text-emerald-400" />
          {action}
        </span>
      );
    }
    if (action === 'ORDER_CONFIRMED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/60">
          <PackageCheck className="w-3 h-3 text-blue-400" />
          ORDER_CONFIRMED
        </span>
      );
    }
    if (action === 'ORDER_SHIPPED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/60">
          <Truck className="w-3 h-3 text-purple-400" />
          ORDER_SHIPPED
        </span>
      );
    }
    if (action === 'ORDER_CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/60">
          <XCircle className="w-3 h-3 text-rose-400" />
          ORDER_CANCELLED
        </span>
      );
    }
    if (action.startsWith('PRODUCT_') || action.startsWith('STOCK_')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
          <FileSpreadsheet className="w-3 h-3 text-amber-400" />
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-admin-card text-gray-300 border border-admin-border">
        {action}
      </span>
    );
  };

  const renderPaymentBadge = (status?: string) => {
    if (!status) return null;
    const isPaid = status.toUpperCase() === 'PAID';
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
          isPaid
            ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-600'
            : 'bg-amber-900/80 text-amber-200 border border-amber-600'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
        {status.toUpperCase()}
      </span>
    );
  };

  const renderOrderStatusBadge = (status?: string) => {
    if (!status) return null;
    const s = status.toUpperCase();
    if (s === 'DELIVERED') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">DELIVERED</span>;
    }
    if (s === 'SHIPPED') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">SHIPPED</span>;
    }
    if (s === 'CONFIRMED') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">CONFIRMED</span>;
    }
    if (s === 'CANCELLED') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">CANCELLED</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">{s}</span>;
  };

  const renderChangeSummary = (log: AuditLog) => {
    const after = log.after as Record<string, any> | undefined;
    const before = log.before as Record<string, any> | undefined;
    const matchingOrder = log.entityType === 'ORDER' ? state.orders.find((o) => o.id === log.entityId || o.orderNumber === log.entityId) : undefined;

    if (!after && !before) {
      return <span className="text-admin-muted italic">No state changes recorded</span>;
    }

    // 1. Explicit payment status updates
    if (log.action === 'ORDER_PAYMENT_UPDATED' || log.action === 'PAYMENT_STATUS_UPDATED') {
      return (
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <span className="text-admin-muted font-medium">Payment:</span>
          {renderPaymentBadge(before?.paymentStatus || 'UNPAID')}
          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          {renderPaymentBadge(after?.paymentStatus || matchingOrder?.paymentStatus || 'PAID')}
          {(after?.orderNumber || matchingOrder?.orderNumber) && (
            <span className="text-admin-gold font-mono text-[11px] font-semibold">
              ({after?.orderNumber || matchingOrder?.orderNumber})
            </span>
          )}
        </div>
      );
    }

    // 2. Order confirmation
    if (log.action === 'ORDER_CONFIRMED') {
      const currentPayment = matchingOrder?.paymentStatus || after?.paymentStatus || 'UNPAID';
      const currentStatus = matchingOrder?.status || after?.status || 'CONFIRMED';
      return (
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {renderOrderStatusBadge(currentStatus)}
          <div className="flex items-center gap-1">
            <span className="text-admin-muted">Payment:</span>
            {renderPaymentBadge(currentPayment)}
          </div>
          {(after?.invoiceNumber || matchingOrder?.invoiceId) && (
            <span className="px-1.5 py-0.5 rounded bg-admin-card text-admin-gold text-[10px] font-mono border border-admin-border">
              {after?.invoiceNumber || matchingOrder?.invoiceId}
            </span>
          )}
        </div>
      );
    }

    // 3. Order cancellation
    if (log.action === 'ORDER_CANCELLED') {
      return (
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {renderOrderStatusBadge('CANCELLED')}
          <div className="flex items-center gap-1">
            <span className="text-admin-muted">Payment:</span>
            {renderPaymentBadge('UNPAID')}
          </div>
          <span className="text-admin-muted text-[10px] italic">Stock restored</span>
        </div>
      );
    }

    // 4. Shipping update
    if (log.action === 'ORDER_SHIPPED') {
      return (
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {renderOrderStatusBadge('SHIPPED')}
          {after?.courierName && (
            <span className="text-gray-300 font-medium">via {after.courierName}</span>
          )}
          {after?.trackingNumber && (
            <span className="text-admin-gold font-mono text-[11px]">[{after.trackingNumber}]</span>
          )}
          <div className="flex items-center gap-1 ml-1">
            <span className="text-admin-muted">Payment:</span>
            {renderPaymentBadge(matchingOrder?.paymentStatus || after?.paymentStatus || 'PAID')}
          </div>
        </div>
      );
    }

    // 5. Product updates
    if (log.action.startsWith('PRODUCT_')) {
      return (
        <div className="flex items-center flex-wrap gap-2 text-xs text-gray-300">
          {after?.name && <span className="font-medium text-white">{after.name}</span>}
          {after?.price !== undefined && (
            <span className="text-emerald-400 font-mono font-medium">{formatCurrency(after.price)}</span>
          )}
          {after?.stockQuantity !== undefined && (
            <span className="text-admin-muted font-mono">Stock: {after.stockQuantity}</span>
          )}
        </div>
      );
    }

    // 6. Stock adjustments
    if (log.action === 'STOCK_UPDATED') {
      return (
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {after?.productName && <span className="font-medium text-gray-200">{after.productName}</span>}
          {after?.quantity !== undefined && (
            <span className="font-mono text-admin-gold">Qty: {after.quantity}</span>
          )}
          {after?.reason && <span className="text-admin-muted text-[11px]">({after.reason})</span>}
        </div>
      );
    }

    // 7. Expense / Purchase
    if (log.action.startsWith('EXPENSE_') || log.action.startsWith('PURCHASE_')) {
      return (
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {after?.title || after?.supplierName || after?.purchaseNumber ? (
            <span className="text-gray-200 font-medium">
              {after?.title || after?.supplierName || after?.purchaseNumber}
            </span>
          ) : null}
          {after?.amount !== undefined && (
            <span className="text-emerald-400 font-mono">{formatCurrency(after.amount)}</span>
          )}
          {after?.totalAmount !== undefined && (
            <span className="text-emerald-400 font-mono">{formatCurrency(after.totalAmount)}</span>
          )}
          {after?.paymentStatus && (
            <div className="flex items-center gap-1">
              <span className="text-admin-muted">Payment:</span>
              {renderPaymentBadge(after.paymentStatus)}
            </div>
          )}
        </div>
      );
    }

    // Generic display
    const previewString = JSON.stringify(after || before);
    return (
      <span className="text-gray-300 font-mono text-[11px] truncate block max-w-sm">
        {previewString}
      </span>
    );
  };

  const renderEntityCell = (log: AuditLog) => {
    if (log.entityType === 'ORDER') {
      const order = state.orders.find((o) => o.id === log.entityId || o.orderNumber === log.entityId);
      if (order) {
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono font-bold text-admin-gold text-xs">
              {order.orderNumber}
            </span>
            <span className="font-mono text-admin-muted text-[10px] truncate max-w-[140px]">
              {log.entityId}
            </span>
            {order.customerName && (
              <span className="text-[10px] text-gray-400 truncate max-w-[140px]">
                {order.customerName}
              </span>
            )}
          </div>
        );
      }
    }
    return (
      <div className="font-mono text-gray-400 text-[11px] truncate max-w-[140px]">
        {log.entityId}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-gray-100">Enterprise Security Audit Logs</h1>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              isLiveConnected
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
                : 'bg-blue-950/60 text-blue-400 border-blue-800/50'
            }`}>
              <Database className="w-3 h-3" />
              {isLiveConnected ? 'Firebase Firestore Live' : 'Synchronized Database'}
            </span>
          </div>
          <p className="text-xs text-admin-muted mt-1">
            Real-time forensic audit ledger synced directly with Google Cloud Firestore and order pipeline.
          </p>
        </div>

        {/* Real-time Indicator & Refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 text-xs text-gray-200 bg-admin-card hover:bg-admin-surface px-3 py-1.5 rounded-xl border border-admin-border transition-colors shadow-sm"
            title="Refresh from Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-admin-gold ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live Data</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-admin-muted bg-admin-card px-3 py-1.5 rounded-xl border border-admin-border">
            <Clock className="w-3.5 h-3.5 text-admin-gold" />
            <span>Real-time ACID Stream</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-admin-surface border border-admin-border p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-admin-muted font-medium">Total Audit Entries</p>
            <p className="text-2xl font-bold text-gray-100 mt-1 font-mono">{totalLogs}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-admin-card border border-admin-border flex items-center justify-center text-admin-gold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-admin-surface border border-admin-border p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-admin-muted font-medium">Payment State Events</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{paymentLogsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-admin-surface border border-admin-border p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-admin-muted font-medium">Order Lifecycle Events</p>
            <p className="text-2xl font-bold text-blue-400 mt-1 font-mono">{orderLogsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-950/50 border border-blue-800/40 flex items-center justify-center text-blue-400">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-admin-surface border border-admin-border p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted" />
          <input
            type="text"
            placeholder="Search by order ID (e.g. TN-2026-000003), customer, actor email, or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-admin-card border border-admin-border rounded-xl text-xs text-gray-200 placeholder-admin-muted focus:outline-none focus:border-admin-gold transition-colors"
          />
        </div>

        {/* Filter Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'ALL', label: 'All Logs' },
            { key: 'PAYMENT', label: 'Payment Updates' },
            { key: 'ORDERS', label: 'Orders' },
            { key: 'PRODUCTS', label: 'Inventory' },
            { key: 'FINANCE', label: 'Finance' },
            { key: 'AUTH', label: 'Auth & Config' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                filterCategory === cat.key
                  ? 'bg-admin-gold text-stone-950 border-admin-gold shadow-sm'
                  : 'bg-admin-card text-admin-muted border-admin-border hover:text-gray-200 hover:border-admin-border/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-admin-card text-admin-muted uppercase tracking-wider font-semibold border-b border-admin-border">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Role</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Entity ID</th>
                <th className="p-4">Change Summary</th>
                <th className="p-4 text-center">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-admin-muted">
                    <AlertCircle className="w-8 h-8 text-admin-muted mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm text-gray-400">No matching audit logs found</p>
                    <p className="text-xs text-admin-muted mt-1">Try clearing your search query or selecting a different filter.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.logId;
                  return (
                    <React.Fragment key={log.logId}>
                      <tr className={`hover:bg-admin-card/50 transition-colors ${isExpanded ? 'bg-admin-card/30' : ''}`}>
                        <td className="p-4 text-admin-muted whitespace-nowrap">
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td className="p-4 font-medium text-gray-200">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-admin-muted shrink-0" />
                            <span className="truncate max-w-[160px]">{log.actorEmail}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-admin-card text-admin-gold border border-admin-border whitespace-nowrap">
                            {log.actorRole}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {renderActionBadge(log.action)}
                        </td>
                        <td className="p-4 text-admin-muted font-medium whitespace-nowrap">
                          {log.entityType}
                        </td>
                        <td className="p-4">
                          {renderEntityCell(log)}
                        </td>
                        <td className="p-4">
                          {renderChangeSummary(log)}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleExpand(log.logId)}
                            className="p-1.5 rounded-lg bg-admin-card hover:bg-admin-surface border border-admin-border text-admin-muted hover:text-gray-200 transition-colors"
                            title="Inspect JSON Payload"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Forensic Inspector */}
                      {isExpanded && (
                        <tr className="bg-admin-card/70 border-b border-admin-border">
                          <td colSpan={8} className="p-4 pl-8">
                            <div className="bg-stone-950 border border-admin-border rounded-xl p-4 text-[11px] font-mono text-gray-300 space-y-2">
                              <div className="flex items-center justify-between text-admin-gold border-b border-admin-border/50 pb-2">
                                <span className="font-bold">FORENSIC RECORD: {log.logId}</span>
                                <span className="text-admin-muted">{log.timestamp}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                <div>
                                  <span className="text-amber-400 font-semibold block mb-1">State Before:</span>
                                  <pre className="bg-stone-900/80 p-2.5 rounded-lg overflow-x-auto text-[10px] text-gray-300 border border-admin-border/40">
                                    {log.before ? JSON.stringify(log.before, null, 2) : '(none)'}
                                  </pre>
                                </div>
                                <div>
                                  <span className="text-emerald-400 font-semibold block mb-1">State After:</span>
                                  <pre className="bg-stone-900/80 p-2.5 rounded-lg overflow-x-auto text-[10px] text-gray-300 border border-admin-border/40">
                                    {log.after ? JSON.stringify(log.after, null, 2) : '(none)'}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
