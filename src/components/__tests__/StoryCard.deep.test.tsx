import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StoryCard from "../StoryCard";

describe("StoryCard - deep tests", () => {
  it("formats amount with Indian locale", () => {
    render(<StoryCard donorName="A" amount={100000} orderId="abcdefgh-1234" />);
    expect(screen.getByText("₹1,00,000")).toBeInTheDocument();
  });

  it("renders tracking link with first 8 chars of orderId", () => {
    render(<StoryCard donorName="A" amount={100} orderId="abcdefgh-1234-5678" />);
    expect(screen.getByText(/abcdefgh/)).toBeInTheDocument();
  });

  it("renders share your impact heading", () => {
    render(<StoryCard donorName="Test" amount={100} orderId="12345678" />);
    expect(screen.getByText("Share Your Impact")).toBeInTheDocument();
  });

  it("renders foundation branding", () => {
    render(<StoryCard donorName="Test" amount={100} orderId="12345678" />);
    expect(screen.getByText(/DHYAN FOUNDATION/)).toBeInTheDocument();
  });

  it("renders GAU SEVA COMPLETE badge", () => {
    render(<StoryCard donorName="Test" amount={100} orderId="12345678" />);
    expect(screen.getByText(/GAU SEVA COMPLETE/)).toBeInTheDocument();
  });
});
