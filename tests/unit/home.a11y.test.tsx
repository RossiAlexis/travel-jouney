import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter } from "react-router";
import Home from "~/routes/home";

describe("home screen", () => {
  it("renders core actions for anonymous users", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /Document Your\s*Adventures/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Log in/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Create Free Account/i })
    ).toBeInTheDocument();
  });

  it("has no automatically-detectable accessibility violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
