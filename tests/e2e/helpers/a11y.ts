import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    // Color contrast depends on runtime theme tokens and is validated separately.
    .disableRules(["color-contrast"])
    .analyze();

  const violationMessages = results.violations.map((violation) => {
    const nodes = violation.nodes
      .map((node) => `- ${node.target.join(" ")}`)
      .join("\n");
    return `${violation.id}: ${violation.help}\n${nodes}`;
  });

  expect(
    results.violations,
    `Accessibility violations found:\n${violationMessages.join("\n\n")}`
  ).toEqual([]);
}
