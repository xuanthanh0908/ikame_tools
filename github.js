const simpleGit = require("simple-git");
const path = require("path");

// Specify the path to your local repository
const repoPath = "/path/to/repository";

// Specify the GitHub repository details
const githubUsername = "xuanthanh0908";
const githubRepository = "ikame_automate_tiktok";

// Initialize the Git repository
const repo = simpleGit({
  baseDir: process.cwd(),
});

// // Check if the repository exists locally, otherwise clone it
// if (!repo.checkIsRepoSync(repoPath)) {
//   const repoUrl = `https://github.com/${githubUsername}/${githubRepository}.git`;
//   repo.clone(repoUrl, repoPath);
// }

// Change directory to the repository
process.chdir(repoPath);

// Fetch the latest changes from the remote repository
repo.fetch();

// Checkout the desired branch (e.g., 'main' or 'master')
repo.checkout("main");

// Pull the latest changes from the remote repository
repo.pull();

// Print a success message
console.log("Code successfully pulled from GitHub.");
