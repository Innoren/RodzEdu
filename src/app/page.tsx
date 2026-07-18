export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center gap-4 text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-zinc-500 uppercase">
          RodzEdu
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Ready for development
        </h1>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Local IDE and Cursor Cloud Agent environment are configured. Start the
          app with <code className="font-mono text-sm">npm run dev</code>.
        </p>
      </main>
    </div>
  );
}
