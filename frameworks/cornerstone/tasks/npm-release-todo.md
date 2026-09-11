# Paired npm publication

- [x] Confirm npm account and choose `@quinntyne/cornerstone` and `@quinntyne/cornerstone-design-system`.
- [x] Update package references, consumers, schematics, generators, and package checks.
- [x] Test semantic version selection, partial failure, duplicates, collisions, ordering, and latest protection.
- [x] Implement durable release reservations and paired publication.
- [x] Share CI verification and configure main-only OIDC workflow.
- [x] Document setup and recovery.
- [x] Complete repository validation and publication dry run (18 browser scenarios, 6 unit tests, 2 token tests, release tests, all builds and quality checks).
- [x] Publish the first package pair (`0.1.0`) and configure trusted publishing for both packages.
- [x] Verify the registry consumer for `0.1.0`.

Automatic publication evidence is retained in the
[Release workflow](https://github.com/QuinntyneBrown/Cornerstone/actions/workflows/release.yml)
and each completed GitHub release record. These include full validation, the
exact source commit, package integrities, and registry consumer verification.
