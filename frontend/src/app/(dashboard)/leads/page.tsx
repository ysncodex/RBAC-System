'use client';

/**
 * Leads module: gated by `leads.view`. For agents this is typically granted via manager overrides.
 */

import * as React from 'react';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLocalLeads, type LeadStage, type LocalLead } from '@/hooks/useLocalLeads';
import { cn } from '@/lib/utils';
import { useAuthStore, selectUser } from '@/store/auth.store';

const STAGES: { stage: LeadStage; label: string; hint: string }[] = [
  { stage: 'NEW', label: 'New', hint: 'Inbound' },
  { stage: 'CONTACTED', label: 'Contacted', hint: 'Outreach' },
  { stage: 'QUALIFIED', label: 'Qualified', hint: 'Fit & budget' },
  { stage: 'WON', label: 'Won', hint: 'Closed won' },
];

export default function LeadsPage() {
  const user = useAuthStore(selectUser);
  const isAgent = user?.role === 'agent';
  const { leads, hydrated, addLead, updateLead, deleteLead, setStage } = useLocalLeads(user?.id);

  const [company, setCompany] = React.useState('');
  const [contactName, setContactName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [value, setValue] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [newStage, setNewStage] = React.useState<LeadStage>('NEW');

  const [editing, setEditing] = React.useState<LocalLead | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  function resetForm() {
    setCompany('');
    setContactName('');
    setEmail('');
    setValue('');
    setNotes('');
    setNewStage('NEW');
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !contactName.trim()) {
      toast.error('Company and contact are required');
      return;
    }
    const n = Number(value);
    addLead({
      company,
      contactName,
      email: email || '—',
      value: Number.isFinite(n) ? n : 0,
      notes,
      stage: newStage,
    });
    toast.success('Lead added');
    resetForm();
  }

  const byStage = React.useMemo(() => {
    const map: Record<LeadStage, LocalLead[]> = {
      NEW: [],
      CONTACTED: [],
      QUALIFIED: [],
      WON: [],
    };
    for (const l of leads) {
      map[l.stage].push(l);
    }
    for (const k of Object.keys(map) as LeadStage[]) {
      map[k].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return map;
  }, [leads]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading leads…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description={
          isAgent
            ? 'Your assigned lead workspace (this browser). You only see this module when your manager grants leads.view.'
            : 'Lightweight pipeline stored in your browser. Hook this page to a CRM API when you are ready.'
        }
      />

      <SectionCard title="New lead">
        <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="lead-company" className="text-sm font-medium">
              Company
            </label>
            <Input
              id="lead-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc."
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lead-contact" className="text-sm font-medium">
              Contact name
            </label>
            <Input
              id="lead-contact"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lead-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="lead-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@acme.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lead-value" className="text-sm font-medium">
              Est. value
            </label>
            <Input
              id="lead-value"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="lead-notes" className="text-sm font-medium">
              Notes
            </label>
            <Textarea
              id="lead-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Context, next step…"
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Stage</span>
            <Select value={newStage} onValueChange={(v) => setNewStage(v as LeadStage)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s.stage} value={s.stage}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="gap-2">
              <Plus className="h-4 w-4" />
              Add lead
            </Button>
          </div>
        </form>
      </SectionCard>

      {leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Capture opportunities above. Nothing is sent to the server yet."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-4">
          {STAGES.map((col) => (
            <Card key={col.stage} size="sm" className="bg-muted/15 ring-foreground/5">
              <CardHeader className="border-b border-border/60 pb-2">
                <CardTitle className="text-sm font-semibold">{col.label}</CardTitle>
                <p className="text-xs text-muted-foreground">{col.hint}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5 pt-3">
                {byStage[col.stage].length === 0 ? (
                  <p className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
                    Empty
                  </p>
                ) : (
                  byStage[col.stage].map((lead) => (
                    <div
                      key={lead.id}
                      className={cn(
                        'rounded-lg border bg-card p-3 text-sm shadow-sm ring-1 ring-foreground/5',
                        'hover:shadow-md'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                          <Building2 className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="truncate font-semibold leading-tight">{lead.company}</p>
                          <p className="text-xs text-muted-foreground">{lead.contactName}</p>
                          {lead.email !== '—' ? (
                            <p className="truncate text-xs text-muted-foreground">{lead.email}</p>
                          ) : null}
                          <p className="text-xs font-medium text-foreground/80">
                            {lead.value > 0
                              ? new Intl.NumberFormat(undefined, {
                                  style: 'currency',
                                  currency: 'USD',
                                  maximumFractionDigits: 0,
                                }).format(lead.value)
                              : '—'}
                          </p>
                        </div>
                      </div>
                      {lead.notes ? (
                        <p className="mt-2 line-clamp-2 border-t pt-2 text-xs text-muted-foreground">
                          {lead.notes}
                        </p>
                      ) : null}
                      <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
                        <Select
                          value={lead.stage}
                          onValueChange={(v) => {
                            setStage(lead.id, v as LeadStage);
                            toast.success('Stage updated');
                          }}
                        >
                          <SelectTrigger className="h-8 flex-1 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGES.map((s) => (
                              <SelectItem key={s.stage} value={s.stage}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          aria-label="Edit lead"
                          onClick={() => setEditing(lead)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                          aria-label="Delete lead"
                          onClick={() => setDeleteId(lead.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit lead</DialogTitle>
            <DialogDescription>Update fields and save.</DialogDescription>
          </DialogHeader>
          {editing ? (
            <EditLeadForm
              lead={editing}
              onSave={(patch) => {
                updateLead(editing.id, patch);
                toast.success('Lead saved');
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes this card from your local pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (deleteId) {
                  deleteLead(deleteId);
                  toast.success('Lead removed');
                }
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditLeadForm({
  lead,
  onSave,
  onCancel,
}: {
  lead: LocalLead;
  onSave: (patch: Partial<Omit<LocalLead, 'id' | 'updatedAt'>>) => void;
  onCancel: () => void;
}) {
  const [company, setCompany] = React.useState(lead.company);
  const [contactName, setContactName] = React.useState(lead.contactName);
  const [email, setEmail] = React.useState(lead.email === '—' ? '' : lead.email);
  const [value, setValue] = React.useState(lead.value ? String(lead.value) : '');
  const [notes, setNotes] = React.useState(lead.notes);
  const [stage, setStage] = React.useState<LeadStage>(lead.stage);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !contactName.trim()) {
      toast.error('Company and contact are required');
      return;
    }
    const n = Number(value);
    onSave({
      company: company.trim(),
      contactName: contactName.trim(),
      email: (email.trim() || '—').trim(),
      value: Number.isFinite(n) ? n : 0,
      notes: notes.trim(),
      stage,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium">Company</label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Contact</label>
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Value</label>
          <Input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Stage</label>
          <Select value={stage} onValueChange={(v) => setStage(v as LeadStage)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => (
                <SelectItem key={s.stage} value={s.stage}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium">Notes</label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <DialogFooter className="gap-2 sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  );
}
