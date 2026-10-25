export default function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">{title}</h1>
      <div className="glass-card rounded-2xl p-6 text-sm text-slate-600 leading-relaxed flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}
