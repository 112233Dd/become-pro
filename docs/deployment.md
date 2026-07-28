# Become Pro Deployment

Production site:

- Domain: https://becomeprofootball.com
- Vercel project: `become-pro`
- Vercel project ID: `prj_VM6IpfdFezcbHkQysp0edez4tho0`
- Vercel team ID: `team_FXNIgLeOo6dIPUWOLSqZeodm`
- GitHub repository: `112233Dd/become-pro`
- Production branch: `main`

## Vercel Settings

This site is a static HTML/CSS/JavaScript site. The Vercel project must not use
the Next.js framework preset for the static version of the site.

Expected project settings:

- Framework preset: Other / no framework
- Build command: empty
- Install command: empty
- Output directory: empty
- Production branch: `main`

The routing rules for clean URLs and static page rewrites live in
`vercel.json`.

## Access Token

Use a local environment variable for Vercel API access:

```text
VERCEL_TOKEN=<vercel-token>
```

Do not commit real tokens, API keys, passwords, or environment secrets to this
repository. Store them in Vercel project environment variables or as local user
environment variables on the deployment machine.

For this workstation, these user environment variables are expected:

```text
VERCEL_TOKEN
BECOME_PRO_VERCEL_TEAM_ID
BECOME_PRO_VERCEL_PROJECT_ID
```

## Production Verification

After a production deployment, check at least:

- https://becomeprofootball.com/
- https://becomeprofootball.com/programs
- https://becomeprofootball.com/cart
- https://becomeprofootball.com/contact

The static site should include canonical tags, mobile quick action buttons, the
improved empty cart state, and the contact reassurance block.
