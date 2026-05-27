declare module "jest-axe" {
  export function axe(
    html: Element | DocumentFragment | string,
  ): Promise<import("axe-core").AxeResults>;

  export const toHaveNoViolations: {
    toHaveNoViolations(): { pass: boolean; message(): string };
  };
}
