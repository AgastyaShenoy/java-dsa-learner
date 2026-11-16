export function AppSkeleton({ error }: { error?: string }) {
  return (
    <div className="min-h-screen bg-paper-0 flex flex-col">
      <div className="h-14 border-b-[1.5px] border-line" />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 space-y-6">
        {error ? (
          <div className="space-y-2">
            <p className="font-display font-bold text-xl text-ink-orange">Couldn&apos;t open the local database.</p>
            <p className="text-ink-2">{error}</p>
            <button className="btn mt-4" onClick={() => location.reload()}>Reload</button>
          </div>
        ) : (
          <>
            <div className="h-20 w-72 bg-paper-2 animate-pulse" />
            <div className="h-12 w-full max-w-xl bg-paper-2 animate-pulse" />
            <div className="h-5 w-80 bg-paper-2 animate-pulse" />
            <div className="h-12 w-60 bg-paper-2 animate-pulse" />
          </>
        )}
      </main>
    </div>
  );
}
