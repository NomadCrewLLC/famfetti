import Link from 'next/link';

export default function WelcomePage() {
  return (
    <main className="flex min-h-screen flex-col justify-between bg-background px-four pb-six pt-six text-text">
      <div className="mt-six flex flex-col gap-three text-center">
        <h1 className="text-3xl font-bold">Famfetti</h1>
        <p className="text-text-secondary">
          Create a family to get started, or join one with an invite code.
        </p>
      </div>

      <div className="flex flex-col gap-three">
        <Link
          href="/create-family"
          className="rounded-two bg-text py-three text-center font-semibold text-background"
        >
          Create a family
        </Link>
        <Link
          href="/join-family"
          className="rounded-two border border-background-selected py-three text-center font-semibold text-text"
        >
          Join with invite code
        </Link>
      </div>
    </main>
  );
}
