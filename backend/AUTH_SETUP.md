# Authentication setup notes

This change adds password-based login and JWT issuance to the user service. It does not change existing user roles or delete user rows.

## Required local environment

Set these variables in your local, uncommitted environment before starting the user service:

- `JWT_SECRET`: a unique random secret of at least 32 bytes. Do not use the Compose placeholder or commit the secret.
- `BOOTSTRAP_ADMIN_EMAIL`: the Admin login email (the existing UI default is `admin@xebia.com`).
- `BOOTSTRAP_ADMIN_INITIAL_PASSWORD`: an operator-chosen temporary password of 12–72 characters. Do not put it in source control or chat.
- `BOOTSTRAP_ADMIN_NAME`: optional; defaults to `Admin User`.
- `JWT_ACCESS_TOKEN_MINUTES`: optional; defaults to 30.

The bootstrap is additive. If the email does not exist, it creates one `admin` row. If it already belongs to an Admin without a password hash, it initializes that row. It never changes a non-Admin account into an Admin and never overwrites an existing Admin password. The initial Admin must change the temporary password after first login.

For Render, the manifest marks the JWT secret and initial Admin password as unsynced environment values. Set them in the user-service environment settings; they are intentionally not stored in this repository.

## Existing five users

The five seeded teacher/student rows are preserved. No shared demo password is added. Their password hashes remain unset until the Admin provisions temporary passwords. After logging in, each account must change its temporary password before entering its portal.

The protected provisioning endpoint is:

`POST /api/v1/auth/admin/users/{userId}/temporary-password`

It requires a valid Admin Bearer token and a JSON body containing `temporaryPassword`. The server stores only a BCrypt hash and marks that account to change the password at next login. No plaintext password is logged or returned.

## Quick Access

Quick Access buttons only select an account and fill its email/role. They do not authenticate or supply a password. The user must enter the account's password and submit the login form.

## Scope limitation

This phase issues and checks JWTs for login, password change, and the Admin-only temporary-password endpoint, and applies a browser-side Admin route guard. Per the approved narrow scope, the rest of the LMS API routes have not yet been converted to JWT/RBAC enforcement. The browser guard is not a substitute for backend authorization on those APIs.
