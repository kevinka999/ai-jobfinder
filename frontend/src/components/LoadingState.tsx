type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = 'Loading' }: LoadingStateProps) {
  return <div className="state-line">{label}</div>;
}
