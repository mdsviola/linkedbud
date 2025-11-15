type LogoCloudProps = {
  logos: string[];
};

// LogoCloud shows the grid of client or partner names.
export function LogoCloud({ logos }: LogoCloudProps) {
  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-5">
      {logos.map((logo) => (
        <div
          key={logo}
          className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
        >
          {logo}
        </div>
      ))}
    </div>
  );
}

