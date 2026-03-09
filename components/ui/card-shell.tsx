import React from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function CardShell({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-dash-condensed font-bold text-[15px] uppercase tracking-wider text-[var(--dash-text)]">{title}</h3>
          {subtitle ? (
            <p className="mt-1 font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-wider">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
