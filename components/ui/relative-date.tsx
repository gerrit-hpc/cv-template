export function RelativeDate({ date }: { date: Date }) {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60_000);
  const hr = Math.floor(diff / 3_600_000);
  const day = Math.floor(diff / 86_400_000);
  let label: string;
  if (min < 1) label = "just now";
  else if (min < 60) label = `${min} minute${min === 1 ? "" : "s"} ago`;
  else if (hr < 24) label = `${hr} hour${hr === 1 ? "" : "s"} ago`;
  else label = `${day} day${day === 1 ? "" : "s"} ago`;
  return (
    <time dateTime={date.toISOString()} className="text-small text-text-secondary">
      {label}
    </time>
  );
}
