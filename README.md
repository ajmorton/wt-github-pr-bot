# wt-github-pr-checker

Quality checks for WiredTiger PRs.
- When external users (those not in the wiredtiger organisation) open a PR post a welcome message with instructions on signing the collaborators agreement, and add a check that reminds reviewers to verify the agreement has been signed
- Validate that the PR title begins with a WT ticket required by our automation tasks
- When a PR is opened automatically assign developers (as assignees, not reviewers) based on the Jira ticket's listed components and the contents of `tools/pull_requests/sme_groups.json`

<!-- FIXME - make sure that the sme_groups.json file is added to the repo if/when we migrate the tool to wiredtiger -->

## Requirements

- Node.js 12 or higher
- A GitHub App with:
  - Subscriptions to the following events:
    - Pull Request
    - Check Run
    - Check Suite
  - The following permissions:
    - Repo::Checks: Read & write
    - Repo::Contents: Read only
    - Repo::Metadata: Read only 
    - Repo::Pull requests: Read & write
    - Organisation::Members: Read only

## Env file

Environment variables are currently stored in a local `.env` file that sits at the root dir of this repo.
The file should contain the following fields:
```bash
# Disable any Github API calls that would modify the PR. Read-only calls are still allowed
# Only the value `true` will enable dry runs.
DRY_RUN=true

# The following settings are located on the Github App page where you have created the app. This will be located in `Settings/Developer Settings`.

# Found under `About`
APP_ID="123"

# Found under `Webhook secret`
WEBHOOK_SECRET="secretstring"

# .pem file created in the `Private keys` section. Download this file and provide its absolute file path
PRIVATE_KEY_PATH="path/to/file.pem"
```

## Setup

1. Clone this repository.
2. Create a `.env` as described in `Env file` and set values
3. Install dependencies with `npm install`.
4. Start the server with `npm run server`.
5. Ensure your server is reachable from the internet.
    - If you're using `smee`, run `smee -u <smee_url> -t http://localhost:3000/api/webhook`.
6. Ensure your GitHub App includes at least one repository on its installations.

## Usage

When running the server will [receive webhooks](https://docs.github.com/en/webhooks/webhook-events-and-payloads#pull_request) on any repository that app has been granted access to.
It will perform checks and post comments as defined in `app.js`

## Security considerations
<!-- FIXME - Do this properly -->
To keep things simple, this example reads the `GITHUB_APP_PRIVATE_KEY` from the
environment. A more secure and recommended approach is to use a secrets management system
like [Vault](https://www.vaultproject.io/use-cases/key-management), or one offered
by major cloud providers:
[Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/secrets/quick-create-node?tabs=windows),
[AWS Secrets Manager](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/),
[Google Secret Manager](https://cloud.google.com/nodejs/docs/reference/secret-manager/latest),
etc.
