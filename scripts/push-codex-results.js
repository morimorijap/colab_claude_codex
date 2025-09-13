#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Push local Codex review results to GitHub PR
 */
class CodexResultsPusher {
  constructor() {
    this.resultDir = '.codex-results';
  }

  /**
   * Get current PR number from git/gh
   */
  getCurrentPRNumber() {
    try {
      // Try using gh CLI first
      const output = execSync('gh pr view --json number', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      const pr = JSON.parse(output);
      return pr.number;
    } catch {
      // Try to extract from branch name
      try {
        const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        const match = branch.match(/pr[/-]?(\d+)/i);
        return match ? match[1] : null;
      } catch {
        return null;
      }
    }
  }

  /**
   * Read the latest review results
   */
  getLatestResults() {
    const jsonPath = path.join(this.resultDir, 'latest-review.json');
    const mdPath = path.join(this.resultDir, 'latest-review.md');

    if (fs.existsSync(mdPath)) {
      // Prefer markdown for better formatting
      return {
        format: 'markdown',
        content: fs.readFileSync(mdPath, 'utf8')
      };
    } else if (fs.existsSync(jsonPath)) {
      // Fallback to JSON
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      return {
        format: 'json',
        content: this.formatJsonAsComment(data)
      };
    } else {
      throw new Error('No review results found. Run local-codex-review.js first.');
    }
  }

  /**
   * Format JSON results as a PR comment
   */
  formatJsonAsComment(data) {
    let comment = '## 🖥️ Local Codex Review Results\n\n';
    comment += `**Timestamp**: ${data.timestamp}\n`;
    comment += `**Mode**: ${data.mode} (${data.subscription})\n`;
    comment += `**Cost**: ${data.cost}\n`;
    comment += `**Files Reviewed**: ${data.files_reviewed}\n`;
    comment += `**Total Suggestions**: ${data.total_suggestions}\n\n`;

    if (data.results) {
      data.results.forEach(result => {
        comment += `### 📄 ${result.file}\n\n`;

        if (result.suggestions.length === 0) {
          comment += '✅ No issues found\n\n';
        } else {
          result.suggestions.forEach((s, i) => {
            comment += `${i + 1}. **${s.message}**\n`;
            if (s.line) comment += `   - Line: ${s.line}\n`;
            comment += `   - Severity: ${s.severity}\n`;
            comment += `   - Type: ${s.type || 'general'}\n\n`;
          });
        }
      });
    }

    comment += '\n---\n';
    comment += '*Review performed locally using ChatGPT Plus subscription (no API costs)*';

    return comment;
  }

  /**
   * Push results to GitHub PR
   */
  async pushResults(prNumber = null) {
    console.log('📤 Pushing Codex results to GitHub...\n');

    // Get PR number
    const pr = prNumber || this.getCurrentPRNumber();
    if (!pr) {
      console.error('❌ Could not determine PR number.');
      console.log('\nOptions:');
      console.log('  1. Run from a PR branch');
      console.log('  2. Specify PR number: npm run codex:push-results -- --pr 123');
      console.log('  3. Manually post results from .codex-results/latest-review.md');
      process.exit(1);
    }

    console.log(`📌 Target PR: #${pr}`);

    // Get results
    let results;
    try {
      results = this.getLatestResults();
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    }

    // Post to GitHub
    try {
      // Use gh CLI to post comment
      const tempFile = path.join(this.resultDir, 'comment.tmp');
      fs.writeFileSync(tempFile, results.content);

      execSync(`gh pr comment ${pr} --body-file "${tempFile}"`, {
        stdio: 'inherit'
      });

      // Clean up temp file
      fs.unlinkSync(tempFile);

      console.log(`\n✅ Results posted to PR #${pr}`);
      console.log(`🔗 View at: https://github.com/${this.getRepoInfo()}/pull/${pr}`);

    } catch (error) {
      console.error('❌ Failed to post comment:', error.message);
      console.log('\nAlternative: Copy the content from:');
      console.log(`  ${path.join(this.resultDir, 'latest-review.md')}`);
      console.log('And manually post it as a PR comment.');
      process.exit(1);
    }
  }

  /**
   * Get repository info from git remote
   */
  getRepoInfo() {
    try {
      const remote = execSync('git remote get-url origin', { encoding: 'utf8' });
      const match = remote.match(/github\.com[:/]([^/]+\/[^.]+)/);
      return match ? match[1] : 'owner/repo';
    } catch {
      return 'owner/repo';
    }
  }

  /**
   * Interactive mode - ask user for PR number
   */
  async interactivePush() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      const currentPR = this.getCurrentPRNumber();
      const prompt = currentPR
        ? `Enter PR number (default: ${currentPR}): `
        : 'Enter PR number: ';

      rl.question(prompt, (answer) => {
        rl.close();
        const prNumber = answer.trim() || currentPR;
        if (prNumber) {
          this.pushResults(prNumber);
        } else {
          console.error('❌ PR number is required');
          process.exit(1);
        }
        resolve();
      });
    });
  }
}

// CLI execution
if (require.main === module) {
  const pusher = new CodexResultsPusher();
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
Push Codex Results to GitHub PR

Usage:
  node push-codex-results.js [options]

Options:
  --help         Show this help message
  --pr <number>  Specify PR number explicitly
  --interactive  Ask for PR number interactively

Examples:
  npm run codex:push-results
  npm run codex:push-results -- --pr 123
  npm run codex:push-results -- --interactive

This tool posts local Codex review results as a comment on the GitHub PR.
    `);
    process.exit(0);
  }

  // Check for PR number in arguments
  const prIndex = args.indexOf('--pr');
  if (prIndex !== -1 && args[prIndex + 1]) {
    pusher.pushResults(args[prIndex + 1]);
  } else if (args.includes('--interactive')) {
    pusher.interactivePush();
  } else {
    // Auto-detect PR number
    pusher.pushResults();
  }
}

module.exports = CodexResultsPusher;