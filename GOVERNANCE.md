# Governance

## Project Status

`recipe-scrapers` is a community-driven open source project maintained under the **recipe-scrapers** GitHub organization.

The project prioritizes:

- Stability & correctness over novelty
- Backwards compatibility where reasonable
- Minimal install friction
- Predictable APIs

This is a **library**, not an application framework.

---

## Decision Authority

Final decision authority rests with the **maintainers**.

Maintainers are responsible for:

- Project direction & scope
- API design & compatibility
- Dependency policy
- Release management

Consensus is preferred, but not required.

---

## Maintainers

Maintainers have merge and release authority.

Responsibilities include:

- Reviewing contributions
- Protecting API stability
- Evaluating breaking changes
- Ensuring ecosystem coherence

Maintainer status is granted by invitation.

---

## Project Direction

The project favors:

- Conservative dependency choices
- Proven, stable libraries
- Incremental evolution over rewrites

Large architectural shifts require discussion.

Examples of changes requiring prior alignment:

- Validation library replacements
- HTML parsing engine swaps
- Package manager / runtime coupling
- Dependency model changes (peer vs direct)
- Public API redesign

---

## Dependency Policy

General principles:

- Dependencies must have clear justification
- Avoid churn driven by preference alone
- Stability > trend adoption

Guidelines:

**Direct dependencies**  
Used when required for core functionality.

**Peer dependencies**  
Used when version skew or duplication may cause issues, or when part of the public contract.

**Tooling dependencies**  
Considered non-breaking unless they affect consumers.

---

## Breaking Changes

Breaking changes are allowed but deliberate.

Requirements:

- Clear rationale
- Migration guidance
- SemVer major release

Preference:

- Compatibility shims when practical
- Avoid breakage for stylistic reasons

---

## AI-Assisted Contributions

AI tooling is permitted.

However, contributions must include:

- Human-authored rationale
- Explanation of tradeoffs
- Tests covering behavioral changes

PRs consisting primarily of AI-generated refactors without justification may be rejected.

---

## Contribution Philosophy

We value:

- Correctness
- Clarity
- Restraint
- Measured improvements

We avoid:

- Preference-driven rewrites
- Library churn without benefit
- Unnecessary abstraction
- Ecosystem fragmentation

---

## Conflict Resolution

Disagreements are normal.

Resolution follows:

1. Technical discussion
2. Maintainer decision
3. Revisit if new evidence emerges

---

## Long-Term Vision

The project aims to be:

- Stable
- Predictable
- Lightweight
- Easy to integrate
- Ecosystem-friendly

Not:

- Trend-driven
- Rapidly experimental
- Opinionated framework

---

## Governance Evolution

This document may evolve as the project matures.
