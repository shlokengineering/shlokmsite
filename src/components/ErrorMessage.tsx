export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
      {message}
    </div>
  );
}
