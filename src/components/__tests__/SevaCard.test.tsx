import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SevaCard from "../SevaCard";
import { Heart } from "lucide-react";

describe("SevaCard", () => {
  const baseProps = {
    title: "Feed a Cow",
    subtitle: "Daily feeding",
    icon: Heart,
    image: "/test.jpg",
  };

  it("renders title and subtitle", () => {
    render(<SevaCard {...baseProps} />);
    expect(screen.getByText("Feed a Cow")).toBeInTheDocument();
    expect(screen.getByText("Daily feeding")).toBeInTheDocument();
  });

  it("shows price badge when startingPrice provided", () => {
    render(<SevaCard {...baseProps} startingPrice={51} />);
    expect(screen.getByText("From ₹51")).toBeInTheDocument();
  });

  it("hides price badge when startingPrice is undefined", () => {
    render(<SevaCard {...baseProps} />);
    expect(screen.queryByText(/From ₹/)).not.toBeInTheDocument();
  });

  it("fires onClick when tapped", () => {
    const onClick = vi.fn();
    render(<SevaCard {...baseProps} onClick={onClick} />);
    fireEvent.click(screen.getByAltText("Feed a Cow"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
