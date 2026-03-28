---
name: clean-code
description: Apply Robert C. Martin's Clean Code principles when writing or refactoring code. Use when the user asks for clean code, Uncle Bob rules, code quality, refactoring, or when reviewing or editing functions, names, comments, or tests.
---

# Clean Code (Robert C. Martin)

Apply these principles when writing or refactoring code. Prefer self-documenting code over comments.

## Names

- **Reveal intent**: Names should answer why, what, or how. Avoid `d`, `data`, `info`, `tmp`.
- **Avoid disinformation**: Don't use names that vary in tiny ways (`xyzController` vs `xyzManager`) or that suggest the wrong type (e.g. a list named `accountList` that isn't a List).
- **Use pronounceable and searchable names**: Prefer `generationTimestamp` over `genymdhms`.
- **One word per concept**: Pick one term per idea and stick to it (e.g. "fetch" vs "get" vs "retrieve" — choose one).
- **No encodings**: No Hungarian notation or type prefixes in names (no `strName`, `arrItems`).
- **Class names**: Nouns or noun phrases. No verb.
- **Method/function names**: Verbs or verb phrases. `getUser`, `isValid`, `parseBody`.

## Functions

- **Small**: Do one thing; do it well; do only that. Usually a few lines; rarely more than ~20.
- **One level of abstraction**: Steps inside a function should be at the same level (e.g. all "what" steps, not mixing high-level policy with low-level details). Extract helpers to keep one level.
- **Read top-to-bottom**: Order so the read order matches the narrative (top = high-level flow; details in called functions below or in other modules).
- **Few arguments**: Prefer 0–2. Three or more: consider an options object or splitting responsibility.
- **No side effects**: Don't do hidden things (e.g. changing class state or global state when the name suggests a query). Query vs command: separate clearly.
- **Command–query separation**: Functions that return a value should not change observable state; functions that change state should not return a value (or return only success/failure).
- **Error handling is one thing**: Use `try/catch`; put the try block in a function whose main job is error handling; call the "do the thing" logic from there. Don't mix business logic and error handling in the same flow.

## Comments

- **Prefer self-documenting code**: Good code often needs few comments. Improve names and structure first.
- **When to comment**: Legal (e.g. license), clarifying intent that can't be expressed in code, warning of consequences, TODO with context, documenting public APIs.
- **Avoid**: Redundant comments (restating the code), misleading or outdated comments, journal/changelog in comments, commented-out code (delete it; version control keeps history).

## Formatting

- **Vertical**: Related code close together; blank lines separate concepts. Callers above callees when it helps readability.
- **Horizontal**: Short lines (e.g. under 120 chars); indent consistently; align related items only when it truly helps.

## Error Handling

- **Use exceptions**: Prefer exceptions over error codes. Don't return error codes that callers ignore.
- **Write try–catch–finally first**: Define the normal and error path; then fill in.
- **Provide context**: Include enough information in exceptions (and logs) to debug; avoid empty catch blocks.
- **Define boundaries**: Don't let raw third-party or system errors leak across API boundaries; wrap or map to your own types.

## Boundaries

- **Encapsulate third-party code**: Don't spread calls to libraries/frameworks everywhere. Wrap in small adapters so you can change or mock them.
- **Use integration points in tests**: Prefer tests that hit a small, real boundary (e.g. a test double at the edge) over mocking every external call deep inside the code.

## Unit Tests (Clean Tests)

- **One assert per test (guideline)**: Prefer one logical concept per test. Multiple asserts on the same concept are acceptable; avoid testing many unrelated things in one test.
- **Readable**: Test should read like a short narrative (arrange–act–assert or given–when–then). Avoid mystery guest data; make setup clear.
- **Fast, independent, repeatable**: No shared mutable state; no flaky order; no real I/O if you can avoid it (use doubles).
- **Self-validating**: Pass/fail; no manual inspection of logs or files.

## Design and Principles

- **DRY**: Don't repeat yourself. Duplication is often the root of evil; extract once and reuse.
- **Single Responsibility**: A class/module should have one reason to change. If you can describe it with "and", consider splitting.
- **Dependency rule**: Dependencies point inward. High-level policy should not depend on low-level details; both can depend on abstractions.

## Quick Checklist (when editing code)

- [ ] Names reveal intent; no disinformation or noise.
- [ ] Functions are small and do one thing at one level of abstraction.
- [ ] No unnecessary comments; code is self-explanatory where possible.
- [ ] Error handling is explicit; no swallowed or empty catches.
- [ ] Tests are readable, focused, and deterministic.

For more detail and examples, see [reference.md](reference.md).
