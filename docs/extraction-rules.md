# Extraction Rules

These rules define how the extractor should turn implementation evidence into a user-facing design-system summary.

## Universal Rules

- Design-system output must be builder-agnostic.
- User-facing component names come from role, hierarchy, behavior, and visual treatment.
- Source classes are evidence only. They must not become public component roles or variant names.
- Computed browser styles are observed evidence, not canonical design tokens.
- Public output should use semantic roles such as `Primary CTA`, `Secondary CTA`, `Card`, `Navigation`, and `Accordion`.
- Debug output should preserve implementation details such as source selectors, builder classes, observed values, canonical values, and classification reasons.

## CTA Role Inference

A button-like element is a `Primary CTA` candidate when it:

- appears in the hero or above-the-fold area
- has a short action label such as `get tickets`, `start`, `buy`, `book`, or `sign up`
- has the strongest visual emphasis among nearby actions
- uses a filled treatment or another high-emphasis style
- repeats as the main conversion action elsewhere on the page

Do not name CTA variants from source classes.

Good public output:

```text
Button / Primary CTA / fill / lg
```

Good debug evidence:

```text
source: a.cc-solid-lime.button
reason: hero area + action label + filled treatment + highest visual emphasis
```

If a button-like element has a CTA class but no computed fill, classify it as a CTA candidate and inspect nearby visual wrappers before promoting it to a filled CTA.

## Webflow Rules

Common signals:

- `w-inline-block`
- `w-button`
- `w-nav`
- `w-commerce-*`
- `data-wf-page`
- `data-wf-site`
- combo classes such as `button cc-solid-lime`

Rules:

- Treat `w-*` classes as Webflow utilities.
- Treat `cc-*` classes as modifier evidence, not public component names.
- Combo classes often split base and variant styling.
- If a CTA anchor has missing fill, padding, or radius, inspect parent and child wrappers for the visual style.
- Public roles must stay semantic, such as `Primary CTA`, not `cc-solid-lime`.

## Framer Rules

Common signals:

- `framer-*` classes
- `data-framer-*`
- generated nested wrappers
- transforms and absolute positioning

Rules:

- Ignore generated Framer class names for public component naming.
- Identify both the clickable root and the visual wrapper.
- Infer CTA role from label, page position, visual emphasis, and link behavior.
- Debug should show both clickable source and visual style source when they differ.

Example:

```text
clickable source: a.framer-abc123
visual source: div.framer-def456
role: Primary CTA
reason: hero area + filled child wrapper + action label
```

## Shopify Rules

Common signals:

- `shopify-section`
- product/card classes
- cart and checkout buttons
- Liquid or theme naming conventions

Rules:

- Distinguish product actions from navigation links.
- Treat add-to-cart, buy-now, and checkout actions as commerce CTAs.
- Preserve product card, collection grid, and pricing structure.
- Do not promote theme class names directly into public design-system variants.

## WordPress And Elementor Rules

Common signals:

- `wp-block-*`
- `elementor-*`
- `wp-content`
- plugin-generated wrapper classes

Rules:

- Ignore plugin wrapper classes for public component naming.
- Use visible structure, computed style, and interaction behavior.
- Be careful with duplicated wrappers around buttons, cards, and sections.
- Keep plugin and builder evidence in Debug.

## Debug Requirements

Debug output should expose:

- detected builder
- applied builder rules
- source class evidence
- clickable source
- visual style source, when different
- observed values
- canonical values
- matched tokens
- classification reason
- confidence or warning signals

Debug explains why extraction made a decision. It should not replace the public design-system summary.
