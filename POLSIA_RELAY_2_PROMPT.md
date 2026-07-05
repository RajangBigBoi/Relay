# Polsia Engineering Prompt: Relay 2.0 Founding Product Brief

You are the founding engineering team, product designer, UX lead, software architect, and technical co-founder for a new SaaS company called **Relay**.

## Important Context

Polsia already provisioned its own managed repository for Relay:

- Managed repo: `github.com/Polsia-Inc/polsia-app-218560`
- Managed deployment: `relay-1782572679191-mjbd.polsia.app`

The existing personal repo at `github.com/RajangBigBoi/Relay` is a separate codebase. Treat that repo only as reference material for product intent, data modeling, and previously explored implementation ideas. Do not assume Polsia can directly pull from it.

## Core Instruction

Forget the existing implementation.

Do **not** treat the current codebase as the product.

Treat it only as a starting point.

Your objective is to redesign Relay from first principles while preserving the strategic product intent: a modern hotel operations platform that can become the operating system for hotel operations.

## What Relay Is

Relay is a modern hotel operations platform.

Its purpose is to become the daily operational hub for hotel staff.

Relay is **not**:

- a Property Management System (PMS)
- an accounting platform
- a reservation engine
- an ERP
- a generic ticketing system

Instead, Relay sits above systems such as HotelKey, Opera, Mews, and RMS.

If those systems manage reservations and rooms, Relay manages:

- people
- communication
- incidents
- coordination
- accountability
- shift operations
- operational memory

## The Problem

Hotels rely on disconnected tools:

- WhatsApp
- Excel spreadsheets
- paper handover books
- whiteboards
- emails
- sticky notes
- phone calls
- memory

Operational information is constantly lost. Incidents are forgotten. Guest promises are missed. Departments become disconnected.

Managers spend too much time asking:

> What happened?

Instead of:

> What should I do next?

Relay exists to solve this.

## Product Vision

When a Duty Manager starts a shift, they should not have to read 15 emails, ask multiple departments what happened, search notebooks, or parse a wall of handover text.

They should open Relay and, within 10 seconds, understand:

- what happened
- what is happening
- what requires attention
- what should happen next

That is Relay.

## Product Philosophy

Every feature must answer one question:

> Does this genuinely improve hotel operations?

If not, do not build it.

Avoid generic SaaS features. Avoid unnecessary complexity. Prioritize operational clarity.

## Primary Users

Design first for:

- Duty Manager
- Front Office Manager
- Assistant Manager
- General Manager
- Night Manager
- Guest Service Agent
- Housekeeping Supervisor
- Engineering Supervisor
- F&B Supervisor

Eventually, Relay should support entire hotel teams across multiple properties.

## Product Personality

Relay should feel like **Mission Control**, not admin software.

Design inspiration:

- Linear
- Raycast
- GitHub
- Vercel
- Notion

Characteristics:

- calm
- premium
- minimal
- responsive
- dark-first
- information-rich
- operational
- fast under pressure

## Desired First-Run Experience

A manager logs in. Relay immediately says something like:

```text
Good afternoon.
Welcome back.

Occupancy today: 92%
Open incidents: 4
Critical incidents: 1
VIP arrivals: 3
Outstanding follow-ups: 2
Engineering workload: High

Today's priorities:
- Room 412 AC failure
- VIP amenities
- Guest follow-up Room 307
```

The manager immediately knows where to start.

No searching. No guessing. No information overload.

## Core Product Workflows

Think in operational workflows, not static pages.

### 1. Command Center

The operational overview. Everything important on one screen.

The Command Center should summarize:

- open incidents
- critical issues
- unresolved follow-ups
- shift priorities
- department workload
- recent activity
- handover warnings
- operational risks

### 2. Incidents

Operational issues requiring visibility and follow-up, including:

- guest complaints
- maintenance issues
- housekeeping issues
- security incidents
- lost property
- medical incidents
- noise complaints
- VIP service recovery
- room moves

Each incident should make ownership, status, priority, guest impact, and next action obvious.

### 3. Handovers

AM, PM, and Night shift transitions.

Handovers should reduce information loss and help the next manager understand the previous shift quickly.

Avoid long unstructured walls of text where possible. Encourage structured summaries, unresolved items, risks, and priorities.

### 4. Checklists

Recurring operational tasks, such as:

- shift opening
- shift closing
- Night Audit
- housekeeping checks
- engineering checks
- guest operations checks

Checklists should be operationally useful, not bureaucratic.

### 5. Guest Operations

Track guest-facing operational context, such as:

- VIPs
- guest requests
- service recovery
- late check-outs
- room moves
- follow-ups

Relay should not replace a PMS, but it should capture operational work that PMS tools do not handle well.

### 6. Staff

Staff directory, departments, roles, permissions, and availability.

Support hotel-realistic roles and departments:

- Admin
- Duty Manager
- Department Lead
- Staff
- Viewer

Departments:

- Front Office
- Housekeeping
- Maintenance / Engineering
- Security
- Management
- Food & Beverage

### 7. Analytics

Operational intelligence, not vanity dashboards.

Analytics should answer questions like:

- What keeps recurring?
- Which departments are overloaded?
- Which incident types take longest to resolve?
- What guest issues are repeated?
- What should management fix permanently?

### 8. Audit Trail

Every important action should be immutable and traceable.

Show who changed what, when, and why where relevant.

### 9. AI Assistance

AI should not be a generic chatbot.

AI should act as an operational assistant that:

- summarizes incidents
- prioritizes unresolved items
- highlights risk
- finds patterns
- reduces reading time
- prepares shift summaries

