# Resume Profile Separation Design

## Problem

The main resume currently selects the Daangn content profile through
`career_content_profile: daangn`. As a result, the public main page and the
Daangn page share Daangn's introduction and career overrides even though the
main route is intended to be company-neutral. Existing tests and production
notes also encode this coupling, making the mistake easy to reintroduce.

The site should have one clear main version and independently selectable
company-specific versions, while keeping common career facts in one source of
truth and publishing them through the existing GitHub Pages site.

## Goals

- Keep `/` and its `/resume/` alias company-neutral and sourced from
  `_data/main_career.yml`.
- Keep Daangn-specific content and appearance on `/daangn/` and
  `/daangn/portfolio/` only.
- Allow future company-specific resume and portfolio routes to use explicit
  profile keys without copying the full career history.
- Make it clear in the root README which data is shared, which data is an
  application override, which URLs are published, and how a new profile is
  added.
- Preserve the single GitHub Pages deployment and avoid changing unrelated
  resume, portfolio, or application-package content.

## Design

### One profile selector per page

Each resume page will use one `career_profile` value to select both its
company-specific content overrides and its visual treatment. The separate
`career_content_profile` selector will be removed. The layout will use the
selected profile when present, then fall back to the main career data for
shared facts and the main introduction.

- `/` and `/resume/`: `career_profile: main`
- `/daangn/`: `career_profile: daangn`
- Future support pages: a stable company/job key such as
  `career_profile: toss-securities-nodejs`

The main profile uses `_data/main_career.yml` as its canonical career content.
Company profiles in `_data/career_profiles.yml` contain only differences such
as an application-specific introduction, exclusions, description overrides,
links, and theme. The company profile must not become the source for the main
page.

Portfolio pages retain their existing independent `portfolio_profile`
selector: `/portfolio/` uses the general profile, and
`/daangn/portfolio/` uses the Daangn profile. Resume and portfolio profile
keys for one application should use the same stable slug where both pages
exist.

### Routes and source organization

All public pages remain on `https://limgiho.github.io/`, with route paths
separating the main site from application-specific pages. Existing routes are
preserved. New public application pages use a stable path such as
`/applications/toss-securities-nodejs/` rather than a dated workspace path.

Application working packages under `applications/` remain separate from the
curated Jekyll page sources and are excluded from the Pages artifact. Future
public application page entrypoints live under `pages/applications/<slug>/`
and use explicit permalinks such as `/applications/<slug>/`. A PDF or other
deliverable is published only when deliberately copied or generated under a
documented public asset path. Any existing application route that remains
required must have an explicit curated page entrypoint. This work will not
delete or rewrite the user's current application files.

### README and deployment

The root README becomes the entry point for the publishing model. It will
document:

1. the route map for the main resume, general portfolio, and application
   profiles;
2. the canonical shared data files and the application-specific override
   files;
3. the source locations for curated public pages versus application working
   packages, and the rule for publishing a deliverable;
4. how to add a company profile and connect its resume and portfolio routes;
5. the local build and verification commands, plus the existing GitHub Pages
   deployment workflow.

GitHub Pages remains a single deployment. Separate per-company sites or
workflows are out of scope unless a later requirement calls for distinct
domains or independent release schedules.

## Validation

- Build the Jekyll site and verify that `/` and `/resume/` render the main
  introduction and main career data, with the canonical URL remaining `/`.
- Verify that `/daangn/` still renders Daangn-specific content and theme, and
  that the Daangn portfolio route keeps its Daangn portfolio profile.
- Verify each curated application route selects its own profile and that
  application working packages are absent from the Pages artifact, while
  explicitly selected deliverables remain available.
- Update tests and production documentation so they reject main-to-Daangn
  content coupling.
- Run the existing Jekyll and portfolio verification commands and
  `git diff --check`.

## Non-goals

- Rewriting career claims, project descriptions, or application answers.
- Redesigning page layouts, typography, colors, or portfolio visuals.
- Creating a separate repository, custom domain, or Pages workflow per
  company.
- Removing current application files or committing any pre-existing user
  changes.
