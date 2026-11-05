---
description: Publish one staged change now — review, explicit human approval, submit, then verify live. For deployment planning and cache rules, load `storeconnect-sync-deploy`.
argument-hint: "[change description or staged change id]"
---

# Publish a staged StoreConnect change

Drive one coherent content change from staged state to verified live state.
A staged result is not a live result. Follow `storeconnect-sync-deploy` for
deployment ordering and `storeconnect-salesforce-data` for record shape.

## Confirm the target first

1. Require an active, verified connection. If the store, environment, and
   signed-in identity have not been confirmed in this session, run the connect
   and verify command first and stop here.
2. Read the current records and dependencies the change touches. Never guess an
   identifier or a field name.

## Stage and review

1. Group only related edits into one change. Keep unrelated work in a separate
   change. Keep the change summary to a sentence or two: Salesforce rejects an
   overlong summary when the change is submitted.
2. Read back the staged summary from the live server and present every material
   effect to the user: additions, updates, deletions, links, media, pricing,
   navigation, and theme activation.
3. Call out high-impact effects explicitly and separately: deletions, bulk
   edits, price changes, theme activation, and navigation or checkout changes.
4. Request the preview the live server produces and give the user the link.
   Repeat any limitation the server reports about that preview rather than
   reassuring the user.

## Obtain approval

1. Show the user exactly what will be submitted.
2. Wait for clear, explicit approval. Do not infer approval from earlier
   instructions, from enthusiasm, or from silence.
3. Never construct, reconstruct, or fabricate approval data. Use only the
   supported review action after the user has approved the exact previewed
   outcome.

## Submit and verify

1. Submit through the current supported review action. Leave any required
   independent administrative review or publication to the authorized person.
   Tell the user who that is:
   - The publisher needs an approver-level Content Changes Store Role for the
     change's store.
   - The publisher can't be the change's author unless their role has the
     **Publish Own Changes** scope.
   - A change made in Website Builder is not tied to one store, so only an
     approver whose role covers all stores can publish it.
   - An approved change is not live until the change status reaches published.
2. If the submission fails and the change stays in review with nothing in
   Salesforce, withdraw it to draft, discard the draft, and stage the edits again
   in a new change. Report the failure to the user; never resubmit the same
   change unchanged.
3. StoreConnect and Salesforce synchronize asynchronously; wait, re-read and
   never repeat a write merely because it is not visible yet.
4. Surface every warning, rejection, and incomplete item. Never report success
   from the initial submission response alone.
5. After publication, read the affected content again and confirm the intended
   store reflects the approved change. Allow time for a completed operation to
   become observable before concluding it failed.
6. Report the final state plainly. If any part did not publish, say which part
   and why.

## Boundaries

- Never bypass staging, preview, approval, or independent review because the
  change looks routine or small.
- Never submit to a different store or environment to work around missing
  access.
- Never fabricate a record identifier, approval state, completion state, or a
  successful preview.
- If the live server does not expose a required operation, stop and ask the
  StoreConnect administrator for the supported workflow. Do not substitute an
  undocumented interface or a direct data write.
