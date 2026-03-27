'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TypedConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  keyword?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: (confirmationText: string) => Promise<void> | void;
}

export default function TypedConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  keyword = 'DELETE',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
  onConfirm,
}: TypedConfirmDialogProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!open) {
      setValue('');
    }
  }, [open]);

  const normalizedValue = value.trim().toUpperCase();
  const isValid = normalizedValue === keyword.toUpperCase();

  const handleConfirm = async () => {
    if (!isValid || isLoading) {
      return;
    }
    await onConfirm(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="typed-confirm-input">Type {keyword} to continue</Label>
          <Input
            id="typed-confirm-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={keyword}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={isLoading}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
