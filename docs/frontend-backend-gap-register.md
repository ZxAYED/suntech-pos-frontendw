# Frontend–Backend Gap Register

Phase 0 deliberately does not invent server contracts for visually suggested features. `Unsupported` means no endpoint or durable model is declared; `Partial` means the UI has a safe presentation seam but the backend meaning still needs agreement.

| Capability | Status | Current Phase 0 treatment | Backend decision/action required |
| --- | --- | --- | --- |
| Attendance percentage | Unsupported | Removed from staff data and tables. | Define attendance events, aggregation period, permissions, and reporting endpoint before restoring. |
| “On duty” staff state | Unsupported | Staff uses account `ACTIVE` / `INACTIVE` status only. | Define presence source, clock-in/out lifecycle, and realtime/staleness semantics. |
| Parked/held ticket persistence | Unsupported | Terminal hold is explicitly local component state and is lost on refresh. | Add ticket draft model, list/create/update/delete endpoints, ownership, expiry, and conflict rules. |
| X-report printing | Unsupported | No success action or print claim. | Define X-report payload, shift relationship, printer strategy, and audit record. |
| Receipt printing | Partial | A receipt view model exists after mock checkout; no hardware print claim. | Confirm receipt endpoint/document shape and whether browser, local bridge, or server owns printing. |
| Audit PDF | Unsupported | No PDF generation action is exposed. | Define immutable audit source, filters, generation endpoint, retention, and authorization. |
| Bank statement export | Unsupported | Reports only expose static mock export notices. | Define bank reconciliation model, export format, endpoint, and sensitive-data permissions. |
| Overtime/allowance editing | Unsupported | Payroll displays only supported salary/payroll values. | Define earning/deduction line items, approval flow, validation, and payroll recalculation rules. |
| Standalone drawer cash-out | Unsupported | Fake local ledger removed. Shift page shows a disabled, explanatory control; employee advances remain separate. | Define a dedicated drawer withdrawal/petty-cash model, route, authorization, reconciliation, and audit behavior before enabling. |
| Product warranty metadata | Unsupported | Omitted from catalog forms and view models. | Define warranty duration/unit, provider, serial applicability, and claim workflow. |
| Brand/manufacturer metadata | Unsupported | Omitted from catalog contract; product names remain plain text. | Decide taxonomy, CRUD ownership, uniqueness, and filtering requirements. |
| Business plan badges | Unsupported, visual only | Existing registration/tenant plan labels are presentation copy and are not sent as authoritative data. | Define subscription/entitlement contract and which service owns it. |
| Lane counts | Unsupported, visual only | Optional fixture-only values may decorate tenant cards but never control access. | Define terminal/lane entity, registration lifecycle, limits, and entitlement relationship. |
| Multi-business staff writes | Backend contract gap | Staff reads can send selected `businessId`, but `CreateCashierDto`, update/status/delete routes do not accept selected business context; service resolves token/default business. UI sends no invented field and surfaces ownership/location errors. | Add an authorized business context to staff mutations or document that staff management is limited to the token/default business. |

## Cross-cutting gaps

- Audit log placement: no Phase 0 page claims a durable audit history. The backend should expose an append-only, permission-filtered audit resource; the frontend can later surface it in Admin settings or a dedicated audit route.
- Printing and file exports: browser download, local printer bridge, and server-generated artifacts have materially different security and retry behavior. Pick ownership before adding buttons that imply completion.
- Realtime state: staff presence, lane availability, and active shifts need explicit freshness rules (polling, push, or manual refresh) before UI status indicators become authoritative.
- Offline behavior: held tickets are local-only today. Durable offline synchronization needs IDs, conflict policy, retries, and reconciliation events, not just browser storage.
