import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

type DrawerProps = {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function Drawer({ children, onClose, open, title }: DrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="drawer-backdrop" role="presentation">
      <aside aria-label={title} className="drawer">
        <header className="drawer-header">
          <h2>{title}</h2>
          <Button
            aria-label="Close"
            className="icon-button"
            icon={<X size={16} />}
            onClick={onClose}
            variant="ghost"
          >
            Close
          </Button>
        </header>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}
