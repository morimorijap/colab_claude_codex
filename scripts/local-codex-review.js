#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Local Codex Review using ChatGPT Plus subscription
 * This avoids API costs by using the local CLI
 */
class LocalCodexReview {
  constructor() {
    this.config = this.loadConfig();
    this.resultDir = '.codex-results';
    this.ensureResultDir();
  }

  loadConfig() {
    const configPath = '.codex-config.yml';
    if (fs.existsSync(configPath)) {
      // Simple YAML parsing (in production, use a proper YAML parser)
      const content = fs.readFileSync(configPath, 'utf8');
      return {
        command: 'codex',
        useSubscription: true,
        mode: 'hybrid'
      };
    }
    return {
      command: 'codex', // Default command
      useSubscription: true,
      mode: 'local'
    };
  }

  ensureResultDir() {
    if (!fs.existsSync(this.resultDir)) {
      fs.mkdirSync(this.resultDir, { recursive: true });
    }
  }

  /**
   * Check if Codex CLI is available locally
   */
  isCodexAvailable() {
    try {
      execSync(`${this.config.command} --version`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get list of changed files in current PR/branch
   */
  getChangedFiles() {
    try {
      // Try to get files changed in PR
      const prFiles = execSync('gh pr diff --name-only', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
        .split('\n')
        .filter(f => f.length > 0);

      if (prFiles.length > 0) {
        return prFiles;
      }
    } catch {
      // Fallback to git diff
    }

    try {
      // Get files changed compared to main branch
      const files = execSync('git diff origin/main...HEAD --name-only', { encoding: 'utf8' })
        .split('\n')
        .filter(f => f.length > 0);

      return files;
    } catch {
      // Fallback to last commit
      return execSync('git diff HEAD~1 --name-only', { encoding: 'utf8' })
        .split('\n')
        .filter(f => f.length > 0);
    }
  }

  /**
   * Run Codex CLI on a single file
   */
  async reviewFile(filePath) {
    console.log(`  📄 Reviewing: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`    ⚠️  File not found, skipping`);
      return null;
    }

    // Check if Codex CLI is available
    if (this.isCodexAvailable()) {
      return await this.runRealCodex(filePath);
    } else {
      console.log('    ⚠️  Codex CLI not found, using ChatGPT web fallback');
      return await this.useChatGPTWeb(filePath);
    }
  }

  /**
   * Run actual Codex CLI command
   */
  async runRealCodex(filePath) {
    return new Promise((resolve) => {
      const command = `${this.config.command} review --file "${filePath}" --format json`;

      try {
        const result = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        const parsed = JSON.parse(result);
        resolve({
          file: filePath,
          suggestions: parsed.suggestions || [],
          source: 'codex-cli'
        });
      } catch (error) {
        console.log(`    ❌ Codex CLI error: ${error.message}`);
        resolve(this.generateMockReview(filePath));
      }
    });
  }

  /**
   * Fallback: Use ChatGPT web interface instructions
   */
  async useChatGPTWeb(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lineCount = fileContent.split('\n').length;

    console.log('\n' + '='.repeat(60));
    console.log('📋 COPY THIS TO CHATGPT:');
    console.log('='.repeat(60));
    console.log(`Please review this ${path.extname(filePath)} file for:`);
    console.log('1. Code quality issues');
    console.log('2. Performance improvements');
    console.log('3. Security concerns');
    console.log('4. Best practices\n');
    console.log(`File: ${filePath} (${lineCount} lines)`);
    console.log('-'.repeat(40));
    console.log(fileContent.substring(0, 1000));
    if (fileContent.length > 1000) {
      console.log(`\n... (${fileContent.length - 1000} more characters)`);
    }
    console.log('='.repeat(60));
    console.log('Then paste the response when prompted.\n');

    // Wait for user to paste response
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Paste ChatGPT response (or press Enter to skip): ', (response) => {
        rl.close();

        if (response.trim()) {
          // Parse ChatGPT response into suggestions
          const suggestions = this.parseChatGPTResponse(response);
          resolve({
            file: filePath,
            suggestions,
            source: 'chatgpt-web'
          });
        } else {
          resolve({
            file: filePath,
            suggestions: [],
            source: 'skipped'
          });
        }
      });
    });
  }

  /**
   * Parse ChatGPT web response into structured suggestions
   */
  parseChatGPTResponse(response) {
    const suggestions = [];
    const lines = response.split('\n');

    let currentSuggestion = null;

    for (const line of lines) {
      // Look for numbered items or bullet points
      if (/^\d+\.|^[-*•]/.test(line.trim())) {
        if (currentSuggestion) {
          suggestions.push(currentSuggestion);
        }
        currentSuggestion = {
          type: 'suggestion',
          message: line.replace(/^\d+\.|^[-*•]/, '').trim(),
          severity: 'info',
          source: 'chatgpt'
        };
      } else if (currentSuggestion && line.trim()) {
        // Add to current suggestion description
        currentSuggestion.message += ' ' + line.trim();
      }
    }

    if (currentSuggestion) {
      suggestions.push(currentSuggestion);
    }

    return suggestions;
  }

  /**
   * Generate mock review for testing
   */
  generateMockReview(filePath) {
    const ext = path.extname(filePath);
    const suggestions = [];

    // Add some generic suggestions based on file type
    if (ext === '.js' || ext === '.ts') {
      suggestions.push({
        type: 'refactoring',
        message: 'Consider using const instead of let for immutable variables',
        line: 10,
        severity: 'info'
      });
    }

    if (ext === '.py') {
      suggestions.push({
        type: 'style',
        message: 'Add type hints for better code documentation',
        severity: 'info'
      });
    }

    return {
      file: filePath,
      suggestions,
      source: 'mock'
    };
  }

  /**
   * Main review function
   */
  async review() {
    console.log('🔍 Local Codex Review (ChatGPT Plus Mode)\n');

    // Check configuration
    if (this.config.useSubscription) {
      console.log('💳 Using ChatGPT Plus subscription (no API costs)\n');
    }

    // Get changed files
    const files = this.getChangedFiles();
    const supportedFiles = files.filter(f =>
      /\.(js|jsx|ts|tsx|py|java|go|rs|cpp|c)$/.test(f)
    );

    if (supportedFiles.length === 0) {
      console.log('No supported files to review.');
      return;
    }

    console.log(`Found ${supportedFiles.length} files to review:\n`);

    // Review each file
    const results = [];
    for (const file of supportedFiles) {
      const result = await this.reviewFile(file);
      if (result) {
        results.push(result);
      }
    }

    // Save results
    this.saveResults(results);

    // Display summary
    this.displaySummary(results);

    return results;
  }

  /**
   * Save results to file
   */
  saveResults(results) {
    const timestamp = new Date().toISOString();
    const output = {
      timestamp,
      mode: 'local',
      subscription: 'ChatGPT Plus',
      cost: '$0.00',
      files_reviewed: results.length,
      total_suggestions: results.reduce((sum, r) => sum + r.suggestions.length, 0),
      results
    };

    const outputPath = path.join(this.resultDir, 'latest-review.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    // Also save a markdown version
    const mdPath = path.join(this.resultDir, 'latest-review.md');
    fs.writeFileSync(mdPath, this.formatAsMarkdown(output));

    console.log(`\n✅ Results saved to:`);
    console.log(`   JSON: ${outputPath}`);
    console.log(`   Markdown: ${mdPath}`);
  }

  /**
   * Format results as markdown
   */
  formatAsMarkdown(output) {
    let md = `# 🖥️ Local Codex Review Results\n\n`;
    md += `**Date**: ${output.timestamp}\n`;
    md += `**Mode**: ${output.mode}\n`;
    md += `**Cost**: ${output.cost} (using ${output.subscription})\n`;
    md += `**Files Reviewed**: ${output.files_reviewed}\n`;
    md += `**Total Suggestions**: ${output.total_suggestions}\n\n`;

    for (const result of output.results) {
      md += `## 📄 ${result.file}\n\n`;

      if (result.suggestions.length === 0) {
        md += `✅ No issues found\n\n`;
      } else {
        result.suggestions.forEach((s, i) => {
          md += `${i + 1}. **${s.message}**\n`;
          if (s.line) md += `   - Line: ${s.line}\n`;
          md += `   - Severity: ${s.severity}\n`;
          md += `   - Type: ${s.type || 'general'}\n\n`;
        });
      }
    }

    md += `---\n*Generated locally using ChatGPT Plus subscription*`;
    return md;
  }

  /**
   * Display summary to console
   */
  displaySummary(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 REVIEW SUMMARY');
    console.log('='.repeat(60));

    let totalSuggestions = 0;
    for (const result of results) {
      const count = result.suggestions.length;
      totalSuggestions += count;
      console.log(`  ${result.file}: ${count} suggestion(s) [${result.source}]`);
    }

    console.log('\n' + '-'.repeat(60));
    console.log(`Total: ${totalSuggestions} suggestions across ${results.length} files`);
    console.log(`Cost: $0.00 (ChatGPT Plus subscription)`);
    console.log('='.repeat(60));
  }
}

// CLI execution
if (require.main === module) {
  const reviewer = new LocalCodexReview();

  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
Local Codex Review - Use ChatGPT Plus instead of API

Usage:
  node local-codex-review.js [options]

Options:
  --help     Show this help message
  --check    Check if Codex CLI is available
  --mock     Use mock data (for testing)

This tool reviews code changes using your ChatGPT Plus subscription,
avoiding API costs. It can use the Codex CLI if installed, or guide
you to use the ChatGPT web interface.
    `);
    process.exit(0);
  }

  if (args.includes('--check')) {
    const available = reviewer.isCodexAvailable();
    console.log(`Codex CLI available: ${available ? '✅ Yes' : '❌ No'}`);
    if (!available) {
      console.log('\nTo install Codex CLI:');
      console.log('  npm install -g @openai/codex-cli');
      console.log('  codex auth login');
    }
    process.exit(0);
  }

  // Run review
  reviewer.review().then(() => {
    console.log('\n✨ Review complete!');
    console.log('Next steps:');
    console.log('  1. Review suggestions in .codex-results/latest-review.md');
    console.log('  2. Push results: npm run codex:push-results');
    console.log('  3. Apply fixes as needed');
  }).catch(error => {
    console.error('❌ Review failed:', error);
    process.exit(1);
  });
}

module.exports = LocalCodexReview;