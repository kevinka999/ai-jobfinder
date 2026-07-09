import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Button } from './Button';

type DrawerProps = {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function Drawer({ children, onClose, open, title }: DrawerProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-20 flex justify-end bg-app-text/25"
      role="presentation"
    >
      <aside
        aria-label={title}
        className="grid w-[min(680px,100vw)] grid-rows-[auto_1fr] bg-app-surface shadow-drawer"
      >
        <header className="flex items-center justify-between border-b border-app-border px-panel py-3.5">
          <h2 className="m-0 text-lg font-bold text-app-text">{title}</h2>
          <Button
            aria-label="Close"
            icon={<X size={16} />}
            onClick={onClose}
            variant="ghost"
          />
        </header>
        <div className="overflow-y-auto p-panel">{children}</div>
      </aside>
    </div>
  );
}
