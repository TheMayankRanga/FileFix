export function AdSlot() {
  if (process.env.NODE_ENV === "development") return null;
  return <aside className="ad-slot" aria-label="Advertisement" />;
}
