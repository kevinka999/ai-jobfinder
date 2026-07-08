type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return <div className="error-line">{message}</div>;
}
