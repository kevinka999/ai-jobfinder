type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="rounded-panel border border-danger-300 bg-danger-50 px-panel py-panel text-danger-700">
      {message}
    </div>
  );
}
