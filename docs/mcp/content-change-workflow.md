# Safe content-change workflow

StoreConnect MCP writes use a staged workflow so changes can be inspected
before they reach the live store. Exact tool names and fields may change; use
the schemas advertised by the connected server.

## Workflow

1. **Verify the target.** Use a read-only live operation to confirm the store,
   environment, and signed-in identity.
2. **Inspect before editing.** Read the current records and dependencies needed
   for the requested change. Do not guess identifiers or field names.
3. **Stage one coherent change.** Group only related edits and keep unrelated
   work separate. A staged result is not a live result.
4. **Review the staged summary.** Check additions, updates, deletions, links,
   media, pricing, and other material effects returned by the live tools.
5. **Preview where available.** Give the user the preview produced by the live
   server and explain any limitation reported by that server.
6. **Obtain explicit approval.** Show the user what will be submitted and wait
   for clear approval. Preserve approval text exactly when the live schema
   requires it; never invent or infer approval.
7. **Submit through the staged workflow.** Follow the current tool schema and
   leave any independent review or publishing step to the authorized person.
8. **Recheck the result.** Submission and publishing can complete
   asynchronously. Poll the change with the live read operation until it
   reports a final state, and surface every warning, rejection, or incomplete
   item. Do not report success from the initial submission alone.
9. **Verify the live outcome.** After publication, read the affected content
   again and confirm the intended store reflects the approved change.

## Safety boundaries

- Never bypass staging, preview, approval, or independent review because a
  task appears routine.
- Never submit to a different store or environment to work around missing
  access.
- Never fabricate record identifiers, approval text, completion state, or a
  successful preview.
- If the live MCP server does not expose a required operation, stop and ask
  the StoreConnect administrator for the supported workflow. Do not substitute
  an undocumented API or direct data write.
- Treat deletes, bulk edits, price changes, theme activation, and navigation or
  checkout changes as high-impact. Summarize their scope explicitly before
  approval.

For connection safety, see [connect and authenticate](connection-and-auth.md).
