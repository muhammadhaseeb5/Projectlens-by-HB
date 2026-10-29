# ProjectLens

Sir Hassan Abbas’s Web Technology workspace for assignments, individual and group projects, private source review, and released results. React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form/Zod, and Supabase.

## Start the application

Node.js 24 is recommended. The connected frontend environment is already in the ignored `.env.local` file.

```powershell
npm ci
npm run dev
```

Open **http://localhost:3000**. `/demo` is a clearly labeled, read-only demonstration containing three original example briefs. Demo examples are never inserted into Supabase and contain no fabricated grades, analysis findings, unread counts, or student accounts.

For another checkout, copy `.env.example` to `.env.local` and set the Supabase project URL and **publishable** key. Never use a service-role key or database password in a `VITE_` variable.

## Connected backend and teacher activation

The actual Supabase project is **projectlens**, reference `mspkadiiwjekolvhqbkf`, in the existing organization, using the quoted free option. Dashboard: https://supabase.com/dashboard/project/mspkadiiwjekolvhqbkf

Applied migrations create 25 public tables protected by RLS, two private setup tables, transactional mutations, indexes, a private `project-source` Storage bucket, and the initial Web Technology class with sections A, B, and C. Institution and semester labels are intentionally unset. The editable class timezone defaults to `Asia/Karachi`.

An actual Supabase Auth invitation was successfully sent to **hassanabbas@tuf.edu.pk**. No password was created. With the local app running, Sir Hassan Abbas should open the invitation and choose his own password. The app handles invitation callbacks and routes them to `/update-password`, including when Supabase falls back to the default site root. Verification of this exact pre-authorized email activates the teacher role and assigns the initial class. Until verification, the account has no teacher privileges.

The one-time provisioning endpoint has been permanently replaced with a disabled handler and requires gateway JWT verification. It cannot provision more users. If an invitation expires, resend it through Supabase Dashboard → Authentication → Users; do not change roles using editable user metadata.

Public registration creates students only. Share enrollment codes from **Classes & sections → Show section enrollment codes**. Codes are private to the teacher, section-specific, expiring, and rotatable. Existing enrollment corrections preserve history and require the teacher. Historical roll numbers cannot be reassigned to another student in the same class.

## Authentication configuration still requiring dashboard access

The connector supports project/schema/functions administration and was used for the real setup. It does **not** expose hosted Auth configuration updates. Live public Auth settings confirm email sign-up is enabled and email auto-confirmation is disabled.

In Supabase Dashboard → Authentication → URL Configuration:

1. For local use, keep Site URL `http://localhost:3000`.
2. Add `http://localhost:3000/verify` and `http://localhost:3000/update-password` to Redirect URLs. Add equivalent `127.0.0.1:3000` URLs if you use that hostname.
3. Once Netlify supplies the final HTTPS URL, change Site URL to that origin and add its `/verify` and `/update-password` URLs. Retain local redirects for development if needed.
4. In Authentication → Email settings, keep email confirmation enabled and set the hosted minimum password length to 10 to match the application. Review mail delivery settings before inviting a whole class; the initial teacher invitation was accepted by Supabase, but receipt and link redemption require the recipient.

`supabase/config.toml` contains the corresponding **local** configuration. It does not claim to have changed hosted Auth settings. PKCE signup and recovery links should be opened in the browser that initiated the flow. Admin invitation callbacks are handled separately.

## Classroom workflow

1. Teacher edits class details and shares separate A/B/C codes.
2. Teacher publishes assignments with section-specific instructions/deadlines, required features, submission rules, and a rubric totaling 100.
3. Students enroll, create an individual project, or create a group and invite same-section classmates. Group invitations require acceptance; exclusive assignment membership and size limits are enforced transactionally.
4. Students save and submit proposals when required. Teacher proposal approval is separate from final approval.
5. A leader prepares a version draft, uploads a source ZIP, validates it, and explicitly submits. Project details, member names, roll numbers, and contribution summaries are snapshotted at submission.
6. Teacher starts a review, inspects files and findings, adds version/file/line feedback, and saves shared and private individual marks.
7. Teacher records an approval/revision decision and explicitly releases saved results. All grade changes record previous and next values in audit history. New versions require requested changes and the assignment’s resubmission policy.
8. Print saved review sheets or export authorized section summaries/evaluations. Student sheets omit other members’ individual results and private feedback. CSV cells are escaped and formula-prefixed fields are neutralized.

Rubrics and assignment requirements can be edited before projects exist. Once work exists, this version deliberately preserves that assignment’s grading contract; create a new assignment for a changed rubric rather than rewriting criteria used by existing evaluations.

## Source uploads and analysis

`supabase/functions/analyze-source` is deployed to the actual project. It authenticates with `auth.getUser()`, independently verifies the project leader, and uses service-role credentials only from the Edge runtime. Gateway legacy JWT verification is disabled because the handler validates users itself and supports the project’s current signing keys.

