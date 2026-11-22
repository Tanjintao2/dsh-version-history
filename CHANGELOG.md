# Changelog

All notable changes to this plugin. Versions follow the git tags in this repo;
each tag has a matching GitHub Release with an installable tarball.

## 0.1.4

- Drop `"private": true` so the package can be installed from the tarball (and is
  no longer marked unpublishable); add `publishConfig.access = public`.
- Add this CHANGELOG and ship it in the tarball.
- Docs only since 0.1.3: `docs/icon.png` (180×180) and root `screenshots.json`
  for the plugin listing.

## 0.1.3

- **Portable paths.** New `lib/paths.js`: every default (reports dir, scripts dir,
  repos root, git executable, LAN port) now derives from `DSH_VH_ROOT`, which
  defaults to `~/.dsh-version-history`. Override order is config > env > default.
  `cordis.patch.yml` therefore ships `config: {}` — no per-machine paths in the
  bundle.
- **MIT license** (`LICENSE`, `package.json` `license`).
- README rewritten: install, configuration table, external-script contract,
  route list, screenshots.
- Panel screenshots under `docs/screenshots/`.

## 0.1.2

- Left column "repository sources" card: name + `local` / `LAN` badge + commit and
  tag counts, full path on a second line, collapsible.
- Mini-button styling scoped to `.vh-src`.

*(Reverted in `429e33b` and re-landed as part of 0.1.3 — the revert was a
mis-committed working tree, not a design change.)*

## 0.1.1

- NVMe power-on hours, host writes and unsafe shutdowns are read through
  `smartctl` (`-j -a /dev/pdN`), because `MSFT_StorageReliabilityCounter` returns
  them empty on NVMe. SSD cards show written bytes, media errors and spare left.
- SMART snapshot records `source` / `nvmeVia` so you can tell where a number came
  from.

## 0.1.0

- First usable release: three-column panel (version / detail / disks), tag
  timeline with per-tag files and commits, disk health + SMART column, LAN git
  sharing over Smart HTTP, GitHub bind / test / push card.
- Data comes from the user's own PowerShell scripts (`visualize.ps1`,
  `disk-health.ps1`, `disk-health-admin.ps1`, `dpapi.ps1`); the plugin ships the
  panel and the routes that invoke them. See `docs/DETAIL.md` for the contract.
