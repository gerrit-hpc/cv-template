# KB Web App — Phase 2: Design System + Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the design system from `design/DESIGN.md` (colors, typography, spacing) as a Tailwind theme; build the primitive components (Button, Input, Textarea, Card, Tag, StatusBadge, EmptyState, InfoBanner, ConfirmModal, RelativeDate); build the form-field wrappers; build the shell (left rail, header, layout); build the login page. After Phase 2 every route renders the shell with the design system applied.

**Architecture:** Tailwind theme tokens map 1:1 to the `design/DESIGN.md` palette / typography / spacing values. Components live in `components/{ui,forms,navigation,sections}/`. The shell uses React Server Components by default; only interactive primitives ("use client") are client components. Login page is a client form posting to a Server Action.

**Tech Stack:** Tailwind CSS 3.4+, `next/font` (Geist + Geist Mono), `class-variance-authority` (CVA) for component variants, `clsx` for conditional classes.

**Spec reference:** §1 (stack), §4 (route map for login + bootstrap), §5 (login behavior when auth not configured), `design/DESIGN.md` (full token set), `design/ui-design-spec.md` (component inventory + shell layout).

---

## File structure (delivered by end of Phase 2)

```
tailwind.config.ts
postcss.config.mjs
app/
  globals.css                     # Tailwind directives + base styles
  layout.tsx                      # updated: applies fonts, body bg, AppShell
  page.tsx                        # updated: bootstrap redirect
  login/
    page.tsx
    actions.ts                    # signIn Server Action

components/
  ui/
    button.tsx
    input.tsx
    textarea.tsx
    select.tsx
    checkbox.tsx
    card.tsx
    tag.tsx
    status-badge.tsx
    empty-state.tsx
    info-banner.tsx
    confirm-modal.tsx
    relative-date.tsx
  forms/
    form-field.tsx
    form-textarea.tsx
    form-select.tsx
    form-number.tsx
    form-checkbox.tsx
    form-date.tsx
    date-input.tsx
  navigation/
    left-rail.tsx
    header.tsx
    back-link.tsx
  sections/
    section-header.tsx
  shell/
    app-shell.tsx

lib/
  fonts.ts                        # Geist + Geist Mono loaders
  cn.ts                           # clsx helper

tests/unit/components/
  button.test.tsx
  input.test.tsx
  ... (one per component)
```

---

## Task 1: Install styling dependencies

- [ ] **Step 1: Install Tailwind + tooling**

```bash
npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss
npm install clsx class-variance-authority tailwind-merge
```

- [ ] **Step 2: Install testing-library**

```bash
npm install -D @testing-library/react @testing-library/dom jsdom
```

- [ ] **Step 3: Install Geist via next/font**

```bash
npm install geist
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "phase 2: install Tailwind + testing-library + Geist"
```

---

## Task 2: Configure Vitest for React component tests

- [ ] **Step 1: Update `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: false,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: { provider: "v8", reporter: ["text", "html"], include: ["server/**", "lib/**", "components/**"] },
  },
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
});
```

- [ ] **Step 2: Install `@vitejs/plugin-react`**

```bash
npm install -D @vitejs/plugin-react
```

- [ ] **Step 3: Update `tests/setup.ts` to import testing-library cleanup**

