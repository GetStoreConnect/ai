# Security policy

## Reporting a vulnerability

Do not report security vulnerabilities in a public issue, discussion, pull
request, example, or support-site post.

Use one of these private channels:

1. Open a [private GitHub Security Advisory](https://github.com/GetStoreConnect/ai/security/advisories/new).
2. If you cannot access the advisory form, email
   [support@storeconnect.com](mailto:support@storeconnect.com) with the subject
   `Security: GetStoreConnect/ai`.

Include the affected commit, provider package or skill, impact, reproduction
steps, and any known mitigation. Remove credentials, customer records, store
identifiers, and other sensitive data from the report. If a secret was exposed,
revoke or rotate it first and tell us only the secret type and where it was
exposed.

Please allow the maintainers time to investigate and coordinate a fix before
disclosing the issue. We will acknowledge the report through the channel used
and provide updates as the investigation progresses.

## Scope

Security reports may concern more than executable code. In scope are:

- instructions that could cause unauthorized or destructive store changes
- prompt-injection paths or untrusted content treated as instructions
- credential, token, customer-data, or org-data exposure
- unsafe MCP, Salesforce, deployment, seed-data, Apex, Liquid, LWC, or POS
  guidance
- provider packaging that installs unexpected files or grants unexpected
  capabilities
- dependencies or automation introduced by this repository.

Ordinary StoreConnect support questions and documentation corrections are not
considered vulnerabilities and should be reported to support [support@storeconnect.com](mailto:support@storeconnect.com).

## Supported versions

Security fixes target the latest published release and the current `main`
branch. Older releases may not receive fixes unless a release notice says
otherwise.

## Secrets and test data

Never commit credentials, customer data, copied production exports, or other
secrets. Use placeholders in public skills and examples. Exercise write-capable
workflows only in an authorized non-production environment unless the operator
explicitly selects and approves a production change.

A private client or partner implementation repository may retain required
customer domains and non-secret project identifiers. Credentials must never be
committed, logged, added to screenshots or issue text, or placed in project
instructions. Use native sign-in or an administrator-approved credential
interface. Do not document, log, export, or attempt to reconstruct credential
names, formats, or internal representation. Ask the administrator to reset
access if sensitive authentication data may have been exposed.
