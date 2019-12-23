const github = require('@actions/github');
const core = require('@actions/core');

const repoUrl = process.env.GITHUB_REPOSITORY;
const [ owner, repo ] = repoUrl.split('/');    

let pr;

class PullRequest {

  constructor(githubToken) {
    this.octokit = new github.GitHub(githubToken);          
  }

  async fetch() {
    if (pr) return pr;
         
    const { data: pullRequests } = await this.octokit.pulls.list({
      owner,
      repo,
      state: 'open'
    });
  
    return pr = pullRequests.filter(pr => pr.head.sha === process.env.GITHUB_SHA)[0];
  
  }

  async addComment(comment) {
    const pr = await this.fetch();

    const { number: issue_number } = pr;

    // delete previous comments
    const { data: comments }  = await this.octokit.issues.listComments({
      owner,
      repo,
      issue_number
    });


    await Promise.all(
      comments.filter(c => {
        return (c.user.login === 'github-actions[bot]') && (c.body.indexOf(comment.attribution) === 0);
      }).map(c => this.octokit.issues.deleteComment({
        owner,
        repo,
        comment_id: c.id
      }))
    );
    
    return this.octokit.issues.createComment({
      owner,
      repo,
      issue_number,
      body: comment.body,
    });
  }

  async addLabel(label) {
    this.octokit.issues.addLabels({
      owner,
      repo,
      issue_number,
      labels: [label]
    });
  }

  async removeLabel() {

  }

}

module.exports = PullRequest;
