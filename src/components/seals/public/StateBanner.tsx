import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

type Variant = "success" | "danger" | "neutral";

const styles: Record<Variant, { bg: string; icon: typeof CheckCircle2 }> = {
  success: { bg: "#1F7A5C", icon: CheckCircle2 },
  danger: { bg: "#B83A3A", icon: XCircle },
  neutral: { bg: "#4B5563", icon: AlertCircle },
};

interface Props {
  variant: Variant;
  title: string;
  subtitle?: string;
}

export function StateBanner({ variant, title, subtitle }: Props) {
  const s = styles[variant];
  const Icon = s.icon;
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-md p-5 sm:p-6 text-white flex items-start gap-4"
      style={{ backgroundColor: s.bg }}
    >
      <Icon className="h-7 w-7 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <div className="text-lg sm:text-xl font-semibold tracking-wide uppercase">{title}</div>
        {subtitle && <div className="text-sm sm:text-base opacity-90 mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}
