# Offline decision register

21 November 2026 · Phase 0 · Release classification **ONLINE_ONLY**

No business approvals were supplied. **PROPOSED** records a candidate for the named owner to accept or replace. **BLOCKED** identifies a later capability that requires an owner decision. The online recovery fixes can proceed independently after Phase 1 authorization.

| ID | Status | Owner | Decision to record | Gate |
|---|---|---|---|---|
| D01 | PROPOSED | Retail operations / IT | Qualify one managed Chromium desktop and printer first. Record OS, browser, till count and other required device classes. | Shell pilot |
| D02 | PROPOSED | Branch operations | Independent tills with foreground reconciliation on reconnect. Specify any requirement for shared state during an outage. | Architecture |
| D03 | BLOCKED | Security / business owner | Approve grant lifetime, renewal, maximum clock drift, offline expiry and accepted revocation delay. The requested 30-day outage is a qualification target. | Protected offline access |
| D04 | BLOCKED | Security / store manager | Define enrollment, shared-device unlock, user switching and who can recover another operator’s unresolved work. | Provisioning |
| D05 | PROPOSED | Retail finance | Keep Admin mutations online initially. Name and approve individual catalog, stock, expense and advance commands with conflict policies. | Admin writes |
| D06 | BLOCKED | Merchandising / finance | Ratify the observed sync behavior for captured prices and archived variants, including variance limits and escalation. | Offline sales |
| D07 | BLOCKED | Finance | Decide refundable age/amount, cross-till eligibility, approval and reconciliation owner when cash has already been paid. | Offline refunds |
| D08 | BLOCKED | Accounting | Decide historical posting and closed-shift treatment. Preserve explicit null shift and null opening cash. Decide whether offline shift open/close is required. | Historical accounting |
| D09 | PROPOSED | Operations / engineering | Measure maximum variants, image bytes, peak tickets and lines/day, receipts, refund history and month backlog per till. Set storage and drain budgets from observations. | Capacity testing |
| D10 | BLOCKED | IT / finance | Approve acceptable loss window, independent encrypted backup medium, key custody, restore operator and rehearsal interval. | 30-day retention |
| D11 | BLOCKED | Deployment owner | Record stable HTTPS origin, compatible deployed revisions, flag owner, pilot branch/device and rollback operator. | Staging / deployment |
| D12 | BLOCKED | Finance / support | Specify ledger retention, unresolved-operation review SLA, authorized reviewers and evidence-preserving resolution. | Financial replay |

The immediate operational inputs are a disposable staging tenant with Admin/Cashier accounts and the owner of historical source exports. Confirm export recipients and credential scope privately before deciding on revocation.
