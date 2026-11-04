# Memo

This application was created to use all major Angular features in a small app.

## What it does

Memo is a small memory training app. The player should memorize a series of icons in changing colors. After the training phase the player has to remember the icons first and the colors thereafter, in the correct sequence.

## Angular features
The following features are planned to be used at the end:
* Components
* Routing
* Angular Material
* Reactive forms with
  * Validation
  * Pipes
* Redux
* Service for HTTP requests
* DI
* Unit tests

## Deployment

Every push to `master` runs `.github/workflows/deploy.yml`: it runs the unit tests, builds the app and uploads `dist/memo/browser` to the Hetzner webhosting with rsync over SSH. It can also be started by hand under *Actions → Deploy → Run workflow*.

`src/.htaccess` is part of the build. It sends every path that is not a file to `index.html`, so deep links like `/teach` survive a reload.

One-time setup:

1. Create a key pair just for deployments, without a passphrase: `ssh-keygen -t ed25519 -N "" -C "github-deploy-memo" -f memo_deploy`.
2. Add the content of `memo_deploy.pub` as a new line to `~/.ssh/authorized_keys` on the webhosting.
3. Get the host key: `ssh-keyscan -p 222 <host>`. On Windows, use Git Bash: the `ssh-keyscan` that ships with Windows fails with `unsupported KEX method sntrup761x25519-sha512@openssh.com`.
4. Add these repository secrets under *Settings → Secrets and variables → Actions*:

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | SSH host of the webhosting |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_SSH_KEY` | content of `memo_deploy` (the private key) |
| `DEPLOY_KNOWN_HOSTS` | output of step 3 |
| `DEPLOY_PATH` | document root of the (sub)domain, e.g. `public_html/memo` |
| `DEPLOY_PORT` | optional, defaults to `222` |

`DEPLOY_PATH` must be a directory used only by this app: the upload deletes everything in it that is not part of the build (except `.well-known/`).
