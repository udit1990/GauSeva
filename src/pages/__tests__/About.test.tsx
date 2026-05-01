import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { enabled: false } }),
        }),
      }),
    }),
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null }),
}));

// Mock image imports
vi.mock("@/assets/guruji-portrait.avif", () => ({ default: "/mock.jpg" }));
vi.mock("@/assets/karma-binding.avif", () => ({ default: "/mock.jpg" }));
vi.mock("@/assets/bsf-rescue-1.avif", () => ({ default: "/mock.jpg" }));

import About from "../About";

describe("About", () => {
  it("renders Gau Parivar stats grid with 6 items", () => {
    render(<About />);
    expect(screen.getByText("70,000+")).toBeInTheDocument();
    expect(screen.getByText("45+")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("10,000+")).toBeInTheDocument();
    expect(screen.getByText("20+")).toBeInTheDocument();
    expect(screen.getByText("50,000+")).toBeInTheDocument();
  });

  it("renders BSF Rescues card", () => {
    render(<About />);
    expect(screen.getByText("50,000+ Animals Saved at Borders")).toBeInTheDocument();
  });

  it("renders Service & Charity card", () => {
    render(<About />);
    expect(screen.getByText("Service & Charity Initiatives")).toBeInTheDocument();
  });

  it("renders page title", () => {
    render(<About />);
    expect(screen.getByText("About Dhyan Foundation")).toBeInTheDocument();
  });
});
