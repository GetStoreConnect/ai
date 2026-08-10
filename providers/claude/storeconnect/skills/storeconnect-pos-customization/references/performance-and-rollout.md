# POS performance, testing, rollback, and offline behavior

Use this reference to evaluate a supported POS customization before rollout.
Keep the guidance outcome-based: exact fields, extension contracts, limits, and
diagnostic procedures must come from current StoreConnect documentation and the
live Salesforce schema for the installed release.

## Table of contents

- [The cost model you need in your head](#the-cost-model-you-need-in-your-head)
- [Never do per-row work](#never-do-per-row-work)
- [Keep queries bounded](#keep-queries-bounded)
- [Debouncing scanner and search input](#debouncing-scanner-and-search-input)
- [Layout overrides on a long cart](#layout-overrides-on-a-long-cart)
- [DOM cost inside table rows](#dom-cost-inside-table-rows)
- [Caching: what is safe, what is not](#caching-what-is-safe-what-is-not)
- [Testing before a live register](#testing-before-a-live-register)
- [Rollback](#rollback)
- [Offline behavior](#offline-behavior)
- [What cannot be customized](#what-cannot-be-customized)
- [Review checklist](#review-checklist)

## The cost model you need in your head

Repeated visual and data work multiplies across every visible row, cart line,
and refresh. Optimize the outcome rather than depending on an undocumented
rendering model:

- Prefer native layout configuration over custom rendering.
- Minimize the number and complexity of custom elements on repeated surfaces.
- Prepare reusable data outside repeated rendering where the installed release
  provides a documented supported path.
- Measure on representative register hardware with realistic record and cart
  sizes.
- Re-test after changes to data volume, release version, layout, or connected
  hardware.

Do not publish fixed rendering formulas, timing thresholds, or internal
execution sequences as release-independent facts.

## Never do per-row work

Avoid expensive reads, remote calls, repeated actions, and complex computation
inside a row or cart-line customization. Prefer data already available in the
documented context or a supported operation performed once for the whole
surface.

If the outcome cannot be achieved without repeated unsupported work, stop and
request a supported extension point. Do not reverse-engineer application or
device internals to reproduce the behavior.

## Keep queries bounded

Use only the documented query capability and fields available to the current
POS context:

- Read the smallest data set required for the outcome.
- Apply selective supported conditions.
- Perform shared work once, outside repeated visual units.
- Prefer supported layout sorting and filtering where those features meet the
  requirement.
- Validate field availability, permissions, and behavior against the live
  schema and installed release.

Do not copy a query contract from another store or infer it from unsupported
implementation details.

## Debouncing scanner and search input

Scanner and search interactions may emit partial or rapidly changing input.
Use the current documented interaction lifecycle and ensure that customization:

- does not perform expensive work for every partial value;
- acts only on a complete, validated input;
- ignores results superseded by a newer operator action;
- keeps the core scan and search experience responsive; and
- remains usable with assistive technology and keyboard navigation.

Do not publish browser-event recipes, observer strategies, fixed timing values,
or application selector maps. Verify behavior on the supported release and
target register.

## Layout overrides on a long cart

Treat cart-adjacent customization as performance-sensitive because it remains
active throughout a transaction and may update frequently.

- Keep each repeated element small and free of optional network dependencies.
- Avoid repeated actions or data reads for individual cart lines.
- Test empty, ordinary, and deliberately long transactions.
- Confirm that quantity, customer, discount, payment, and navigation outcomes
  remain responsive.
- Preserve the operator's ability to complete or safely recover a transaction
  if optional customization fails.

## DOM cost inside table rows

Treat every repeated visual element as multiplied cost, but rely only on the
supported view contract:

- Keep markup and assets minimal.
- Prefer supported styling over script-driven presentation.
- Avoid unnecessary nested content, oversized media, and repeated decorative
  detail.
- Check narrow and wide supported layouts, long text, and accessibility states.
- Do not target undocumented application structure or publish selectors and
  lifecycle behavior as an integration contract.

## Caching: what is safe, what is not

Do not add a custom client-side cache unless current StoreConnect documentation
explicitly supports it for the chosen extension point.

Never cache values whose staleness could change a transaction outcome,
including price, availability, cart, order, customer, payment, permission, or
operator state. Use platform-supported state and synchronization behavior.

If the installed release documents caching for stable reference content, follow
that contract and its supported refresh behavior. Do not invent an additional
storage or refresh mechanism.

## Testing before a live register

Before rollout:

1. Prefer a non-production environment and a register that is not trading.
2. Capture the current supported configuration and define the rollback.
3. Validate exact release-specific settings against current documentation and
   the live Salesforce schema.
4. Allow synchronization to complete, then test on representative hardware.
5. Review only sanitized supported diagnostics.

Exercise at least:

- empty, ordinary, and high-volume states;
- missing optional data and unusually long content;
- restricted operators as well as administrators;
- supported screen sizes, touch, keyboard, focus, and accessibility behavior;
- connectivity loss and recovery;
- long transactions for cart-adjacent changes;
- printing or connected hardware relevant to the outcome; and
- more than one representative register when scope permits.

Confirm that operators can still navigate, complete a sale, take a payment,
print, and recover safely.

## Rollback

Define and rehearse a rollback before changing production:

- Record the existing supported configuration.
- Prefer a new, separately scoped customization over overwriting a known-good
  one.
- Restore or reselect the prior supported configuration through the current
  administrative workflow.
- Identify dependants before deactivating or removing a referenced view,
  action, style, script, or print template.
- Verify the restored outcome on the intended register after synchronization.

StoreConnect and Salesforce synchronize asynchronously; wait, re-read and never repeat a write merely because it is not visible yet.

If urgent recovery is needed during trading, protect unsaved work, follow the
current supported procedure, and obtain approval before any disruptive
operation.

## Offline behavior

Supported POS workflows are designed to remain available through a connection
interruption and synchronize when connectivity returns. A customization must
preserve that outcome.

- Do not make a required sales, payment, or recovery outcome depend on an
  optional network service.
- Make external enrichment optional and provide an explicit safe fallback.
- Explain unavailable functionality without blocking the operator.
- Use only release-documented offline actions and data contexts.
- Test the complete affected workflow without connectivity and again after
  reconnection.

Do not publish an internal list of stored data, device behavior, or action
availability. Resolve release-specific offline guarantees from current
StoreConnect documentation.

## What cannot be customized

Do not:

- invent or alter a platform action;
- target a surface with no documented extension point;
- change platform-managed payment, tax, permission, or synchronization behavior
  through client customization;
- use presentation controls as authorization;
- bypass approval, audit, or operator permission safeguards; or
- reverse-engineer implementation internals to create an unsupported extension.

Request a documented extension point or use the supported setup workflow when
the desired outcome is outside the public customization contract.

## Review checklist

- The smallest supported extension point is used.
- Release-specific names and behavior were verified in current documentation
  and the live schema.
- No secret, unnecessary personal data, payment data, or sensitive diagnostic
  content is embedded or logged.
- Repeated surfaces contain no avoidable expensive reads, network calls,
  repeated actions, or complex computation.
- Queries and data access are bounded and permission-aware.
- Partial or superseded input cannot trigger a stale operator outcome.
- No custom cache can make transactional or identity data stale.
- Empty, long, restricted, accessible, offline, and representative hardware
  cases were tested.
- Core trading and recovery outcomes remain available if customization fails.
- The previous configuration and its dependants are recorded.
- Rollback was rehearsed and uses only supported recovery behavior.
