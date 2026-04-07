export default function MainLoading() {
  return (
    <div className="space-y-4 py-3 lg:py-5 px-4 animate-in fade-in duration-150">
      <div className="relative rounded-3xl bg-muted h-[190px] md:h-[215px] overflow-hidden">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/80 to-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-5 w-44 rounded-md bg-muted animate-pulse" />
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
