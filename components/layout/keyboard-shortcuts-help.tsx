'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

type KeyboardShortcutsHelpProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
};

type ShortcutItem = {
  keys: string;
  action: string;
};

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
  isAdmin,
}: KeyboardShortcutsHelpProps) {
  const titleId = 'keyboard-shortcuts-help-title';

  const shortcuts: ShortcutItem[] = [
    { keys: 'Ctrl/Cmd + K', action: 'Open command palette' },
    { keys: 'D', action: 'Go to dashboard' },
    { keys: 'B', action: 'Go to bookings' },
    { keys: 'N', action: 'Open notifications panel' },
    {
      keys: 'S',
      action: isAdmin ? 'Go to admin settings' : 'Go to settings',
    },
    { keys: '?', action: 'Open keyboard shortcuts help' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <DialogHeader>
          <DialogTitle id={titleId}>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these quick keys when your cursor is not inside a text field.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between gap-2 rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2"
            >
              <span className="text-sm text-slate-700 dark:text-slate-200">{shortcut.action}</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {shortcut.keys}
              </Badge>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
