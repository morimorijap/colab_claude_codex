const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Apply a code suggestion to a file
 */
function applySuggestion(suggestion) {
  try {
    const { file, line_start, line_end, suggested_code, original_code } = suggestion;

    if (!file || !suggested_code) {
      core.warning(`Skipping suggestion without file or code: ${suggestion.id}`);
      return false;
    }

    const filePath = path.resolve(file);

    if (!fs.existsSync(filePath)) {
      core.warning(`File not found: ${filePath}`);
      return false;
    }

    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Apply the suggestion
    if (line_start && line_end) {
      // Replace specific lines
      const newLines = suggested_code.split('\n');
      lines.splice(line_start - 1, line_end - line_start + 1, ...newLines);
      content = lines.join('\n');
    } else if (original_code) {
      // Replace by matching content
      if (!content.includes(original_code)) {
        core.warning(`Original code not found in ${file}`);
        return false;
      }
      content = content.replace(original_code, suggested_code);
    } else {
      core.warning(`Cannot apply suggestion without line numbers or original code`);
      return false;
    }

    // Write the file
    fs.writeFileSync(filePath, content);
    core.info(`Applied suggestion to ${file}`);
    return true;

  } catch (error) {
    core.warning(`Failed to apply suggestion: ${error.message}`);
    return false;
  }
}

/**
 * Evaluate if a suggestion should be auto-applied
 */
function shouldAutoApply(suggestion, autoApplyEnabled) {
  if (!autoApplyEnabled) return false;

  // Auto-apply only low-risk, high-confidence suggestions
  const isLowRisk = suggestion.impact?.risk === 'low';
  const isHighConfidence = suggestion.confidence >= 0.9;
  const isNotBreaking = suggestion.breaking_change !== true;

  return isLowRisk && isHighConfidence && isNotBreaking;
}

/**
 * Create a commit with applied suggestions
 */
async function createCommit(octokit, appliedSuggestions) {
  try {
    // Stage changes
    execSync('git add -A');

    // Create commit message
    const message = `Apply Codex AI suggestions

Applied ${appliedSuggestions.length} suggestion(s):
${appliedSuggestions.map(s => `- ${s.message || s.type}`).join('\n')}

Co-authored-by: Codex AI <codex@openai.com>`;

    // Commit
    execSync(`git config user.name "Codex AI Bot"`);
    execSync(`git config user.email "codex-bot@github.com"`);
    execSync(`git commit -m "${message}"`);

    // Get commit SHA
    const sha = execSync('git rev-parse HEAD').toString().trim();
    core.info(`Created commit: ${sha}`);

    return sha;

  } catch (error) {
    core.warning(`Failed to create commit: ${error.message}`);
    return null;
  }
}

/**
 * Main execution
 */
async function run() {
  try {
    // Get inputs
    const suggestionsFile = core.getInput('suggestions-file', { required: true });
    const applyListInput = core.getInput('apply-list');
    const autoApply = core.getInput('auto-apply') === 'true';
    const token = core.getInput('github-token', { required: true });

    // Parse apply list
    const applyList = applyListInput
      ? applyListInput.split(',').map(id => id.trim())
      : [];

    // Initialize Octokit
    const octokit = github.getOctokit(token);

    // Read suggestions file
    const suggestionsPath = path.resolve(suggestionsFile);
    if (!fs.existsSync(suggestionsPath)) {
      throw new Error(`Suggestions file not found: ${suggestionsPath}`);
    }

    const data = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8'));
    const suggestions = data.suggestions || [];

    core.info(`Processing ${suggestions.length} suggestions`);

    // Filter suggestions to apply
    const toApply = suggestions.filter((s, index) => {
      const id = s.id || `suggestion-${index}`;

      // Check if in apply list
      if (applyList.length > 0) {
        return applyList.includes(id);
      }

      // Check if should auto-apply
      return shouldAutoApply(s, autoApply);
    });

    core.info(`Will apply ${toApply.length} suggestions`);

    // Apply suggestions
    const results = {
      applied: [],
      failed: []
    };

    for (const suggestion of toApply) {
      if (applySuggestion(suggestion)) {
        results.applied.push(suggestion);
      } else {
        results.failed.push(suggestion);
      }
    }

    core.info(`Applied: ${results.applied.length}, Failed: ${results.failed.length}`);

    // Create commit if changes were made
    let commitSha = null;
    if (results.applied.length > 0) {
      commitSha = await createCommit(octokit, results.applied);

      // Push changes
      if (commitSha) {
        try {
          execSync('git push');
          core.info('Pushed changes to remote');
        } catch (error) {
          core.warning(`Failed to push: ${error.message}`);
        }
      }
    }

    // Write results file
    const resultsPath = 'suggestion-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      applied: results.applied.map(s => ({
        id: s.id,
        message: s.message,
        file: s.file
      })),
      failed: results.failed.map(s => ({
        id: s.id,
        message: s.message,
        reason: 'Application failed'
      })),
      commit_sha: commitSha
    }, null, 2));

    // Set outputs
    core.setOutput('applied-count', results.applied.length);
    core.setOutput('failed-count', results.failed.length);
    core.setOutput('commit-sha', commitSha || '');

    // Post summary comment
    if (github.context.issue.number) {
      const summary = `## 🤖 Codex Suggestions Applied

**Applied**: ${results.applied.length} suggestion(s)
**Failed**: ${results.failed.length} suggestion(s)
${commitSha ? `**Commit**: ${commitSha.substring(0, 7)}` : ''}

${results.applied.length > 0 ? `
### ✅ Successfully Applied:
${results.applied.map(s => `- ${s.message || s.type}`).join('\n')}
` : ''}

${results.failed.length > 0 ? `
### ❌ Failed to Apply:
${results.failed.map(s => `- ${s.message || s.type}`).join('\n')}
` : ''}`;

      await octokit.rest.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: github.context.issue.number,
        body: summary
      });
    }

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

// Run the action
run();