```ts
import "@testing-library/dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 4: Run existing tests to verify no regression**

```bash
docker run --rm -d --name kb-pg-tmp -e POSTGRES_PASSWORD=kb -e POSTGRES_USER=kb -e POSTGRES_DB=kb -p 5432:5432 postgres:16
sleep 3
export DATABASE_URL="postgresql://kb:kb@localhost:5432/kb"
npx prisma migrate deploy
npm test
docker stop kb-pg-tmp
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts tests/setup.ts package.json package-lock.json
git commit -m "phase 2: configure Vitest for React component tests"
```

---

## Task 3: Tailwind theme from DESIGN.md tokens

- [ ] **Step 1: Create `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      black: "#000000",
      white: "#FFFFFF",
      bg: "#0C0E12",
      surface: "#14161B",
      "surface-raised": "#1C1F27",
      "surface-overlay": "#242833",
      text: "#E8E9EC",
      "text-secondary": "#9BA3AF",
      "text-tertiary": "#6B7280",
      border: "#2A2E38",
      "border-subtle": "#1E2128",
      accent: "#5B8DEF",
      "accent-hover": "#7AA4F2",
      "accent-muted": "#2A3A5C",
      success: "#4ADE80",
      "success-muted": "#1A3A2A",
      warning: "#FBBF24",
      "warning-muted": "#3A3010",
      danger: "#F87171",
      "danger-muted": "#3A1A1A",
      "status-draft": "#6B7280",
      "status-applied": "#5B8DEF",
      "status-interviewing": "#A78BFA",
      "status-interviewing-muted": "#3A305C",
      "status-offer": "#4ADE80",
      "status-closed": "#F87171",
    },
    fontFamily: {
      sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
    },
    fontSize: {
      caption: ["11px", { lineHeight: "1.4" }],
      label: ["12px", { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "500" }],
      small: ["13px", { lineHeight: "1.5" }],
      body: ["14px", { lineHeight: "1.5" }],
      subheading: ["16px", { lineHeight: "1.4", fontWeight: "500" }],
      heading: ["20px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
      display: ["28px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
    },
    borderRadius: { none: "0", sm: "4px", md: "6px", lg: "8px", xl: "12px", full: "9999px" },
    spacing: {
      0: "0",
      px: "1px",
      xs: "4px",
      sm: "8px",
      md: "12px",
      lg: "16px",
      xl: "24px",
      "2xl": "32px",
      "3xl": "48px",
      // Numeric scale for arbitrary use
      ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [i, `${i * 4}px`])),
    },
    extend: {
      ringWidth: { "2": "2px" },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Create `postcss.config.mjs`**

```js
export default {
  plugins: { "@tailwindcss/postcss": {} },
};
```

- [ ] **Step 3: Create `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body {
    background-color: #0C0E12;
    color: #E8E9EC;
    font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }
  *, *::before, *::after {
    border-color: #2A2E38;
  }
  *:focus-visible {
    outline: 2px solid #2A3A5C;
    outline-offset: 2px;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts postcss.config.mjs app/globals.css
git commit -m "phase 2: configure Tailwind theme from DESIGN.md tokens"
```

---

## Task 4: Geist fonts via next/font

- [ ] **Step 1: Create `lib/fonts.ts`**

```ts
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const geistSans = GeistSans;
export const geistMono = GeistMono;
```

- [ ] **Step 2: Update `app/layout.tsx`**

```tsx
import "@/app/globals.css";
import type { ReactNode } from "react";
import { geistSans, geistMono } from "@/lib/fonts";

export const metadata = { title: "KB" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Boot dev server and verify**

```bash
npm run dev
```

Open `http://localhost:3000`. Confirm the page renders in Geist (DevTools → computed font-family contains `Geist`). Stop server.

- [ ] **Step 4: Commit**

```bash
git add lib/fonts.ts app/layout.tsx
git commit -m "phase 2: load Geist fonts and apply globals"
```

---

## Task 5: `cn` helper

- [ ] **Step 1: Write the test**

Create `tests/unit/lib/cn.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("drops falsy", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
  it("merges tailwind conflicts (later wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/lib/cn.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `lib/cn.ts`**

```ts
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/lib/cn.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/cn.ts tests/unit/lib/cn.test.ts
git commit -m "phase 2: add cn helper (clsx + tailwind-merge)"
```

---

## Task 6: Button component

- [ ] **Step 1: Write the test**

Create `tests/unit/components/button.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeDefined();
  });
  it("applies the primary variant by default", () => {
    render(<Button>X</Button>);
    expect(screen.getByRole("button").className).toContain("bg-accent");
  });
  it("applies the secondary variant", () => {
    render(<Button variant="secondary">X</Button>);
    expect(screen.getByRole("button").className).toContain("bg-surface-raised");
  });
  it("applies the ghost variant", () => {
    render(<Button variant="ghost">X</Button>);
    expect(screen.getByRole("button").className).toContain("bg-transparent");
  });
  it("forwards type and disabled props", () => {
    render(<Button type="submit" disabled>X</Button>);
    const btn = screen.getByRole("button") as HTMLButtonElement;
    expect(btn.type).toBe("submit");
    expect(btn.disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/button.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/ui/button.tsx`**

```tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-small font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-accent text-bg hover:bg-accent-hover",
        secondary: "bg-surface-raised text-text border border-border hover:bg-surface-overlay",
        ghost: "bg-transparent text-text-secondary hover:text-text hover:bg-surface-raised",
      },
      size: {
        md: "h-8 px-md",
        sm: "h-6 px-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>;

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant, size, ...props },
  ref,
) {
  return <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />;
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/button.test.tsx
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/button.tsx tests/unit/components/button.test.tsx
git commit -m "phase 2: add Button component (primary/secondary/ghost variants)"
```

---

## Task 7: Input component

- [ ] **Step 1: Write the test**

Create `tests/unit/components/input.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders with placeholder", () => {
    render(<Input placeholder="email" />);
    expect(screen.getByPlaceholderText("email")).toBeDefined();
  });
  it("applies error styling when invalid prop is set", () => {
    render(<Input aria-invalid="true" />);
    expect(screen.getByRole("textbox").className).toContain("border-danger");
  });
  it("forwards type and value", () => {
    render(<Input type="email" defaultValue="x@y.z" />);
    const el = screen.getByRole("textbox") as HTMLInputElement;
    expect(el.type).toBe("email");
    expect(el.value).toBe("x@y.z");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/input.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/ui/input.tsx`**

```tsx
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "block w-full h-8 px-md rounded-md bg-surface-raised text-text border border-border",
        "placeholder:text-text-tertiary",
        "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-muted",
        "aria-[invalid=true]:border-danger",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/input.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/input.tsx tests/unit/components/input.test.tsx
git commit -m "phase 2: add Input component"
```

---

## Task 8: Textarea component

- [ ] **Step 1: Write the test**

Create `tests/unit/components/textarea.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Textarea } from "@/components/ui/textarea";

describe("Textarea", () => {
  it("renders with rows prop", () => {
    render(<Textarea rows={6} aria-label="t" />);
    expect((screen.getByLabelText("t") as HTMLTextAreaElement).rows).toBe(6);
  });
  it("applies error styling when invalid", () => {
    render(<Textarea aria-invalid="true" aria-label="t" />);
    expect(screen.getByLabelText("t").className).toContain("border-danger");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/textarea.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/ui/textarea.tsx`**

```tsx
import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "block w-full px-md py-sm rounded-md bg-surface-raised text-text border border-border resize-y",
        "placeholder:text-text-tertiary",
        "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-muted",
        "aria-[invalid=true]:border-danger",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/textarea.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/textarea.tsx tests/unit/components/textarea.test.tsx
git commit -m "phase 2: add Textarea component"
```

---

## Task 9: Select component

- [ ] **Step 1: Write the test**

Create `tests/unit/components/select.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Select } from "@/components/ui/select";

describe("Select", () => {
  it("renders options", () => {
    render(
      <Select aria-label="s">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );
    expect((screen.getByLabelText("s") as HTMLSelectElement).options.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/select.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/ui/select.tsx`**

```tsx
import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "block w-full h-8 px-md rounded-md bg-surface-raised text-text border border-border",
        "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-muted",
        "aria-[invalid=true]:border-danger",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/select.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/select.tsx tests/unit/components/select.test.tsx
git commit -m "phase 2: add Select component"
```

---

## Task 10: Checkbox component

- [ ] **Step 1: Write the test**

Create `tests/unit/components/checkbox.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Checkbox } from "@/components/ui/checkbox";

describe("Checkbox", () => {
  it("renders an unchecked checkbox by default", () => {
    render(<Checkbox aria-label="c" />);
    expect((screen.getByLabelText("c") as HTMLInputElement).checked).toBe(false);
  });
  it("respects defaultChecked", () => {
    render(<Checkbox aria-label="c" defaultChecked />);
    expect((screen.getByLabelText("c") as HTMLInputElement).checked).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/checkbox.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/ui/checkbox.tsx`**

```tsx
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded-sm bg-surface-raised border border-border accent-accent",
        "focus:outline-none focus:ring-2 focus:ring-accent-muted",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/checkbox.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/checkbox.tsx tests/unit/components/checkbox.test.tsx
git commit -m "phase 2: add Checkbox component"
```

---

## Task 11: Card component

- [ ] **Step 1: Write the test**

Create `tests/unit/components/card.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

describe("Card", () => {
  it("renders children with card styling", () => {
    render(<Card data-testid="c">x</Card>);
    expect(screen.getByTestId("c").className).toContain("bg-surface");
  });
  it("CardHeader renders title and actions", () => {
    render(
      <CardHeader title="Hello" actions={<button>Save</button>} />,
    );
    expect(screen.getByText("Hello")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
  });
  it("CardBody renders children", () => {
    render(<CardBody data-testid="b">y</CardBody>);
    expect(screen.getByTestId("b").textContent).toBe("y");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/card.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/ui/card.tsx`**

```tsx
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-surface rounded-lg border border-border", className)} {...props} />;
}

export function CardHeader({
  title,
  actions,
  className,
}: {
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-lg py-md border-b border-border-subtle",
        className,
      )}
    >
      <h3 className="text-subheading">{title}</h3>
      {actions ? <div className="flex items-center gap-sm">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-lg", className)} {...props} />;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/card.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/card.tsx tests/unit/components/card.test.tsx
git commit -m "phase 2: add Card + CardHeader + CardBody"
```

---

## Task 12: Tag pill component

- [ ] **Step 1: Write the test**

Create `tests/unit/components/tag.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tag } from "@/components/ui/tag";

describe("Tag", () => {
  it("renders label", () => {
    render(<Tag>leadership</Tag>);
    expect(screen.getByText("leadership")).toBeDefined();
  });
  it("applies pill styling", () => {
    render(<Tag>x</Tag>);
    expect(screen.getByText("x").className).toContain("rounded-full");
  });
  it("renders a remove button when onRemove provided", () => {
    render(<Tag onRemove={() => {}}>x</Tag>);
    expect(screen.getByRole("button", { name: /remove/i })).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/tag.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/ui/tag.tsx`**

```tsx
"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Tag({
  children,
  onRemove,
  className,
}: {
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-xs bg-accent-muted text-accent rounded-full px-md text-label",
        className,
      )}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label={`remove ${typeof children === "string" ? children : "tag"}`}
          onClick={onRemove}
          className="text-text-secondary hover:text-text"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/tag.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/tag.tsx tests/unit/components/tag.test.tsx
git commit -m "phase 2: add Tag pill component"
```

---

## Task 13: StatusBadge component

- [ ] **Step 1: Write the test**

Create `tests/unit/components/status-badge.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/ui/status-badge";

describe("StatusBadge", () => {
  it("renders status text", () => {
    render(<StatusBadge status="applied" />);
    expect(screen.getByText(/applied/i)).toBeDefined();
  });
  it("renders a colored dot", () => {
    render(<StatusBadge status="offer" />);
    const dot = screen.getByLabelText("offer status indicator");
    expect(dot.className).toContain("bg-status-offer");
  });
  it("uses correct background for each status", () => {
    const { rerender } = render(<StatusBadge status="drafting" />);
    expect(screen.getByText(/drafting/i).className).toContain("text-status-draft");
    rerender(<StatusBadge status="closed" />);
    expect(screen.getByText(/closed/i).className).toContain("text-status-closed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/status-badge.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/ui/status-badge.tsx`**

```tsx
import { cn } from "@/lib/cn";

export type ApplicationStatus = "drafting" | "applied" | "interviewing" | "offer" | "closed";

const STATUS_STYLES: Record<ApplicationStatus, { dot: string; text: string; bg: string; label: string }> = {
  drafting: { dot: "bg-status-draft", text: "text-status-draft", bg: "bg-border", label: "Drafting" },
  applied: { dot: "bg-status-applied", text: "text-status-applied", bg: "bg-accent-muted", label: "Applied" },
  interviewing: {
    dot: "bg-status-interviewing",
    text: "text-status-interviewing",
    bg: "bg-status-interviewing-muted",
    label: "Interviewing",
  },
  offer: { dot: "bg-status-offer", text: "text-status-offer", bg: "bg-success-muted", label: "Offer" },
  closed: { dot: "bg-status-closed", text: "text-status-closed", bg: "bg-danger-muted", label: "Closed" },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-xs px-md rounded-full text-label",
        s.bg,
        s.text,
      )}
    >
      <span
        aria-label={`${status} status indicator`}
        className={cn("inline-block h-2 w-2 rounded-full", s.dot)}
      />
      {s.label}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/status-badge.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/status-badge.tsx tests/unit/components/status-badge.test.tsx
git commit -m "phase 2: add StatusBadge component"
```

---

## Task 14: EmptyState component

- [ ] **Step 1: Write the test**

Create `tests/unit/components/empty-state.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/empty-state";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="No items" description="Add one." />);
    expect(screen.getByText("No items")).toBeDefined();
    expect(screen.getByText("Add one.")).toBeDefined();
  });
  it("renders actions when provided", () => {
    render(<EmptyState title="x" actions={<button>Add</button>} />);
    expect(screen.getByRole("button", { name: "Add" })).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/empty-state.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/ui/empty-state.tsx`**

```tsx
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-md py-3xl text-center">
      <p className="text-subheading text-text">{title}</p>
      {description ? <p className="text-body text-text-secondary max-w-md">{description}</p> : null}
      {actions ? <div className="flex items-center gap-md mt-md">{actions}</div> : null}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/empty-state.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/empty-state.tsx tests/unit/components/empty-state.test.tsx
git commit -m "phase 2: add EmptyState component"
```

---

## Task 15: InfoBanner component

- [ ] **Step 1: Write the test**

Create `tests/unit/components/info-banner.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InfoBanner } from "@/components/ui/info-banner";

describe("InfoBanner", () => {
  it("renders children", () => {
    render(<InfoBanner>Hello</InfoBanner>);
    expect(screen.getByText("Hello")).toBeDefined();
  });
  it("dismisses when dismissible and × clicked", () => {
    render(<InfoBanner dismissible>Hello</InfoBanner>);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByText("Hello")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/info-banner.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/ui/info-banner.tsx`**

```tsx
"use client";
import { useState, type ReactNode } from "react";

export function InfoBanner({ children, dismissible }: { children: ReactNode; dismissible?: boolean }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="flex items-start justify-between gap-md p-md rounded-md bg-accent-muted/40 border border-accent-muted text-body">
      <div>{children}</div>
      {dismissible ? (
        <button
          type="button"
          aria-label="dismiss"
          onClick={() => setVisible(false)}
          className="text-text-secondary hover:text-text"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/info-banner.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/info-banner.tsx tests/unit/components/info-banner.test.tsx
git commit -m "phase 2: add InfoBanner component"
```

---

## Task 16: ConfirmModal component

- [ ] **Step 1: Write the test**

Create `tests/unit/components/confirm-modal.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

describe("ConfirmModal", () => {
  it("requires typing the confirm word", () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal open title="Wipe" confirmWord="DELETE" onConfirm={onConfirm} onClose={() => {}} />);
    const confirmBtn = screen.getByRole("button", { name: /confirm/i }) as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/type DELETE/i), { target: { value: "DELETE" } });
    expect(confirmBtn.disabled).toBe(false);
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
  it("returns null when closed", () => {
    render(<ConfirmModal open={false} title="x" confirmWord="X" onConfirm={() => {}} onClose={() => {}} />);
    expect(screen.queryByText("x")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/confirm-modal.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/ui/confirm-modal.tsx`**

```tsx
"use client";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ConfirmModal({
  open,
  title,
  description,
  confirmWord,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmWord: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  if (!open) return null;
  const canConfirm = typed === confirmWord;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70" role="dialog" aria-modal="true">
      <div className="w-[420px] bg-surface rounded-lg border border-border p-lg flex flex-col gap-md">
        <h2 className="text-heading text-danger">{title}</h2>
        {description ? <div className="text-body text-text-secondary">{description}</div> : null}
        <label className="flex flex-col gap-xs text-label text-text-secondary">
          <span>Type {confirmWord} to confirm</span>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} aria-label={`type ${confirmWord}`} />
        </label>
        <div className="flex items-center justify-end gap-sm">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} disabled={!canConfirm}>Confirm</Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/confirm-modal.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/confirm-modal.tsx tests/unit/components/confirm-modal.test.tsx
git commit -m "phase 2: add ConfirmModal component"
```

---

## Task 17: RelativeDate component

- [ ] **Step 1: Write the test**

Create `tests/unit/components/relative-date.test.tsx`:

```tsx
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RelativeDate } from "@/components/ui/relative-date";

describe("RelativeDate", () => {
  beforeAll(() => vi.useFakeTimers({ now: new Date("2026-05-15T12:00:00Z") }));
  afterAll(() => vi.useRealTimers());

  it("renders 'just now' for <1 minute ago", () => {
    render(<RelativeDate date={new Date("2026-05-15T11:59:30Z")} />);
    expect(screen.getByText(/just now/i)).toBeDefined();
  });
  it("renders minutes ago", () => {
    render(<RelativeDate date={new Date("2026-05-15T11:55:00Z")} />);
    expect(screen.getByText(/5 minutes ago/i)).toBeDefined();
  });
  it("renders hours ago", () => {
    render(<RelativeDate date={new Date("2026-05-15T09:00:00Z")} />);
    expect(screen.getByText(/3 hours ago/i)).toBeDefined();
  });
  it("renders days ago for ≥1 day", () => {
    render(<RelativeDate date={new Date("2026-05-12T12:00:00Z")} />);
    expect(screen.getByText(/3 days ago/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/relative-date.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/ui/relative-date.tsx`**

```tsx
export function RelativeDate({ date }: { date: Date }) {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60_000);
  const hr = Math.floor(diff / 3_600_000);
  const day = Math.floor(diff / 86_400_000);
  let label: string;
  if (min < 1) label = "just now";
  else if (min < 60) label = `${min} minute${min === 1 ? "" : "s"} ago`;
  else if (hr < 24) label = `${hr} hour${hr === 1 ? "" : "s"} ago`;
  else label = `${day} day${day === 1 ? "" : "s"} ago`;
  return (
    <time dateTime={date.toISOString()} className="text-small text-text-secondary">
      {label}
    </time>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/relative-date.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/relative-date.tsx tests/unit/components/relative-date.test.tsx
git commit -m "phase 2: add RelativeDate component"
```

---

## Task 18: Form field wrappers (FormField + variants)

**Files:** 6 wrapper components, one shared test file.

- [ ] **Step 1: Write the test**

Create `tests/unit/components/form-fields.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "@/components/forms/form-field";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSelect } from "@/components/forms/form-select";
import { FormNumber } from "@/components/forms/form-number";
import { FormCheckbox } from "@/components/forms/form-checkbox";

describe("FormField wrappers", () => {
  it("FormField renders label, input, optional error", () => {
    render(<FormField label="Email" name="email" error="required" />);
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByText("required")).toBeDefined();
  });
  it("FormField links error to input via aria-describedby", () => {
    render(<FormField label="Email" name="email" error="bad" />);
    const input = screen.getByLabelText("Email");
    expect(input.getAttribute("aria-describedby")).toBe("email-error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });
  it("FormTextarea renders label + textarea", () => {
    render(<FormTextarea label="Bio" name="bio" rows={3} />);
    expect((screen.getByLabelText("Bio") as HTMLTextAreaElement).rows).toBe(3);
  });
  it("FormSelect renders options", () => {
    render(
      <FormSelect label="Type" name="type" options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]} />,
    );
    expect((screen.getByLabelText("Type") as HTMLSelectElement).options.length).toBe(2);
  });
  it("FormNumber accepts default value", () => {
    render(<FormNumber label="Order" name="order" defaultValue={3} />);
    expect((screen.getByLabelText("Order") as HTMLInputElement).value).toBe("3");
  });
  it("FormCheckbox renders label", () => {
    render(<FormCheckbox label="Active" name="active" />);
    expect(screen.getByLabelText("Active")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/form-fields.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/forms/form-field.tsx`**

```tsx
import type { InputHTMLAttributes, ReactNode } from "react";
import { Input } from "@/components/ui/input";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
};

export function FormField({ label, name, error, hint, ...rest }: Props) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label uppercase text-text-secondary">{label}</span>
      <Input
        id={name}
        name={name}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      />
      {hint && !error ? <span className="text-caption text-text-tertiary">{hint}</span> : null}
      {error ? (
        <span id={`${name}-error`} className="text-caption text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}
```

- [ ] **Step 4: Implement `components/forms/form-textarea.tsx`**

```tsx
import type { TextareaHTMLAttributes, ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
};

export function FormTextarea({ label, name, error, hint, ...rest }: Props) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label uppercase text-text-secondary">{label}</span>
      <Textarea
        id={name}
        name={name}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      />
      {hint && !error ? <span className="text-caption text-text-tertiary">{hint}</span> : null}
      {error ? (
        <span id={`${name}-error`} className="text-caption text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}
```

- [ ] **Step 5: Implement `components/forms/form-select.tsx`**

```tsx
import type { SelectHTMLAttributes } from "react";
import { Select } from "@/components/ui/select";

type Option = { value: string; label: string };

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label: string;
  name: string;
  options: Option[];
  error?: string;
};

export function FormSelect({ label, name, options, error, ...rest }: Props) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label uppercase text-text-secondary">{label}</span>
      <Select
        id={name}
        name={name}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      {error ? (
        <span id={`${name}-error`} className="text-caption text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}
```

- [ ] **Step 6: Implement `components/forms/form-number.tsx`**

```tsx
import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  name: string;
  error?: string;
};

export function FormNumber({ label, name, error, className, ...rest }: Props) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label uppercase text-text-secondary">{label}</span>
      <Input
        type="number"
        id={name}
        name={name}
        className={className ?? "w-16"}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      />
      {error ? (
        <span id={`${name}-error`} className="text-caption text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}
```

- [ ] **Step 7: Implement `components/forms/form-checkbox.tsx`**

```tsx
import type { InputHTMLAttributes } from "react";
import { Checkbox } from "@/components/ui/checkbox";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  name: string;
};

export function FormCheckbox({ label, name, ...rest }: Props) {
  return (
    <label className="inline-flex items-center gap-sm text-body">
      <Checkbox id={name} name={name} {...rest} />
      <span>{label}</span>
    </label>
  );
}
```

- [ ] **Step 8: Implement `components/forms/form-date.tsx` + `date-input.tsx`**

`components/forms/date-input.tsx`:

```tsx
import { forwardRef, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const DateInput = forwardRef<HTMLInputElement, Props>(function DateInput(props, ref) {
  return <Input ref={ref} placeholder="YYYY-MM" pattern="[0-9]{4}-[0-9]{2}" {...props} />;
});
```

`components/forms/form-date.tsx`:

```tsx
import type { InputHTMLAttributes } from "react";
import { DateInput } from "@/components/forms/date-input";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
};

export function FormDate({ label, name, error, ...rest }: Props) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label uppercase text-text-secondary">{label}</span>
      <DateInput
        id={name}
        name={name}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      />
      {error ? (
        <span id={`${name}-error`} className="text-caption text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}
```

- [ ] **Step 9: Run all form field tests**

```bash
npm test -- tests/unit/components/form-fields.test.tsx
```

Expected: PASS (6 tests).

- [ ] **Step 10: Commit**

```bash
git add components/forms/ tests/unit/components/form-fields.test.tsx
git commit -m "phase 2: add Form field wrappers (FormField, Textarea, Select, Number, Checkbox, Date)"
```

---

## Task 19: BackLink and SectionHeader

- [ ] **Step 1: Write the test**

Create `tests/unit/components/navigation.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BackLink } from "@/components/navigation/back-link";
import { SectionHeader } from "@/components/sections/section-header";

describe("BackLink", () => {
  it("renders an arrow + label and links to href", () => {
    render(<BackLink href="/experience" label="Experience" />);
    const link = screen.getByRole("link", { name: /experience/i });
    expect(link.getAttribute("href")).toBe("/experience");
    expect(link.textContent).toContain("←");
  });
});

describe("SectionHeader", () => {
  it("renders title and actions", () => {
    render(<SectionHeader title="Identity" actions={<button>Save</button>} />);
    expect(screen.getByText("Identity")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
  });
  it("renders dirty indicator dot when hasUnsavedChanges", () => {
    render(<SectionHeader title="X" actions={<button>Save</button>} hasUnsavedChanges />);
    expect(screen.getByLabelText("unsaved changes")).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/navigation.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/navigation/back-link.tsx`**

```tsx
import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-xs text-small text-text-secondary hover:text-text"
    >
      ← {label}
    </Link>
  );
}
```

- [ ] **Step 4: Implement `components/sections/section-header.tsx`**

```tsx
import type { ReactNode } from "react";

export function SectionHeader({
  title,
  actions,
  hasUnsavedChanges,
}: {
  title: string;
  actions?: ReactNode;
  hasUnsavedChanges?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-md">
      <h2 className="text-heading">{title}</h2>
      <div className="flex items-center gap-sm">
        {hasUnsavedChanges ? (
          <span aria-label="unsaved changes" className="inline-block h-2 w-2 rounded-full bg-accent" />
        ) : null}
        {actions}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- tests/unit/components/navigation.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/navigation/back-link.tsx components/sections/section-header.tsx tests/unit/components/navigation.test.tsx
git commit -m "phase 2: add BackLink and SectionHeader"
```

---

## Task 20: LeftRail navigation

- [ ] **Step 1: Write the test**

Create `tests/unit/components/left-rail.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeftRail } from "@/components/navigation/left-rail";

vi.mock("next/navigation", () => ({ usePathname: () => "/experience" }));

describe("LeftRail", () => {
  it("renders all primary nav items", () => {
    render(<LeftRail />);
    for (const label of ["Profile", "Experience", "Skills", "Education", "Values", "Applications", "Settings"]) {
      expect(screen.getByText(label)).toBeDefined();
    }
  });
  it("marks the active item based on usePathname", () => {
    render(<LeftRail />);
    const active = screen.getByText("Experience").closest("a");
    expect(active?.className).toContain("bg-surface-raised");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/left-rail.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/navigation/left-rail.tsx`**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const PRIMARY = [
  { href: "/profile", label: "Profile" },
  { href: "/experience", label: "Experience" },
  { href: "/skills", label: "Skills" },
  { href: "/education", label: "Education" },
  { href: "/values", label: "Values" },
  { href: "/applications", label: "Applications" },
] as const;

export function LeftRail() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col h-full w-[220px] shrink-0 bg-surface border-r border-border">
      <div className="px-lg py-xl">
        <p className="font-mono text-body text-text">
          KB <span className="text-text-secondary">Manager</span>
        </p>
      </div>
      <ul className="flex flex-col gap-xs px-md">
        {PRIMARY.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center h-[34px] px-sm rounded-sm text-small",
                  active ? "bg-surface-raised text-text border-l-2 border-accent" : "text-text-secondary hover:bg-surface-raised hover:text-text",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-lg mx-md border-t border-border-subtle" />
      <ul className="flex flex-col gap-xs px-md mt-md">
        <li>
          <Link
            href="/settings"
            className={cn(
              "flex items-center h-[34px] px-sm rounded-sm text-small",
              pathname.startsWith("/settings") ? "bg-surface-raised text-text" : "text-text-secondary hover:bg-surface-raised hover:text-text",
            )}
          >
            Settings
          </Link>
        </li>
      </ul>
      <div className="mt-auto px-lg py-md">
        <p className="text-caption text-text-tertiary">v0.1.0</p>
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/left-rail.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/navigation/left-rail.tsx tests/unit/components/left-rail.test.tsx
git commit -m "phase 2: add LeftRail navigation"
```

---

## Task 21: Header component

- [ ] **Step 1: Write the test**

Create `tests/unit/components/header.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "@/components/navigation/header";

describe("Header", () => {
  it("renders title", () => {
    render(<Header title="Profile" />);
    expect(screen.getByText("Profile")).toBeDefined();
  });
  it("renders subtitle when provided", () => {
    render(<Header title="Experience" subtitle="3 roles" />);
    expect(screen.getByText("3 roles")).toBeDefined();
  });
  it("renders actions", () => {
    render(<Header title="X" actions={<button>Add</button>} />);
    expect(screen.getByRole("button", { name: "Add" })).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/components/header.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `components/navigation/header.tsx`**

```tsx
import type { ReactNode } from "react";

export function Header({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="h-14 flex items-center justify-between px-2xl border-b border-border bg-bg">
      <div>
        <h1 className="text-display">{title}</h1>
        {subtitle ? <p className="text-small text-text-secondary">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-sm">{actions}</div> : null}
    </header>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/components/header.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/navigation/header.tsx tests/unit/components/header.test.tsx
git commit -m "phase 2: add Header component"
```

---

## Task 22: AppShell layout

- [ ] **Step 1: Implement `components/shell/app-shell.tsx`**

```tsx
import type { ReactNode } from "react";
import { LeftRail } from "@/components/navigation/left-rail";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen">
      <LeftRail />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `app/layout.tsx` to apply AppShell to authenticated pages**

The login page is rendered without the shell. We achieve this via route groups — login lives outside the shell-wrapping layout.

Replace `app/layout.tsx`:

```tsx
import "@/app/globals.css";
import type { ReactNode } from "react";
import { geistSans, geistMono } from "@/lib/fonts";

export const metadata = { title: "KB" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

Create `app/(shell)/layout.tsx` (route group wraps shell):

```tsx
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 3: Move `app/page.tsx` under `(shell)`**

```bash
mkdir -p app/\(shell\)
mv app/page.tsx app/\(shell\)/page.tsx
```

Update its content (will be replaced with bootstrap redirect in Task 24):

```tsx
export default function HomePage() {
  return <div className="p-2xl">KB Web App — Phase 2 OK</div>;
}
```

- [ ] **Step 4: Boot and verify**

```bash
npm run dev
```

Open `http://localhost:3000`. Confirm:
- Left rail visible with all nav items
- "KB Web App — Phase 2 OK" in main area
- Dark theme applied
- Geist font in DevTools

Stop server.

- [ ] **Step 5: Commit**

```bash
git add app/ components/shell/app-shell.tsx
git commit -m "phase 2: add AppShell + (shell) route group"
```

---

## Task 23: Login page + signIn action

- [ ] **Step 1: Write the test for the action**

Create `tests/unit/app/login-action.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("iron-session", () => {
  return {
    getIronSession: vi.fn(async () => ({ save: vi.fn(), authenticated: false })),
  };
});
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({})) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("signIn action", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns error when ADMIN_PASSWORD_HASH not set", async () => {
    process.env.ADMIN_PASSWORD_HASH = "";
    process.env.SESSION_SECRET = "a".repeat(32);
    const { signIn } = await import("@/app/login/actions");
    const fd = new FormData();
    fd.set("password", "x");
    const result = await signIn(fd);
    expect(result.ok).toBe(false);
    expect((result as any).error.code).toBe("INTERNAL");
  });

  it("returns error on wrong password", async () => {
    const hash = await bcrypt.hash("correct", 4);
    process.env.ADMIN_PASSWORD_HASH = hash;
    process.env.SESSION_SECRET = "a".repeat(32);
    const { signIn } = await import("@/app/login/actions");
    const fd = new FormData();
    fd.set("password", "wrong");
    const result = await signIn(fd);
    expect(result.ok).toBe(false);
    expect((result as any).error.fieldErrors?.password).toBeDefined();
  });

  it("calls redirect on correct password", async () => {
    const { redirect } = await import("next/navigation");
    const hash = await bcrypt.hash("correct", 4);
    process.env.ADMIN_PASSWORD_HASH = hash;
    process.env.SESSION_SECRET = "a".repeat(32);
    const { signIn } = await import("@/app/login/actions");
    const fd = new FormData();
    fd.set("password", "correct");
    await signIn(fd);
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/app/login-action.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `app/login/actions.ts`**

```ts
"use server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionOptions, type SessionData } from "@/server/auth/session";
import { err, ok, type ActionResult } from "@/server/actions/result";

export async function signIn(formData: FormData): Promise<ActionResult<null>> {
  const password = String(formData.get("password") ?? "");
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return err("INTERNAL", "Authentication is not configured.");
  if (!password) return err("VALIDATION_FAILED", "Password is required.", { password: "Password is required" });
  const valid = await bcrypt.compare(password, hash);
  if (!valid) return err("VALIDATION_FAILED", "Invalid password.", { password: "Invalid password" });
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.authenticated = true;
  await session.save();
  redirect("/");
  return ok(null);
}
```

- [ ] **Step 4: Implement `app/login/page.tsx`**

```tsx
"use client";
import { useFormState } from "react-dom";
import { signIn } from "./actions";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";

const initialState = { ok: true as const, data: null };

export default function LoginPage() {
  const [state, action] = useFormState(async (_: typeof initialState, fd: FormData) => signIn(fd), initialState);
  const configured = !!process.env.NEXT_PUBLIC_AUTH_ENABLED;

  if (!configured) {
    return (
      <main className="min-h-screen flex items-center justify-center p-xl">
        <div className="w-[400px] bg-surface rounded-lg border border-border p-xl flex flex-col gap-md">
          <p className="font-mono text-subheading">KB Manager</p>
          <p className="text-body text-text-secondary">Authentication is not configured.</p>
          <a className="text-accent hover:text-accent-hover" href="/profile">Go to profile →</a>
        </div>
      </main>
    );
  }

  const fieldError = state.ok ? undefined : (state.error.fieldErrors?.password ?? state.error.message);
  return (
    <main className="min-h-screen flex items-center justify-center p-xl">
      <form action={action} className="w-[400px] bg-surface rounded-lg border border-border p-xl flex flex-col gap-md">
        <p className="font-mono text-subheading">KB Manager</p>
        <FormField label="Password" name="password" type="password" error={fieldError} />
        <Button type="submit">Sign in</Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Surface auth-configured to client via env**

Add to `next.config.ts`:

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: { typedRoutes: true },
  env: {
    NEXT_PUBLIC_AUTH_ENABLED: process.env.ADMIN_PASSWORD_HASH ? "1" : "",
  },
};

export default config;
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npm test -- tests/unit/app/login-action.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 7: Smoke test in browser**

```bash
ADMIN_PASSWORD_HASH=$(node -e "console.log(require('bcryptjs').hashSync('test', 4))") \
SESSION_SECRET=$(node -e "console.log('a'.repeat(32))") \
DATABASE_URL=postgresql://kb:kb@localhost:5432/kb \
npm run dev
```

Open `http://localhost:3000/login`. Verify password form renders. Try wrong password → error. Try `test` → redirected. Stop server.

- [ ] **Step 8: Commit**

```bash
git add app/login/ next.config.ts tests/unit/app/login-action.test.ts
git commit -m "phase 2: add login page + signIn action"
```

---

## Task 24: Bootstrap redirect on `/`

- [ ] **Step 1: Write the test**

Create `tests/integration/bootstrap-redirect.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { db } from "@/server/data/db";

describe("/ redirect logic", () => {
  beforeAll(() => {
    execSync("npx prisma migrate reset --force --skip-seed", { stdio: "inherit" });
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
  });
  afterAll(async () => {
    await db.$disconnect();
  });

  it("decideHomeRedirect returns /profile when no Profile exists", async () => {
    const { decideHomeRedirect } = await import("@/server/data/bootstrap");
    expect(await decideHomeRedirect()).toBe("/profile");
  });

  it("decideHomeRedirect returns /applications when Profile exists", async () => {
    await db.profile.create({
      data: {
        userId: 1,
        fullName: "Test",
        headline: "h",
        email: "t@t",
        professionalSummary: "s",
      },
    });
    const { decideHomeRedirect } = await import("@/server/data/bootstrap");
    expect(await decideHomeRedirect()).toBe("/applications");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
docker run --rm -d --name kb-pg-tmp -e POSTGRES_PASSWORD=kb -e POSTGRES_USER=kb -e POSTGRES_DB=kb -p 5432:5432 postgres:16
sleep 3
export DATABASE_URL="postgresql://kb:kb@localhost:5432/kb"
npx prisma migrate deploy
npm test -- tests/integration/bootstrap-redirect.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `server/data/bootstrap.ts`**

```ts
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";

export async function decideHomeRedirect(): Promise<string> {
  const profile = await db.profile.findUnique({ where: { userId: CURRENT_USER_ID } });
  return profile ? "/applications" : "/profile";
}
```

- [ ] **Step 4: Replace `app/(shell)/page.tsx` with redirect**

```tsx
import { redirect } from "next/navigation";
import { decideHomeRedirect } from "@/server/data/bootstrap";

export default async function HomePage() {
  const target = await decideHomeRedirect();
  redirect(target);
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- tests/integration/bootstrap-redirect.test.ts
```

Expected: PASS. Stop temp container: `docker stop kb-pg-tmp`.

- [ ] **Step 6: Update the Prisma grep guard to also scan `server/data/bootstrap.ts`**

The bootstrap helper uses raw Prisma but reads only user-scoped data via `CURRENT_USER_ID`. The current guard only checks `app/` and `server/actions/`. The bootstrap file lives under `server/data/` which is allowed (the wrapper itself uses raw Prisma). No changes needed.

- [ ] **Step 7: Commit**

```bash
git add server/data/bootstrap.ts app/\(shell\)/page.tsx tests/integration/bootstrap-redirect.test.ts
git commit -m "phase 2: add bootstrap redirect on /"
```

---

## Task 25: Final Phase 2 verification

- [ ] **Step 1: Full test suite**

```bash
docker run --rm -d --name kb-pg-tmp -e POSTGRES_PASSWORD=kb -e POSTGRES_USER=kb -e POSTGRES_DB=kb -p 5432:5432 postgres:16
sleep 3
export DATABASE_URL="postgresql://kb:kb@localhost:5432/kb"
npx prisma migrate deploy
npm test
docker stop kb-pg-tmp
```

Expected: all PASS.

- [ ] **Step 2: Typecheck + build**

```bash
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 3: Confirm Phase 2 acceptance**

The app now:
- Boots with the dark theme + Geist fonts
- Shows the left rail on every shelled page
- Has a working login page behind the optional `ADMIN_PASSWORD_HASH` env var
- Bootstrap redirect on `/` sends empty DB to `/profile`, populated DB to `/applications` (both render placeholders for now)
- All design system primitives exist with unit-tested behavior
- Form field wrappers ready for use in Phase 3

Phase 2 complete. Phase 3 (KB CRUD surfaces) begins from here.