AI should never replace human judgment.

## Current Reference Implementation State

The existing reference repo has explored the following ideas and may be useful as context only:

- React + Vite + TypeScript single-page app
- Firebase Auth
- Firestore
- public landing/login/create-account routes
- protected app routes under `/app`
- duty/incident logs
- handover notes
- shift checklists
- staff profiles
- role-based permissions
- audit logs
- Vercel-style static deployment
- runtime Firebase configuration using either Vite env vars or a JSON runtime config

Do not copy poor UX or unnecessary implementation complexity. Rebuild workflows thoughtfully.

## Existing Data Concepts Worth Preserving or Re-evaluating

Relay currently thinks in these domain entities:

### DutyLog / Incident

Useful fields include:

- readable case ID
- created time
- shift
- room number
- guest name
- issue type
- department
- priority
- description
- action taken
- owner
- owner ID
- status
- follow-up required
- resolved time

Recommendation: treat this as an `Incident` domain object in the product language, even if the database collection remains `duty_logs` for compatibility.

### HandoverNote

Useful fields:

- date
- from shift
- to shift
- notes
- unresolved case IDs

Recommendation: structure this around summaries, risks, unresolved actions, and department notes rather than only free text.

### ShiftChecklist

Useful fields:

- task name
- category
- shift
- required
- completed
- completed by
- completed at

Recommendation: design checklists around speed and accountability.

### StaffMember

Useful fields:

- name
- role
- department
- email
- permissions
- created at

Recommendation: make access model explicit. Decide whether the product uses open self-signup, admin-invited users, or domain-restricted onboarding.

### AuditLog

Useful fields:

- target ID
- collection
- changed by
- timestamp
- action
- changes

Recommendation: preserve auditability from the beginning.

## Authentication and Access Direction

Relay should support:

- email/password login
- optional Google sign-in
- Firebase Auth or an equivalent managed authentication provider
- staff profile creation / assignment
- role-based access control

Important product decision:

For production hotels, Relay should likely use admin-managed access or controlled staff onboarding, not fully open public registration. Self-signup may be acceptable for demos, but real hotel operations data requires stronger access control.

## Firebase / Firestore Considerations

If using Firebase:

- Keep Firebase Auth and Firestore simple for MVP.
- Ensure all frontend config is loaded from deployment environment variables or managed runtime config.
- Do not commit secrets.
- Firestore security rules must align with the frontend onboarding/profile flow.
- Avoid frontend writes that rules will reject during initial app load.
- Staff profile bootstrap must be intentional and safe.

Known risk from previous implementation: app startup can appear blank if Firebase config is invalid, missing, mismatched, blocked by domain restrictions, or rejected by Firestore rules. The new implementation should surface clear diagnostic states rather than blank screens.

## Deployment Direction

The app should be deployable as a web-based SaaS front end.

Use the Polsia managed repo and deployment pipeline first:

- repo: `github.com/Polsia-Inc/polsia-app-218560`
- deployment: `relay-1782572679191-mjbd.polsia.app`

The app should work from:

- laptop
- home computer
- mobile browser
- hotel workstation

It should not require local installation for end users.

## UX Principles

Users are busy. Users are standing. Users are interrupted. Users are tired. Users are stressed.

Every interaction should:

- reduce clicks
- reduce reading
- reduce confusion
- increase confidence
- show the right information at the right time
- make responsibility obvious
- make the next action obvious

## Engineering Philosophy

Do not simply add features.

Challenge assumptions. Simplify workflows. Design around real hotel operations.

Whenever implementing a feature, ask:

- Is this solving a real operational problem?
- Is there a simpler workflow?
- Can this reduce cognitive load?
- Would an experienced Duty Manager naturally understand this interface?
- Does this help someone run a shift better?

## Success Metric

A Duty Manager should be able to start a shift, understand the hotel's operational state, assign work, track incidents, complete handovers, and leave an accurate record for the next shift without relying on paper notes, spreadsheets, WhatsApp, or memory.

## Long-Term Vision

Relay should eventually support:

- multi-property hotel groups
- housekeeping operations
- maintenance operations
- lost and found
- preventative maintenance
- SOP knowledge base
- mobile app
- push notifications
- AI shift intelligence
- AI incident summaries
- HotelKey integration
- Opera PMS integration
- Mews integration
- Microsoft Teams
- Slack
- email automation

## Immediate Build Recommendation

Start with a focused MVP that proves the core operational loop:

1. A polished public landing page that explains Relay.
2. Authentication.
3. Staff profile and role setup.
4. Command Center with operational overview.
5. Incident creation, assignment, status tracking, and resolution.
6. Shift handover creation and review.
7. Basic checklist completion.
8. Audit trail for important changes.

Do not build advanced integrations or broad AI features until the core shift workflow is excellent.

## First Engineering Task

Before writing code, produce a short implementation plan that explains:

- proposed app architecture
- first MVP workflows
- data model
- permission model
- onboarding model
- deployment assumptions
- what should be removed or ignored from the reference implementation
- what risks could block users from reaching the Command Center

Then implement the simplest version that makes the core shift workflow feel excellent.

## Final Reminder

Build Relay as if it will become the standard operating platform for the global hospitality industry.

Do not become attached to initial ideas. If you identify a workflow, architecture, or user experience that better serves hotel operations while staying aligned with Relay's vision, explain your reasoning and recommend the improvement before implementing it.

The goal is not to faithfully reproduce an existing app.

The goal is to build the best hotel operations platform possible.
