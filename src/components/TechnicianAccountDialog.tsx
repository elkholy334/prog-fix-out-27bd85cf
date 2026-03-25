import { useState, useMemo } from 'react';
import { Wallet, Plus, Minus, FileText, ArrowDownUp, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTechnicians, useTasks, useTransactions, useCreateTransaction, useDeleteTransaction } from '@/hooks/useDatabase';
import { useToast } from '@/hooks/use-toast';
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
};

const TX_TYPE_COLORS: Record<string, string> = {
  deposit: 'text-success',
  deduction: 'text-destructive',
  commission: 'text-primary',
  settlement: 'text-warning',
};

export const TechnicianAccountDialog = ({ open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('statement');

  // Form state
  const [txType, setTxType] = useState<'deposit' | 'deduction'>('deposit');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txTechId, setTxTechId] = useState('');
  const [txTaskId, setTxTaskId] = useState('');

  // Date filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: technicians = [] } = useTechnicians();
  const { data: tasks = [] } = useTasks();
  const { data: transactions = [] } = useTransactions(selectedTech);
  const createTx = useCreateTransaction();
  const deleteTx = useDeleteTransaction();

  // Filter transactions by date
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const d = tx.created_at.slice(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [transactions, dateFrom, dateTo]);

  // Calculate balances per technician (from filtered)
  const techBalances = useMemo(() => {
    const balances: Record<string, { deposits: number; deductions: number; commissions: number; settlements: number; net: number }> = {};
    technicians.forEach(t => {
      balances[t.id] = { deposits: 0, deductions: 0, commissions: 0, settlements: 0, net: 0 };
    });
    filteredTransactions.forEach(tx => {
      if (!balances[tx.technician_id]) {
        balances[tx.technician_id] = { deposits: 0, deductions: 0, commissions: 0, settlements: 0, net: 0 };
      }
      const b = balances[tx.technician_id];
      const amt = Number(tx.amount) || 0;
      switch (tx.type) {
        case 'deposit': b.deposits += amt; b.net += amt; break;
        case 'deduction': b.deductions += amt; b.net -= amt; break;
        case 'commission': b.commissions += amt; b.net += amt; break;
        case 'settlement': b.settlements += amt; b.net -= amt; break;
      }
    });
    return balances;
  }, [filteredTransactions, technicians]);

  // Commission settlement calculation
  const settlementData = useMemo(() => {
    return technicians.map(tech => {
      const techTasks = tasks.filter(t =>
        t.status === 'completed' &&
        (t.required_technician === tech.id || t.technician_id === tech.id)
      );
      const totalCommission = techTasks.reduce((s, t) => s + (Number(t.technician_commission) || 0), 0);
      const paidSettlements = transactions
        .filter(tx => tx.technician_id === tech.id && tx.type === 'settlement')
        .reduce((s, tx) => s + (Number(tx.amount) || 0), 0);
      const paidDeposits = transactions
        .filter(tx => tx.technician_id === tech.id && tx.type === 'deposit')
        .reduce((s, tx) => s + (Number(tx.amount) || 0), 0);
      return {
        tech,
        totalCommission,
        paidSettlements,
        paidDeposits,
        remaining: totalCommission - paidSettlements - paidDeposits,
        tasksCount: techTasks.length,
      };
    });
  }, [technicians, tasks, transactions]);

  const handleAddTransaction = async () => {
    if (!txTechId) { toast({ title: 'اختر فني', variant: 'destructive' }); return; }
    if (!txAmount || Number(txAmount) <= 0) { toast({ title: 'أدخل مبلغ صحيح', variant: 'destructive' }); return; }

    try {
      await createTx.mutateAsync({
        technician_id: txTechId,
        type: txType,
        amount: Number(txAmount),
        description: txDescription || (txType === 'deposit' ? 'إيداع مبلغ' : 'خصم مبلغ'),
        task_id: txTaskId ? Number(txTaskId) : null,
        created_by: 'admin',
      });
      toast({ title: `تم ${txType === 'deposit' ? 'الإيداع' : 'الخصم'} بنجاح ✅` });
      setTxAmount('');
      setTxDescription('');
      setTxTaskId('');
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    }
  };

  const handleSettlement = async (techId: string, amount: number) => {
    if (amount <= 0) return;
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

  const getTechName = (id: string) => technicians.find(t => t.id === id)?.name || 'غير معروف';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center text-primary">
            <Wallet className="h-6 w-6" />
            إدارة حسابات الفنيين
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="add" className="text-xs gap-1"><Plus className="h-3 w-3" />إيداع/خصم</TabsTrigger>
            <TabsTrigger value="statement" className="text-xs gap-1"><FileText className="h-3 w-3" />كشف حساب</TabsTrigger>
            <TabsTrigger value="settlement" className="text-xs gap-1"><ArrowDownUp className="h-3 w-3" />تسوية</TabsTrigger>
            <TabsTrigger value="summary" className="text-xs gap-1"><Wallet className="h-3 w-3" />ملخص</TabsTrigger>
          </TabsList>

          {/* ADD DEPOSIT/DEDUCTION */}
          <TabsContent value="add" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTxType('deposit')}
                className={`p-3 rounded-xl border-2 text-center font-bold transition-all ${
                  txType === 'deposit' ? 'border-success bg-success/10 text-success' : 'border-border'
                }`}
              >
                <Plus className="h-5 w-5 mx-auto mb-1" />
                إيداع
              </button>
              <button
                onClick={() => setTxType('deduction')}
                className={`p-3 rounded-xl border-2 text-center font-bold transition-all ${
                  txType === 'deduction' ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border'
                }`}
              >
                <Minus className="h-5 w-5 mx-auto mb-1" />
                خصم
              </button>
            </div>

            <Select value={txTechId} onValueChange={setTxTechId}>
              <SelectTrigger><SelectValue placeholder="اختر الفني" /></SelectTrigger>
              <SelectContent>
                {technicians.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="المبلغ"
              value={txAmount}
              onChange={e => setTxAmount(e.target.value)}
              className="text-lg font-bold text-center"
            />

            <Input
              placeholder="الوصف (اختياري)"
              value={txDescription}
              onChange={e => setTxDescription(e.target.value)}
            />

            <Select value={txTaskId} onValueChange={setTxTaskId}>
              <SelectTrigger><SelectValue placeholder="ربط بمهمة (اختياري)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون مهمة</SelectItem>
                {tasks.slice(0, 50).map(t => (
                  <SelectItem key={t.id} value={String(t.id)}>#{t.id} - {t.client_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              className="w-full font-bold text-base py-5"
              variant={txType === 'deposit' ? 'default' : 'destructive'}
              onClick={handleAddTransaction}
              disabled={createTx.isPending}
            >
              {txType === 'deposit' ? <Plus className="h-5 w-5 ml-2" /> : <Minus className="h-5 w-5 ml-2" />}
              {txType === 'deposit' ? 'تأكيد الإيداع' : 'تأكيد الخصم'}
            </Button>
          </TabsContent>

          {/* ACCOUNT STATEMENT */}
          <TabsContent value="statement" className="space-y-4 mt-4">
            <Select value={selectedTech} onValueChange={setSelectedTech}>
              <SelectTrigger><SelectValue placeholder="اختر الفني" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">-- كل الفنيين --</SelectItem>
                {technicians.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date range filter */}
            <div className="flex gap-3 items-center">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">من</label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">إلى</label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" className="mt-5 text-xs" onClick={() => { setDateFrom(''); setDateTo(''); }}>
                  مسح
                </Button>
              )}
            </div>

            {selectedTech !== 'all' && techBalances[selectedTech] && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-success/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">إجمالي الإيداعات</p>
                  <p className="font-bold text-lg text-success">{techBalances[selectedTech].deposits}</p>
                </div>
                <div className="bg-destructive/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground">إجمالي الخصومات</p>
                  <p className="font-bold text-lg text-destructive">{techBalances[selectedTech].deductions}</p>
                </div>
              </div>
            )}

            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="p-2 text-right font-medium">التاريخ</th>
                    <th className="p-2 text-center font-medium">الفني</th>
                    <th className="p-2 text-center font-medium">النوع</th>
                    <th className="p-2 text-center font-medium">المبلغ</th>
                    <th className="p-2 text-center font-medium">الوصف</th>
                    <th className="p-2 text-center font-medium">حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">لا يوجد عمليات</td></tr>
                  ) : (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id} className="border-t border-border">
                        <td className="p-2 text-xs">{new Date(tx.created_at).toLocaleDateString('ar-EG')}</td>
                        <td className="p-2 text-center text-xs">{getTechName(tx.technician_id)}</td>
                        <td className={`p-2 text-center text-xs font-bold ${TX_TYPE_COLORS[tx.type] || ''}`}>
                          {TX_TYPE_LABELS[tx.type] || tx.type}
                        </td>
                        <td className={`p-2 text-center font-bold ${tx.type === 'deposit' || tx.type === 'commission' ? 'text-success' : 'text-destructive'}`}>
                          {tx.type === 'deposit' || tx.type === 'commission' ? '+' : '-'}{tx.amount}
                        </td>
                        <td className="p-2 text-center text-xs text-muted-foreground">{tx.description}</td>
                        <td className="p-2 text-center">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="text-destructive/60 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف العملية؟</AlertDialogTitle>
                                <AlertDialogDescription>سيتم حذف هذه العملية نهائياً</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteTx.mutate(tx.id)} className="bg-destructive text-destructive-foreground">حذف</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* SETTLEMENT */}
          <TabsContent value="settlement" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground text-center">مقارنة العمولات المستحقة بالمبالغ المدفوعة</p>
            {settlementData.map(s => (
              <div key={s.tech.id} className="border border-border rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold" style={{ color: s.tech.color }}>{s.tech.name}</span>
                  <span className="text-xs text-muted-foreground">{s.tasksCount} مهمة مكتملة</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-muted-foreground">عمولات مستحقة</p>
                    <p className="font-bold text-primary text-sm">{s.totalCommission}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">مدفوع</p>
                    <p className="font-bold text-success text-sm">{s.paidSettlements + s.paidDeposits}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">المتبقي</p>
                    <p className={`font-bold text-sm ${s.remaining > 0 ? 'text-destructive' : 'text-success'}`}>{s.remaining}</p>
                  </div>
                </div>
                {s.remaining > 0 && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleSettlement(s.tech.id, s.remaining)}
                    disabled={createTx.isPending}
                  >
                    تسوية المتبقي ({s.remaining})
                  </Button>
                )}
              </div>
            ))}
          </TabsContent>

          {/* SUMMARY */}
          <TabsContent value="summary" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground text-center">ملخص حسابات كل الفنيين</p>
            {technicians.map(tech => {
              const b = techBalances[tech.id] || { deposits: 0, deductions: 0, commissions: 0, settlements: 0, net: 0 };
              return (
                <div key={tech.id} className="border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold" style={{ color: tech.color }}>{tech.name}</span>
                    <span className={`font-bold text-lg ${b.net >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {b.net >= 0 ? '+' : ''}{b.net}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center text-xs">
                    <div><p className="text-muted-foreground">إيداعات</p><p className="font-bold text-success">{b.deposits}</p></div>
                    <div><p className="text-muted-foreground">خصومات</p><p className="font-bold text-destructive">{b.deductions}</p></div>
                    <div><p className="text-muted-foreground">عمولات</p><p className="font-bold text-primary">{b.commissions}</p></div>
                    <div><p className="text-muted-foreground">تسويات</p><p className="font-bold text-warning">{b.settlements}</p></div>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>

        <Button variant="outline" className="w-full mt-2" onClick={() => onOpenChange(false)}>إغلاق</Button>
      </DialogContent>
    </Dialog>
  );
};
