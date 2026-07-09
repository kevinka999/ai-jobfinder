type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = 'Loading' }: LoadingStateProps) {
  return (
    <div className="rounded-panel border border-dashed border-app-border px-panel py-panel text-app-text-muted">
      {label}
    </div>
  );
}
