# POS print templates

Use POS Print Templates for supported receipts, dockets, station tickets,
documents, and labels. Printer types, contexts, fields, and invocation methods
vary by StoreConnect release and device setup, so confirm them from current
documentation and the live Salesforce schema.

This reference does not reproduce hidden context names, action parameters,
default-printer selection, or legacy rendering/storage behavior.

## Contents

- [Confirm the print contract](#confirm-the-print-contract)
- [Choose the output family](#choose-the-output-family)
- [Use only the supplied context](#use-only-the-supplied-context)
- [Author safely](#author-safely)
- [Receipts and dockets](#receipts-and-dockets)
- [Documents and PDFs](#documents-and-pdfs)
- [Labels](#labels)
- [Testing without the target hardware](#testing-without-the-target-hardware)
- [Security and privacy](#security-and-privacy)
- [Deployment and rollback](#deployment-and-rollback)
- [Verification checklist](#verification-checklist)

## Confirm the print contract

Before creating or changing a template:

1. Confirm the Store, environment, Outlet, register, printer, and installed
   StoreConnect release.
2. Describe the live POS Print Template object and read current templates.
3. Confirm the supported printer/output type, context, invocation method, and
   available data from current StoreConnect documentation.
4. Confirm how the target register and printer are paired through the supported
   administration flow.
5. Save the current template and selection as the rollback.

Do not infer a context, global, field, action, printer selection rule, or
rendering behavior from a browser bundle, network trace, device state, another
customer, or a copied registry. If the current contract is not documented, stop
and contact StoreConnect support.

## Choose the output family

Choose the output family before writing markup:

- **Receipt or docket:** narrow, line-oriented output for a supported thermal
  printer.
- **Document or PDF:** page-oriented output with explicit page size, margins,
  typography, and page-break behavior.
- **Label:** printer-language output for the exact supported label printer and
  stock dimensions.

These formats are not interchangeable. A template that looks correct in a
browser may be invalid for a thermal or label printer.

## Use only the supplied context

The print flow supplies a release- and context-specific Liquid object. Use only
the fields listed for that exact current context.

- Verify every attribute against current documentation and a sanitized test
  record.
- Guard optional relationships and empty collections.
- Use mapped custom fields only when the live schema and Custom Data Mapping
  confirm them.
- Do not query for customer, order, payment, or fulfillment data that the
  supported print context did not supply.
- Do not treat a missing value as permission to inspect device-managed or
  internal record state.

Share common markup through a supported POS View only when current documentation
allows it for the chosen print family.

## Author safely

- Escape untrusted text before inserting it into markup or printer commands.
- Keep layout deterministic and avoid network-dependent assets.
- Use fonts, images, barcodes, and QR codes only where the chosen printer family
  documents support.
- Bound lists and long text so one record cannot create unbounded output.
- Include a human-readable value alongside any machine-readable barcode where
  the workflow requires it.
- Never depend on JavaScript inside a print template.
- Never add a print-triggering action or parameter copied from an older release.

## Receipts and dockets

Design for the target paper width and printer capabilities:

- keep columns simple and totals visually distinct;
- handle long product names, quantities, discounts, taxes, refunds, and zero
  values;
- avoid large images or unsupported fonts;
- provide a clear reprint indicator where the supported workflow supplies one;
  and
- verify cutting, feed, and cash-drawer behavior through device configuration,
  not template workarounds.

## Documents and PDFs

For page-oriented output:

- set explicit page size and margins;
- use print-safe CSS supported by the current renderer;
- repeat required headers or footers through documented features;
- control page breaks around rows, totals, signatures, and terms;
- embed only approved, available assets; and
- test multi-page, empty, and maximum-length records.

Do not depend on browser-screen CSS or undocumented renderer-specific behavior.

## Labels

Use the command language and dimensions required by the exact supported printer:

- confirm resolution, stock width/height, orientation, gap, and print darkness;
- keep barcodes inside quiet zones;
- verify symbology and human-readable text;
- escape or reject values that could become printer commands; and
- scan every generated barcode with the store's actual scanner.

Never send a label template to a different printer language or stock size without
re-authoring and testing it.

## Testing without the target hardware

A preview or generated file is useful for structure, but it is not hardware
acceptance.

Before using the target printer:

1. Render with sanitized representative records, including empty and long data.
2. Check that no sensitive fields, identifiers, diagnostics, or hidden values
   appear.
3. Validate the markup or printer language with a supported tool where one is
   available.
4. Review dimensions, wrapping, page breaks, barcode quiet zones, and fallback
   fonts.

Then test on the actual supported printer and stock before a live rollout. A
barcode that renders is not necessarily one the store's scanner can read.

## Security and privacy

Print output is physical data disclosure.

Never print:

- full payment credentials or sensitive provider values;
- staff or device PINs, API keys, tokens, sessions, or signed URLs;
- unnecessary customer contact, address, account, or record identifiers;
- debug output, raw payloads, or internal diagnostics; or
- sensitive fields merely because the Liquid context exposes them.

Use the minimum customer and transaction data required for the business
document, and confirm retention and disposal requirements with the operator.

## Deployment and rollback

1. Read the current template and printer assignment.
2. Stage one template change in a non-production environment.
3. Show the rendered output and field-level diff.
4. Obtain explicit approval before changing a live template or printer
   assignment.
5. Allow StoreConnect and Salesforce synchronization to complete.
6. Re-read the record and print a controlled test.
7. Restore the captured template and assignment if verification fails.

Never repeat a write merely because a register has not received it yet.

## Verification checklist

- Store, environment, Outlet, register, printer, release, output family, and
  context are confirmed.
- Exact fields and invocation method came from current supported documentation.
- No hidden registry, copied action payload, or device implementation behavior
  was used.
- Optional data, long values, empty collections, multi-page output, and reprints
  are handled.
- Text is escaped and no sensitive or unnecessary data is printed.
- Barcodes scan and output fits the actual printer and stock.
- Rollback is captured and the change was tested in non-production.
- The live result was re-read and printed only after synchronization completed.
