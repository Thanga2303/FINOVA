import { Link } from "react-router-dom";
import { Page } from "../components/ui";

export default function NotFound() {
  return (
    <Page>
      <div className="min-h-[50vh] grid place-items-center text-center">
        <div>
          <h1 className="font-display text-7xl font-bold text-gradient">404</h1>
          <p className="mt-3 text-muted">This page doesn't exist. Let's get you back to learning.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/" className="btn-primary">Home</Link>
            <Link to="/learn" className="btn-ghost">All lessons</Link>
          </div>
        </div>
      </div>
    </Page>
  );
}
