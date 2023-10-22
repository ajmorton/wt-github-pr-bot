const pr_title_check_name = "PR title matches `WT-[0-9]+ .*`"
const appId = process.env.APP_ID

export function register_pr_title_check_hooks(app) {

    // PR creation.
    app.webhooks.on('pull_request.opened', async ({ octokit, payload }) => {
        run_pr_title_check(octokit, payload, payload.pull_request.head.sha)
    })
  
    // When the PR details (title, description, etc), not the code, have changed.
    app.webhooks.on('pull_request.edited', async ({ octokit, payload }) => {
        // If the title hasn't changed there's no need to re-check it
        if(payload.changes.title) {
            run_pr_title_check(octokit, payload, payload.pull_request.head.sha)
        }
    })
  
    // On new commits to the PR rerun the check for the latest commit.
    app.webhooks.on('pull_request.synchronize', async ({ octokit, payload }) => {
        run_pr_title_check(octokit, payload, payload.pull_request.head.sha)
    })
  

    // FIXME - the retry all button is only for suites. Abandon the retry option?
    //         should check_suite.rerequest just rerun all checks?
    // Events that restart checks
    app.webhooks.on('check_run.rerequested', async ({ octokit, payload }) => {
        if (payload.check_run.app.id === appId) {
            const check_run_name = await get_check_run_name(octokit, payload)
            if(check_run_name === pr_title_check_name) {
                run_pr_title_check(octokit, payload, payload.check_run.head_sha)
            }
        }
    })

}

// Run the PR title check task. This verifies that the PR title begins with a wiredtiger ticket
async function run_pr_title_check(octokit, payload, head_sha) {

    const pr_title_regex = /WT-[0-9]+ .*/
    const pr_title = await get_pr_title(octokit, payload)
    const conclusion = pr_title_regex.test(pr_title) ? 'success' : 'failure'
  
    // This is a quick check. Just run it and create
    // Usually for longer tasks we'd create it here and then execute it in the check_run.create hook
    octokit.rest.checks.create({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        name: pr_title_check_name,
        output: {
            title: "",
            summary: `WiredTiger automation tools use PR titles and commit messages of the \
            resulting merge commit (which is derived from the PR title) to update Jira tickets.
            For this to work the commit and PR title must begin with the wiredtiger ticket number \
            followed by a space.`,
        },
        head_sha: head_sha,
        status: 'completed',
        conclusion: conclusion,
    })
}

// Helper func, get name of check run
// FIXME - move into common file
async function get_check_run_name(octokit, payload) {
    const check_run_id = payload.check_run.id
    const check_info = await octokit.rest.checks.get({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        check_run_id: check_run_id,
    });
    return check_info.data.name
}

async function get_pr_title(octokit, payload) {
    if(payload.check_run) {
        // FIXME - Multiple PRs can be returned here (see the [0]).
        // Check runs are associated with a specific commit, and WiredTiger practices mean 
        // a commit will only ever be associated with a single pull request. (Backports use 
        // the newly merged commit from the prior release branch)
        const pr_number = payload.check_run.check_suite.pull_requests[0].number
        const pr_info = await octokit.rest.pulls.get({
            owner: payload.repository.owner.login,
            repo: payload.repository.name,
            pull_number: pr_number,
        })
        return pr_info.data.title
    } else if(payload.pull_request) {
        return payload.pull_request.title        
    } else {
        throw `Can't find PR title for payload: ${payload}`
    }
}