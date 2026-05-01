import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SevaCard from "../SevaCard";
import { Heart, Leaf, Shield } from "lucide-react";

describe("SevaCard - interaction tests", () => {
  it("renders image with correct alt text", () => {
    render(<SevaCard title="Feed" subtitle="sub" icon={Heart} image="/cow.jpg" />);
    const img = screen.getByAltText("Feed");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toBe("/cow.jpg");
  });

  it("renders different icons correctly", () => {
    const { rerender } = render(<SevaCard title="A" subtitle="s" icon={Leaf} image="/a.jpg" />);
    expect(screen.getByText("A")).toBeInTheDocument();
    rerender(<SevaCard title="B" subtitle="s" icon={Shield} image="/b.jpg" />);
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("does not crash without onClick", () => {
    expect(() => {
      render(<SevaCard title="Test" subtitle="sub" icon={Heart} image="/t.jpg" />);
    }).not.toThrow();
  });

  it("shows large price values formatted", () => {
    render(<SevaCard title="T" subtitle="s" icon={Heart} image="/t.jpg" startingPrice={10000} />);
    expect(screen.getByText("From ₹10000")).toBeInTheDocument();
  });
});
