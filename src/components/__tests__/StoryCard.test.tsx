import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StoryCard from "../StoryCard";

describe("StoryCard", () => {
  const baseProps = {
    donorName: "Ramesh",
    amount: 5000,
    orderId: "abc12345-defg",
  };

  it("renders donor name and amount", () => {
    render(<StoryCard {...baseProps} />);
    expect(screen.getByText("by Ramesh")).toBeInTheDocument();
    expect(screen.getByText("₹5,000")).toBeInTheDocument();
  });

  it("shows Save Story and Instagram Story buttons", () => {
    render(<StoryCard {...baseProps} />);
    expect(screen.getByText("Save Story")).toBeInTheDocument();
    expect(screen.getByText("Instagram Story")).toBeInTheDocument();
  });

  it("shows gaushala name when provided", () => {
    render(<StoryCard {...baseProps} gaushalaName="Delhi Gaushala" />);
    expect(screen.getByText("📍 Delhi Gaushala")).toBeInTheDocument();
  });

  it("hides gaushala line when gaushalaName is undefined", () => {
    render(<StoryCard {...baseProps} />);
    expect(screen.queryByText(/📍/)).not.toBeInTheDocument();
  });
});
