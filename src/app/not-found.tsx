import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-7xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-2xl font-semibold">Page introuvable</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
