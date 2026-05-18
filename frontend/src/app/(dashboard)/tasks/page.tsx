'use client';

import * as React from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { PermissionGate } from '@/components/shared/permission-gate';
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
import { useLocalTasks, type LocalTask, type TaskStatus } from '@/hooks/useLocalTasks';
import { cn } from '@/lib/utils';
import { useAuthStore, selectUser } from '@/store/auth.store';

const COLUMNS: { status: TaskStatus; label: string; hint: string }[] = [
  { status: 'TODO', label: 'To do', hint: 'Not started' },
  { status: 'IN_PROGRESS', label: 'In progress', hint: 'Active work' },
  { status: 'DONE', label: 'Done', hint: 'Completed' },
];

export default function TasksPage() {
  const user = useAuthStore(selectUser);
  const isAgent = user?.role === 'agent';
  const { tasks, hydrated, addTask, updateTask, deleteTask, setStatus } = useLocalTasks(user?.id);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [newStatus, setNewStatus] = React.useState<TaskStatus>('TODO');

  const [editing, setEditing] = React.useState<LocalTask | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Add a title');
      return;
    }
    addTask(title, description, newStatus);
    toast.success('Task created');
    setTitle('');
    setDescription('');
    setNewStatus('TODO');
  }

  function openEdit(task: LocalTask) {
    setEditing(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
  }

  function saveEdit() {
    if (!editing) return;
    if (!editTitle.trim()) {
      toast.error('Title required');
      return;
    }
    updateTask(editing.id, { title: editTitle.trim(), description: editDescription.trim() });
    toast.success('Task updated');
    setEditing(null);
  }

  const byStatus = React.useMemo(() => {
    const map: Record<TaskStatus, LocalTask[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    };
    for (const t of tasks) {
      map[t.status].push(t);
    }
    for (const k of Object.keys(map) as TaskStatus[]) {
      map[k].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return map;
  }, [tasks]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading tasks…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description={
          isAgent
            ? 'Your current task queue (this browser). Create, edit, move, and delete follow the task.* permissions your manager enabled.'
            : 'Plan work by status. Data is stored in this browser for your account until a server module is added.'
        }
      />

      <PermissionGate permission="tasks.create">
        <SectionCard title="New task">
          <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="task-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Review access policy"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="task-desc" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Optional details"
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Initial column</span>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as TaskStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((c) => (
                    <SelectItem key={c.status} value={c.status}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="gap-2">
                <Plus className="h-4 w-4" />
                Add task
              </Button>
            </div>
          </form>
        </SectionCard>
      </PermissionGate>

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Create a task above, or ask an admin for the tasks.create permission."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <Card key={col.status} className="flex flex-col bg-muted/20 ring-foreground/5">
              <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle className="text-sm font-semibold tracking-tight">{col.label}</CardTitle>
                <p className="text-xs text-muted-foreground">{col.hint}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 pt-4">
                {byStatus[col.status].length === 0 ? (
                  <p className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
                    Nothing here
                  </p>
                ) : (
                  byStatus[col.status].map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'rounded-lg border bg-card p-3 shadow-sm ring-1 ring-foreground/5',
                        'transition-shadow hover:shadow-md'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-snug">{task.title}</p>
                          {task.description ? (
                            <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                              {task.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 gap-0.5">
                          <PermissionGate permission="tasks.edit">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Edit task"
                              onClick={() => openEdit(task)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission="tasks.delete">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              aria-label="Delete task"
                              onClick={() => setDeleteId(task.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </PermissionGate>
                        </div>
                      </div>
                      <PermissionGate permission="tasks.edit">
                        <div className="mt-3">
                          <Select
                            value={task.status}
                            onValueChange={(v) => {
                              setStatus(task.id, v as TaskStatus);
                              toast.success('Moved');
                            }}
                          >
                            <SelectTrigger className="h-8 w-full text-xs">
                              <SelectValue placeholder="Move" />
                            </SelectTrigger>
                            <SelectContent>
                              {COLUMNS.map((c) => (
                                <SelectItem key={c.status} value={c.status}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </PermissionGate>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>Update title and description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-task-title">
                Title
              </label>
              <Input
                id="edit-task-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-task-desc">
                Description
              </label>
              <Textarea
                id="edit-task-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveEdit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the task from your local list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (deleteId) {
                  deleteTask(deleteId);
                  toast.success('Task deleted');
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