Limits: **10 MB compressed, 25 MB expanded, 400 ZIP entries, 1 MB per indexed file, 15 seconds for archive expansion, and 45 seconds for the processing pipeline**. Network operations have an 8-second timeout. Concurrent processing is locked; raw source cannot be replaced while validation runs. Crashed processing leases expire after two minutes, allowing a retry.

ZIP checks reject traversal/absolute/Windows paths, encryption, symlinks, nested archives, executable programs, unsupported compression, mismatched headers, duplicate paths, ZIP64, and split archives. Compressed data is fed to the inflater in small chunks so forged expanded-size metadata cannot bypass output bounds. Dependencies, build output, repository metadata, potential secret files, unsupported files, and oversized files are excluded from indexing. The original archive remains private.

Put source files, screenshots (PNG/JPEG/WebP), and documentation (Markdown/text/PDF) inside the source ZIP. Extracted documentation/screenshots are available in the Files tab; downloads use authorized 60-second signed access. Submitted source has no client update/delete path. Failed validation remains visible on the draft; upload a corrected archive to retry.

Supported checks are defined static heuristics: README/source presence, selected HTML accessibility prompts, `eval`, raw React HTML injection APIs, console logging, and assignment keyword evidence. Every finding includes rule, severity, explanation, file path, line when applicable, and a suggested next step. Coverage lists distinguish checked, skipped, and unsupported files. Keyword evidence never verifies functionality. These are not parser/linter coverage, a security audit, plagiarism detection, AI-authorship detection, functional execution, or grading.

No student code is executed and no uploaded dependency is installed. Repository/deployment links are external references; the backend does not fetch arbitrary URLs. An execution-based runner is intentionally absent. Bounded validation and static checks currently run together in one Edge request; very large or unsupported projects need a smaller source archive, not an unbounded worker. Manual review does not depend on a future execution runner.

## Deployment to Netlify

No Netlify connection or credentials were available, so **the frontend has not been deployed**. `netlify.toml` is ready with Node 24, Vite build, `dist` publishing, SPA fallback, and security headers.

1. Import this repository into Netlify or select the local source through an authorized Netlify workflow.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the existing ignored environment. No backend secret belongs on Netlify’s frontend build.
3. Use build command `npm run build` and publish directory `dist` (already configured).
4. Deploy, then configure the exact production Auth URLs above.
5. Check a refreshed nested route such as `/app/projects`, verify a real teacher/student login, upload a small ZIP, submit, evaluate, and release results with authorized accounts. Netlify’s rewrite is configured; live Netlify refresh behavior cannot be verified before deployment.

## Verification and maintenance

```powershell
npm run build
npm test
# With the app running:
npm run test:ui
npm run test:review
```

`test:ui` checks 17 routes at 360/768/1024/1440 px, horizontal overflow, page headings, section filtering, search, and grid/table views. `test:review` checks eight teacher/student review views, file/line feedback payloads, saved marks, student-private sheet content, code rendered as text, and print layouts. Its browser fixtures intercept every Supabase request and never mutate production. Both support a `BASE_URL` environment variable for testing the built preview. Chrome must be installed for browser tests.

`supabase/tests/authorization.sql` runs **54 real database assertions** using transaction-scoped fixtures, simulated JWT subject claims, and actual authenticated-role grants/RLS. It tests role protection, unrelated classes/students, section assignment visibility, group acceptance/size/exclusivity, source locking, immutable versions, deadline enforcement, correct evaluation linkage, draft/released privacy, individual feedback, counts/export source rows, notifications, and audit protection. Every fixture and simulated teacher-verification change is rolled back. Run it through the connected SQL tool or an authorized database-owner SQL session. It does not validate email delivery or substitute for an actual signed-in browser session.

Migrations are tracked in `supabase/migrations`; update them through the normal Supabase migration workflow. Generated schema types are in `src/lib/database.types.ts`. Query state loads only RLS-authorized records, paged past the Data API’s 1,000-row default; library search/sort/display pagination currently run over those authorized rows. For substantially larger classrooms, move those predicates/counts into a paged server query rather than granting broader access.

Do not delete the teacher allowlist or reset a teacher’s password as a troubleshooting shortcut. Use Supabase’s ordinary recovery process. Review audit history, Auth logs, Edge Function errors, Storage usage, and database advisors when maintaining the deployment. Abandoned draft archives can be removed later through an explicitly authorized retention workflow; no background deletion is configured.

The security advisor’s remaining notice is **Leaked Password Protection Disabled**, a [Pro-plan feature](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No upgrade or paid feature was enabled. Source permissions and RLS checks pass independently of this optional account feature.

Current implementation evidence and external verification limits are recorded in `VERIFICATION.md`.

Official references used: [Vite](https://vite.dev/guide/), [Tailwind/Vite](https://tailwindcss.com/docs/installation/using-vite), [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Auth redirects](https://supabase.com/docs/guides/auth/redirect-urls), and [Netlify/Vite](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/).
