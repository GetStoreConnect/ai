# POS scripting, styling, and integration patterns

Use JavaScript or CSS only when supported Layouts, Fields, Filters, Views, and
Action Items cannot express the requirement. Custom code runs in an operator's
authenticated browser session on a shared device and can affect the entire
register.

This reference describes supported design boundaries. It does not reproduce the
POS application's DOM, lifecycle, storage, action registry, or implementation
behavior.

## Contents

- [Confirm the supported extension point](#confirm-the-supported-extension-point)
- [Keep initialization scoped and repeatable](#keep-initialization-scoped-and-repeatable)
- [Communicating between custom Views](#communicating-between-custom-views)
- [Writing data](#writing-data)
- [Escaping and untrusted input](#escaping-and-untrusted-input)
- [CSS patterns that hold up in the POS](#css-patterns-that-hold-up-in-the-pos)
- [External integrations](#external-integrations)
- [Client-side checks are not authorization](#client-side-checks-are-not-authorization)
- [Do not touch platform-managed state](#do-not-touch-platform-managed-state)
- [Verification checklist](#verification-checklist)

## Confirm the supported extension point

Before writing code:

1. Confirm the Store, environment, Outlet, register, and installed StoreConnect
   release.
2. Read current StoreConnect documentation and the live Salesforce schema for
   Script Blocks, Style Blocks, and the target POS View.
3. Verify that the exact attachment point supports custom script or style in
   that release.
4. Prefer markup and behavior owned by a custom POS View.
5. Capture the current records as a rollback and test in non-production.

If current documentation does not support the required lifecycle, event, action,
or selector, treat it as unavailable and request an extension point. Do not
derive one from application bundles, network traffic, browser state, or another
customer's register.

## Keep initialization scoped and repeatable

POS screens can change while the browser session remains open. Any supported
custom initializer must be safe to run more than once.

- Scope behavior to a custom root element and custom `data-*` attributes that
  the View owns.
- Prefix custom CSS classes, event names, and identifiers.
- Attach the minimum listeners needed and prevent duplicate binding.
- Clean up timers, pending requests, and listeners when the supported extension
  lifecycle provides a cleanup hook.
- Do not watch the entire application DOM or depend on undocumented screen
  replacement behavior.
- Keep repeated row work out of JavaScript; prepare data once at the supported
  list or View boundary.

Use a Script Block only for behavior that current documentation says must be
shared across supported custom surfaces. Do not use it to take over
platform-rendered UI.

## Communicating between custom Views

When two custom Views need to coordinate, use only a currently documented POS
event mechanism.

- Namespace the event to the project.
- Keep the payload minimal and validate its shape and range at the receiver.
- Never include customer data, payment data, credentials, PINs, prices to be
  trusted, or an authorization decision.
- Treat an event as a request, not evidence of permission.
- Provide an accessible visible state when the requested behavior cannot
  complete.

## Writing data

Do not write business data directly from custom JavaScript.

Use a purpose-built, documented StoreConnect Action Item or Salesforce workflow
that preserves validation, permissions, offline behavior, and auditability.
Never expose a generic record-write capability or accept operator-supplied field
names.

If no supported write action exists for the installed release, treat the
operation as unavailable. See [actions-reference.md](actions-reference.md).

## Escaping and untrusted input

Treat scanned barcodes, search text, customer names, notes, addresses, product
content, custom fields, and integration responses as untrusted.

- Use `| escape` in POS Liquid for HTML text and attributes.
- Use `textContent` when JavaScript writes plain text.
- Validate and encode any value used in a URL.
- Never interpolate untrusted data into a script body, selector, style rule, or
  executable HTML.
- Never log customer, order, payment, credential, PIN, or authorization data.

## CSS patterns that hold up in the POS

Style only markup owned by the custom View.

- Prefix every custom class.
- Use flexbox or grid within the custom root.
- Set `min-width: 0` on text-bearing flex or grid children.
- Provide visible focus, adequate contrast, large touch targets, and
  reduced-motion behavior.
- Test long translated strings, empty values, narrow screens, high zoom, and
  the register's supported browser.
- Do not target, hide, or override platform DOM classes.
- Do not use CSS visibility as a permission check.

If a requirement needs a platform selector or structure not documented for
customization, request a supported hook rather than shipping a fragile override.

## External integrations

A credential delivered to the POS browser is exposed. Never put an API key,
token, signed URL, Salesforce session, password, PIN, or payment credential in a
POS View, Script Block, Style Block, Store Variable, print template, event, log,
or repository.

Use an approved server-managed integration that:

- holds its own credential;
- authenticates and authorizes the intended operator or store;
- accepts the minimum non-sensitive request data;
- validates every input;
- records an auditable result where required; and
- fails without blocking the operator's core sale workflow.

External enrichment should be optional. Test the complete operator flow with the
network unavailable.

## Client-side checks are not authorization

Anything running in the browser can be inspected or modified. A hidden button,
role check, prompt, PIN dialog, disabled control, or custom event is a workflow
aid, not a security boundary.

Enforce discounts, price changes, refunds, order actions, register controls, and
second-person approval through StoreConnect or Salesforce. The resulting
transaction must record who performed and approved it.

Never collect or compare a staff PIN in custom code.

## Do not touch platform-managed state

Do not inspect, modify, clear, or patch:

- device-managed data, caches, connection state, or session state;
- platform globals, framework behavior, or application prototypes;
- undocumented actions, routes, events, selectors, or diagnostics; or
- synchronization, reset, pairing, or recovery operations from custom code.

Use current documented View context, supported queries and Action Items, and the
in-app administration controls. Contact StoreConnect support instead of
improvising a recovery or extension path.

## Verification checklist

- Store, environment, Outlet, register, and release are confirmed.
- The exact script/style attachment point is supported by current
  documentation.
- Code is scoped to custom-owned markup and can initialize repeatedly without
  duplicates.
- No application-wide DOM observer, undocumented selector, platform patch, or
  derived action is used.
- All untrusted output is escaped and all inputs are validated.
- No sensitive data reaches markup, events, logs, URLs, or client code.
- Business writes use a documented permission-enforced workflow.
- The experience remains accessible, responsive, and usable with the network
  unavailable.
- Rollback was tested on a non-production register.
- StoreConnect and Salesforce synchronization was allowed to complete before
  diagnosing or retrying.
