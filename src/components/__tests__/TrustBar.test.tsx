import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TrustBar from "../TrustBar";

describe("TrustBar", () => {
  it("renders three trust badges", () => {
    render(<TrustBar />);
    expect(screen.getByText("80G Tax Receipt")).toBeInTheDocument();
    expect(screen.getByText("100% to Charity")).toBeInTheDocument();
    expect(screen.getByText("Verified Foundation")).toBeInTheDocument();
  });
});
