export function Footer() {
  return (
    <footer className="bg-secondary text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm">
        © {new Date().getFullYear()} DinkHub. All rights reserved.
      </div>
    </footer>
  );
}
