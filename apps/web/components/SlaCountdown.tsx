import { formatDaysToDeadline, urgencyClassName, urgencyLevel } from "@/lib/sla-urgency";

type Props = {
  days: number | null;
  className?: string;
};

export default function SlaCountdown({ days, className = "" }: Props) {
  const level = urgencyLevel(days);
  return (
    <span className={`font-mono tabular-nums ${urgencyClassName(level)} ${className}`.trim()}>
      {formatDaysToDeadline(days)}
    </span>
  );
}
