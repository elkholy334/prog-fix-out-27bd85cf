import { useState, useMemo } from 'react';
import { Wallet, Plus, Minus, FileText, ArrowDownUp, Trash2, ChevronRight, ArrowLeft, DollarSign, TrendingUp, TrendingDown, Calendar, User, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTechnicians, useTasks, useTransactions, useCreateTransaction, useDeleteTransaction } from '@/hooks/useDatabase';
import { useToast } from '@/hooks/use-toast';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TX_TYPE_LABELS: Record<string, string> = {
  deposit: 'إيداع',
  deduction: 'خصم',
  commission: 'عمولة',
  settlement: 'تسوية',
  payment: 'دفع',
};

const TX_TYPE_ICONS: Record<string, string> = {
  deposit: '💰',
  deduction: '➖',
  commission: '📊',
  settlement: '✅',
  payment: '💸',
};

type Screen = 'main' | 'tech-detail' | 'add-transaction' | 'settlement';

export const TechnicianAccountDialog = ({ open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const [screen, setScreen] = useState<Screen>('main');
  const [selectedTechId, setSelectedTechId] = useState('');

  // Transaction form
  const [txType, setTxType] = useState<'deposit' | 'deduction' | 'payment'>('deposit');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txTaskId, setTxTaskId] = useState('');

  // Date filter
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activePeriod, setActivePeriod] = useState<string | null>(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  const { data: technicians = [] } = useTechnicians();
  const { data: tasks = [] } = useTasks();
  const { data: allTransactions = [] } = useTransactions('all');
  const createTx = useCreateTransaction();
  const deleteTx = useDeleteTransaction();

  const selectedTech = technicians.find(t => t.id === selectedTechId);

  // Per-technician balances from ALL transactions (not filtered)
  const techSummaries = useMemo(() => {
    const map: Record<string, { deposits: number; deductions: number; commissions: number; settlements: number; payments: number }> = {};
    technicians.forEach(t => {
      map[t.id] = { deposits: 0, deductions: 0, commissions: 0, settlements: 0, payments: 0 };
    });
    allTransactions.forEach(tx => {
      if (!map[tx.technician_id]) return;
      const amt = Number(tx.amount) || 0;
      switch (tx.type) {
        case 'deposit': map[tx.technician_id].deposits += amt; break;
        case 'deduction': map[tx.technician_id].deductions += amt; break;
        case 'commission': map[tx.technician_id].commissions += amt; break;
        case 'settlement': map[tx.technician_id].settlements += amt; break;
        case 'payment': map[tx.technician_id].payments += amt; break;
      }
    });
    return map;
  }, [allTransactions, technicians]);

  const getBalance = (techId: string) => {
    const s = techSummaries[techId];
    if (!s) return 0;
    // الرصيد = (إيداعات + عمولات) - (خصومات + تسويات + دفع)
    return (s.deposits + s.commissions) - (s.deductions + s.settlements + s.payments);
  };

  // Filtered transactions for detail view
  const techTransactions = useMemo(() => {
    return allTransactions
      .filter(tx => tx.technician_id === selectedTechId)
      .filter(tx => {
        const d = tx.created_at.slice(0, 10);
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
        return true;
      });
  }, [allTransactions, selectedTechId, dateFrom, dateTo]);

  // Settlement data per tech
  const getSettlementInfo = (techId: string) => {
    const techTasks = tasks.filter(t =>
      t.status === 'completed' &&
      (t.required_technician === techId || t.technician_id === techId)
    );
    const totalCommission = techTasks.reduce((s, t) => s + (Number(t.technician_commission) || 0), 0);
    const paidOut = allTransactions
      .filter(tx => tx.technician_id === techId && (tx.type === 'settlement' || tx.type === 'payment'))
      .reduce((s, tx) => s + (Number(tx.amount) || 0), 0);
    return { totalCommission, paidOut, remaining: totalCommission - paidOut, tasksCount: techTasks.length };
  };

  const handleAddTransaction = async () => {
    if (!txAmount || Number(txAmount) <= 0) {
      toast({ title: 'أدخل مبلغ صحيح', variant: 'destructive' });
      return;
    }
    const labels = { deposit: 'إيداع مبلغ', deduction: 'خصم مبلغ', payment: 'دفع مبلغ' };
    try {
      await createTx.mutateAsync({
        technician_id: selectedTechId,
        type: txType,
        amount: Number(txAmount),
        description: txDescription || labels[txType],
        task_id: txTaskId && txTaskId !== 'none' ? Number(txTaskId) : null,
        created_by: 'admin',
      });
      toast({ title: `تم بنجاح ✅` });
      setTxAmount('');
      setTxDescription('');
      setTxTaskId('');
      setScreen('tech-detail');
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    }
  };

  const handleSettlement = async (techId: string, amount: number) => {
    if (amount <= 0) {
      toast({ title: 'لا يوجد مبلغ متبقي', variant: 'destructive' });
      return;
    }
    try {
      await createTx.mutateAsync({
        technician_id: techId,
        type: 'settlement',
        amount,
        description: 'تسوية عمولات',
        created_by: 'admin',
      });
      toast({ title: 'تمت التسوية بنجاح ✅' });
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    }
  };

  const openTechDetail = (techId: string) => {
    setSelectedTechId(techId);
    setDateFrom('');
    setDateTo('');
    setActivePeriod(null);
    setScreen('tech-detail');
  };

  const setPeriod = (p: string) => {
    setActivePeriod(p);
    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    let from = to;
    switch (p) {
      case 'today': from = to; break;
      case 'week': { const d = new Date(now); d.setDate(d.getDate() - 7); from = d.toISOString().slice(0, 10); break; }
      case 'month': { const d = new Date(now); d.setMonth(d.getMonth() - 1); from = d.toISOString().slice(0, 10); break; }
      case 'year': { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); from = d.toISOString().slice(0, 10); break; }
    }
    setDateFrom(from);
    setDateTo(to);
  };

  const periods = [
    { key: 'today', label: 'اليوم' },
    { key: 'week', label: 'الأسبوع' },
    { key: 'month', label: 'الشهر' },
    { key: 'year', label: 'السنة' },
  ];

  const handleSendWhatsAppStatement = async () => {
    if (!selectedTech?.phone) {
      toast({ title: 'لا يوجد رقم هاتف للفني', variant: 'destructive' });
      return;
    }
    setSendingWhatsApp(true);
    const balance = getBalance(selectedTechId);
    const periodLabel = activePeriod ? periods.find(p => p.key === activePeriod)?.label || '' : 'كل الفترات';
    const fromLabel = dateFrom || 'البداية';
    const toLabel = dateTo || 'اليوم';

    const filteredDeposits = techTransactions.filter(tx => tx.type === 'deposit').reduce((s, tx) => s + Number(tx.amount), 0);
    const filteredDeductions = techTransactions.filter(tx => tx.type === 'deduction').reduce((s, tx) => s + Number(tx.amount), 0);
    const filteredCommissions = techTransactions.filter(tx => tx.type === 'commission').reduce((s, tx) => s + Number(tx.amount), 0);
    const filteredPayments = techTransactions.filter(tx => tx.type === 'payment' || tx.type === 'settlement').reduce((s, tx) => s + Number(tx.amount), 0);

    const msg = `📊 كشف حساب - ${selectedTech.name}
📅 الفترة: ${periodLabel} (${fromLabel} → ${toLabel})
━━━━━━━━━━━━━━
💰 إيداعات: ${filteredDeposits} ج.م
📊 عمولات: ${filteredCommissions} ج.م
➖ خصومات: ${filteredDeductions} ج.م
💸 مدفوعات: ${filteredPayments} ج.م
━━━━━━━━━━━━━━
📌 عدد العمليات: ${techTransactions.length}
💵 الرصيد الحالي: ${balance >= 0 ? '+' : ''}${balance} ج.م
━━━━━━━━━━━━━━
✅ صادر من نظام إدارة الصيانة`;

    const result = await sendWhatsAppMessage(selectedTech.phone, msg, {
      recipientName: selectedTech.name,
      messageType: 'account_statement',
    });

    if (result.success) {
      toast({ title: 'تم إرسال كشف الحساب ✅' });
    } else {
      toast({ title: result.error || 'فشل الإرسال', variant: 'destructive' });
    }
    setSendingWhatsApp(false);
  };

  const openAddTransaction = (type: 'deposit' | 'deduction' | 'payment') => {
    setTxType(type);
    setTxAmount('');
    setTxDescription('');
    setTxTaskId('');
    setScreen('add-transaction');
  };

  const goBack = () => {
    if (screen === 'add-transaction') setScreen('tech-detail');
    else if (screen === 'settlement') setScreen('main');
    else setScreen('main');
  };

  // ===== MAIN SCREEN: Technician list =====
  const renderMain = () => (
    <div className="space-y-3">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-success/10 border border-success/20 rounded-xl p-3 text-center">
          <TrendingUp className="h-4 w-4 mx-auto text-success mb-1" />
          <p className="text-[10px] text-muted-foreground">إجمالي الإيداعات</p>
          <p className="font-bold text-success">
            {Object.values(techSummaries).reduce((s, v) => s + v.deposits, 0)}
          </p>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-center">
          <TrendingDown className="h-4 w-4 mx-auto text-destructive mb-1" />
          <p className="text-[10px] text-muted-foreground">إجمالي المدفوعات</p>
          <p className="font-bold text-destructive">
            {Object.values(techSummaries).reduce((s, v) => s + v.payments + v.settlements, 0)}
          </p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
          <DollarSign className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-[10px] text-muted-foreground">إجمالي العمولات</p>
          <p className="font-bold text-primary">
            {Object.values(techSummaries).reduce((s, v) => s + v.commissions, 0)}
          </p>
        </div>
      </div>

      {/* Settlement button */}
      <Button
        variant="outline"
        className="w-full border-primary/30 text-primary hover:bg-primary/5"
        onClick={() => setScreen('settlement')}
      >
        <ArrowDownUp className="h-4 w-4 ml-2" />
        تسوية العمولات
      </Button>

      {/* Technician cards */}
      <div className="space-y-2">
        {technicians.map(tech => {
          const balance = getBalance(tech.id);
          const s = techSummaries[tech.id] || { deposits: 0, deductions: 0, commissions: 0, settlements: 0, payments: 0 };
          return (
            <button
              key={tech.id}
              onClick={() => openTechDetail(tech.id)}
              className="w-full bg-card border border-border rounded-xl p-3 hover:border-primary/40 transition-all text-right"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: tech.color }}>
                    {tech.name.charAt(0)}
                  </div>
                  <span className="font-bold text-sm">{tech.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-lg ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {balance >= 0 ? '+' : ''}{balance} ج.م
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground rotate-180" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] text-muted-foreground">
                <span>إيداع: <b className="text-success">{s.deposits}</b></span>
                <span>خصم: <b className="text-destructive">{s.deductions}</b></span>
                <span>عمولة: <b className="text-primary">{s.commissions}</b></span>
                <span>دفع: <b className="text-warning">{s.payments + s.settlements}</b></span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ===== TECH DETAIL SCREEN =====
  const renderTechDetail = () => {
    if (!selectedTech) return null;
    const balance = getBalance(selectedTechId);
    const settlement = getSettlementInfo(selectedTechId);

    return (
      <div className="space-y-3">
        {/* Tech info card */}
        <div className="bg-gradient-to-l from-primary/10 to-transparent border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: selectedTech.color }}>
              {selectedTech.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-lg">{selectedTech.name}</h3>
              <p className="text-xs text-muted-foreground">{selectedTech.phone || 'بدون رقم'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">الرصيد الحالي</span>
            <span className={`font-bold text-2xl ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {balance >= 0 ? '+' : ''}{balance} ج.م
            </span>
          </div>
          {settlement.remaining > 0 && (
            <div className="mt-2 p-2 bg-warning/10 rounded-lg text-xs text-center">
              عمولات متبقية: <b className="text-warning">{settlement.remaining} ج.م</b> ({settlement.tasksCount} مهمة)
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => openAddTransaction('deposit')}
            className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-success/30 bg-success/5 hover:bg-success/10 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
              <Plus className="h-4 w-4 text-success" />
            </div>
            <span className="text-xs font-bold text-success">إيداع</span>
          </button>
          <button
            onClick={() => openAddTransaction('deduction')}
            className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
              <Minus className="h-4 w-4 text-destructive" />
            </div>
            <span className="text-xs font-bold text-destructive">خصم</span>
          </button>
          <button
            onClick={() => openAddTransaction('payment')}
            className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-bold text-primary">دفع</span>
          </button>
        </div>

        {/* Quick period filters */}
        <div className="flex gap-2 justify-center flex-wrap">
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activePeriod === p.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent/20'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date filter */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] text-muted-foreground">من</label>
            <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePeriod(null); }} className="h-8 text-xs" />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] text-muted-foreground">إلى</label>
            <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePeriod(null); }} className="h-8 text-xs" />
          </div>
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={() => { setDateFrom(''); setDateTo(''); setActivePeriod(null); }}>
              مسح
            </Button>
          )}
        </div>

        {/* Transactions list */}
        <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
          {techTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">لا يوجد عمليات</p>
          ) : (
            techTransactions.map(tx => {
              const isPositive = tx.type === 'deposit' || tx.type === 'commission';
              return (
                <div key={tx.id} className="flex items-center gap-3 p-2.5 bg-card border border-border rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isPositive ? 'bg-success/15' : 'bg-destructive/15'}`}>
                    {TX_TYPE_ICONS[tx.type] || '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{TX_TYPE_LABELS[tx.type] || tx.type}</span>
                      <span className={`font-bold text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
                        {isPositive ? '+' : '-'}{tx.amount} ج.م
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground truncate">{tx.description}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="text-destructive/40 hover:text-destructive p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف العملية؟</AlertDialogTitle>
                        <AlertDialogDescription>سيتم حذف هذه العملية نهائياً ولا يمكن التراجع</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteTx.mutate(tx.id)} className="bg-destructive text-destructive-foreground">حذف</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })
          )}
        </div>

        {/* WhatsApp Send */}
        <Button
          className="w-full bg-success text-success-foreground font-bold text-sm py-5"
          onClick={handleSendWhatsAppStatement}
          disabled={sendingWhatsApp}
        >
          <MessageCircle className="h-5 w-5 ml-2" />
          {sendingWhatsApp ? 'جاري الإرسال...' : 'إرسال كشف الحساب على واتساب'}
        </Button>
      </div>
    );
  };

  // ===== ADD TRANSACTION SCREEN =====
  const renderAddTransaction = () => {
    if (!selectedTech) return null;
    const typeConfig = {
      deposit: { label: 'إيداع مبلغ', color: 'success', icon: Plus, desc: 'سلفة أو راتب أو مبلغ للفني' },
      deduction: { label: 'خصم مبلغ', color: 'destructive', icon: Minus, desc: 'غرامة أو خصم من الفني' },
      payment: { label: 'دفع مبلغ', color: 'primary', icon: DollarSign, desc: 'دفع مستحقات أو عمولات' },
    };
    const cfg = typeConfig[txType];
    const Icon = cfg.icon;

    return (
      <div className="space-y-4">
        <div className={`text-center p-4 rounded-xl bg-${cfg.color}/10 border border-${cfg.color}/20`}>
          <div className={`w-12 h-12 mx-auto rounded-full bg-${cfg.color}/20 flex items-center justify-center mb-2`}>
            <Icon className={`h-6 w-6 text-${cfg.color}`} />
          </div>
          <h3 className="font-bold text-lg">{cfg.label}</h3>
          <p className="text-xs text-muted-foreground">{cfg.desc}</p>
          <p className="text-sm mt-1">الفني: <b style={{ color: selectedTech.color }}>{selectedTech.name}</b></p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">المبلغ *</label>
            <Input
              type="number"
              placeholder="0"
              value={txAmount}
              onChange={e => setTxAmount(e.target.value)}
              className="text-2xl font-bold text-center h-14"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">الوصف (اختياري)</label>
            <Input
              placeholder="مثال: سلفة شهر مارس"
              value={txDescription}
              onChange={e => setTxDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">ربط بمهمة (اختياري)</label>
            <Select value={txTaskId} onValueChange={setTxTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="بدون ربط بمهمة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون مهمة</SelectItem>
                {tasks.slice(0, 50).map(t => (
                  <SelectItem key={t.id} value={String(t.id)}>#{t.id} - {t.client_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          className="w-full font-bold text-base py-6"
          variant={txType === 'deduction' ? 'destructive' : 'default'}
          onClick={handleAddTransaction}
          disabled={createTx.isPending || !txAmount}
        >
          {createTx.isPending ? 'جاري...' : `تأكيد ${cfg.label}`}
        </Button>
      </div>
    );
  };

  // ===== SETTLEMENT SCREEN =====
  const renderSettlement = () => (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">مقارنة العمولات المستحقة بما تم دفعه</p>
      {technicians.map(tech => {
        const s = getSettlementInfo(tech.id);
        if (s.totalCommission === 0) return null;
        return (
          <div key={tech.id} className="border border-border rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: tech.color }}>
                  {tech.name.charAt(0)}
                </div>
                <span className="font-bold text-sm">{tech.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{s.tasksCount} مهمة</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-primary/5 rounded-lg p-2">
                <p className="text-muted-foreground">مستحق</p>
                <p className="font-bold text-primary">{s.totalCommission}</p>
              </div>
              <div className="bg-success/5 rounded-lg p-2">
                <p className="text-muted-foreground">مدفوع</p>
                <p className="font-bold text-success">{s.paidOut}</p>
              </div>
              <div className={`rounded-lg p-2 ${s.remaining > 0 ? 'bg-destructive/5' : 'bg-success/5'}`}>
                <p className="text-muted-foreground">متبقي</p>
                <p className={`font-bold ${s.remaining > 0 ? 'text-destructive' : 'text-success'}`}>{s.remaining}</p>
              </div>
            </div>
            {s.remaining > 0 && (
              <Button
                size="sm"
                className="w-full"
                onClick={() => handleSettlement(tech.id, s.remaining)}
                disabled={createTx.isPending}
              >
                <DollarSign className="h-4 w-4 ml-1" />
                تسوية {s.remaining} ج.م
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );

  const screenTitles: Record<Screen, string> = {
    'main': 'إدارة حسابات الفنيين',
    'tech-detail': selectedTech?.name || 'تفاصيل الفني',
    'add-transaction': 'عملية جديدة',
    'settlement': 'تسوية العمولات',
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setScreen('main'); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center text-primary">
            {screen !== 'main' && (
              <button onClick={goBack} className="absolute right-4 top-4 p-1 hover:bg-accent rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <Wallet className="h-5 w-5" />
            {screenTitles[screen]}
          </DialogTitle>
        </DialogHeader>

        {screen === 'main' && renderMain()}
        {screen === 'tech-detail' && renderTechDetail()}
        {screen === 'add-transaction' && renderAddTransaction()}
        {screen === 'settlement' && renderSettlement()}
      </DialogContent>
    </Dialog>
  );
};
