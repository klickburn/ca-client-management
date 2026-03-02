import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * ConfirmDialog - Replaces native confirm() and prompt() calls.
 *
 * Props:
 * - open / onOpenChange: controlled dialog state
 * - title: dialog title
 * - description: dialog description
 * - confirmLabel: button text (default "Confirm")
 * - variant: "destructive" | "default" (default "destructive")
 * - onConfirm: called with inputValue (if prompt) or no args
 * - prompt: if true, shows an input field
 * - promptLabel: label for the input field
 * - promptPlaceholder: placeholder for the input field
 */
export function ConfirmDialog({
  open, onOpenChange, title, description,
  confirmLabel = 'Confirm', variant = 'destructive',
  onConfirm, prompt: isPrompt, promptLabel, promptPlaceholder,
}) {
  const [inputValue, setInputValue] = useState('');

  const handleConfirm = () => {
    if (isPrompt) {
      onConfirm(inputValue);
      setInputValue('');
    } else {
      onConfirm();
    }
    onOpenChange(false);
  };

  const handleOpenChange = (v) => {
    if (!v) setInputValue('');
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {isPrompt && (
          <div className="space-y-2">
            {promptLabel && <Label>{promptLabel}</Label>}
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={promptPlaceholder || ''}
              autoFocus
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button
            variant={variant}
            size="sm"
            onClick={handleConfirm}
            disabled={isPrompt && !inputValue.trim()}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
