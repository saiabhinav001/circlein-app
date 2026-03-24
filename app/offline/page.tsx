export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <section className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <h1 className="text-2xl font-bold tracking-tight">You are offline</h1>
        <p className="mt-3 text-sm text-slate-300">
          CircleIn is running in offline mode. You can continue browsing cached pages and queued bookings will sync automatically when your connection is back.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-400">
          <li>- Check your network connection</li>
          <li>- Keep this tab open for automatic background sync</li>
          <li>- Retry booking once online</li>
        </ul>
      </section>
    </main>
  );
}
