import { useState, useMemo } from 'react';
import { MessageSquare, RefreshCw, CheckCircle2, XCircle, Clock, Search, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type LogStatus = 'all' | 'success' | 'failed';

export const WhatsAppLogsDialog = ({ open, onOpenChange }: Props) => {
  const [statusFilter, setStatusFilter] = useState<LogStatus>('all');
  const [search, setSearch] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['whatsapp-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('whatsapp_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-logs'] }),
  });

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          log.recipient_name?.toLowerCase().includes(q) ||
          log.recipient_phone?.includes(q) ||
          log.message_type?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, statusFilter, search]);

  const stats = useMemo(() => {
    const success = logs.filter(l => l.status === 'success').length;
    const failed = logs.filter(l => l.status === 'failed').length;
    return { total: logs.length, success, failed };
  }, [logs]);

  const handleRetry = async (log: typeof logs[0]) => {
    setRetryingId(log.id);
    try {
      const result = await sendWhatsAppMessage(log.recipient_phone, log.message_text, {
        taskId: log.task_id ?? undefined,
        recipientName: log.recipient_name,
        messageType: log.message_type,
      });
      if (result.success) {
        // Update old log to retried
        await supabase.from('whatsapp_logs').update({ status: 'retried' }).eq('id', log.id);
        toast({ title: '✅ تم إعادة الإرسال بنجاح' });
      } else {
        toast({ title: '❌ فشل إعادة الإرسال', description: result.error, variant: 'destructive' });
      }
      queryClient.invalidateQueries({ queryKey: ['whatsapp-logs'] });
    } catch {
      toast({ title: '❌ خطأ في إعادة الإرسال', variant: 'destructive' });
    } finally {
      setRetryingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const messageTypeLabels: Record<string, string> = {
    task_created_client: 'تأكيد حجز',
    task_created_technician: 'إبلاغ فني',
    task_completed_client: 'إتمام للعميل',
    task_completed_admin: 'تقرير للمدير',
    task_completed_team: 'إخطار الفريق',
    task_postponed: 'تأجيل',
    general: 'عام',
  };

  const statusFilters: { key: LogStatus; label: string }[] = [
    { key: 'all', label: `الكل (${stats.total})` },
    { key: 'success', label: `ناجحة (${stats.success})` },
    { key: 'failed', label: `فاشلة (${stats.failed})` },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center text-primary">
            <MessageSquare className="h-6 w-6" />
            تقارير رسائل الواتساب
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted rounded-lg p-2 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">إجمالي</p>
            </div>
            <div className="bg-success/10 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold text-success">{stats.success}</p>
              <p className="text-xs text-muted-foreground">ناجحة</p>
            </div>
            <div className="bg-destructive/10 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
              <p className="text-xs text-muted-foreground">فاشلة</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 items-center">
            <div className="flex gap-1">
              {statusFilters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    statusFilter === f.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent/20'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو الرقم..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-8 h-8 text-sm"
              />
            </div>
          </div>

          {/* Logs list */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
            ) : filteredLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد رسائل</p>
            ) : (
              filteredLogs.map(log => (
                <div
                  key={log.id}
                  className={`rounded-lg border p-3 space-y-1 ${
                    log.status === 'success' ? 'border-success/30 bg-success/5' :
                    log.status === 'retried' ? 'border-muted bg-muted/30 opacity-60' :
                    'border-destructive/30 bg-destructive/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs border-destructive/50 hover:bg-destructive/10"
                          onClick={() => handleRetry(log)}
                          disabled={retryingId === log.id}
                        >
                          <RefreshCw className={`h-3 w-3 ml-1 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                          إعادة
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(log.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-medium">{log.recipient_name || log.recipient_phone}</p>
                        <p className="text-xs text-muted-foreground">{log.recipient_phone}</p>
                      </div>
                      {log.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : log.status === 'retried' ? (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{formatDate(log.created_at)}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        {messageTypeLabels[log.message_type] || log.message_type}
                      </Badge>
                      {log.task_id && (
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          #{log.task_id}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {log.status === 'failed' && log.error_message && (
                    <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
                      {log.error_message}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
