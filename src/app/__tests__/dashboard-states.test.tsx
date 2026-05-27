import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import DashboardLoading from "@/app/(dashboard)/loading";
import DashboardError from "@/app/(dashboard)/error";

describe("Dashboard loading.tsx", () => {
  it("is a valid React component with default export", () => {
    expect(typeof DashboardLoading).toBe("function");
  });

  it("renders skeleton structure with pulse animations", () => {
    const html = renderToString(<DashboardLoading />);
    expect(html).toContain("animate-pulse");
  });

  it("renders 4 stat card skeletons matching the dashboard grid", () => {
    const html = renderToString(<DashboardLoading />);
    const cardCount = (html.match(/bg-surface_container_high/g) || []).length;
    // Multiple skeleton elements per stat card (icon, value, label)
    expect(cardCount).toBeGreaterThanOrEqual(8);
  });

  it("renders bottom two-column card skeletons", () => {
    const html = renderToString(<DashboardLoading />);
    const grids = (html.match(/lg:grid-cols-2/g) || []).length;
    expect(grids).toBeGreaterThanOrEqual(1);
  });

  it("does not contain actual text content from dashboard page", () => {
    const html = renderToString(<DashboardLoading />);
    expect(html).not.toContain("Panel de Control");
    expect(html).not.toContain("Atletas Activos");
  });

  it("renders without throwing", () => {
    expect(() => renderToString(<DashboardLoading />)).not.toThrow();
  });
});

describe("Dashboard error.tsx", () => {
  const error = new Error("Simulated dashboard failure");
  const reset = () => {};

  it("is a valid React component with default export", () => {
    expect(typeof DashboardError).toBe("function");
  });

  it("renders error message in Spanish", () => {
    const html = renderToString(<DashboardError error={error} reset={reset} />);
    expect(html).toContain("Algo salió mal");
  });

  it("renders a Reintentar button", () => {
    const html = renderToString(<DashboardError error={error} reset={reset} />);
    expect(html).toContain("Reintentar");
  });

  it("accepts error with digest property", () => {
    const errWithDigest = new Error("db failure");
    (errWithDigest as Error & { digest: string }).digest = "abc123";
    const html = renderToString(<DashboardError error={errWithDigest} reset={reset} />);
    expect(html).toContain("Reintentar");
  });

  it("renders without throwing for any Error instance", () => {
    expect(() =>
      renderToString(<DashboardError error={error} reset={reset} />)
    ).not.toThrow();
  });
});
