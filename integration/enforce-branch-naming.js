// eslint-disable-next-line @typescript-eslint/no-var-requires
const { execSync } = require('child_process');

const branchName = execSync('git rev-parse --abbrev-ref HEAD') // NOSONAR
  .toString()
  .trim();

// Check if the branch name matches your naming conventions
// HEAD is included for rebase support
if (
  !branchName.match(/^(feature|fix|chore|refactor|release)\/.*/) &&
  !branchName.match('HEAD')
) {
  console.error(`Invalid branch name: ${branchName}`);
  console.error(
    'Your branch name must start with one of the following: feature/, fix/, chore/, refactor/, release/',
  );
  process.exit(1);
}
