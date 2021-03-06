const path = require('path');
const semver = require('semver');
const chalk = require('chalk');
const inquirer = require('inquirer');
const {Npm, ProjectHelper, Git} = require('@aofl/cli-lib');
const runner = require('./codemod');
const {exitOnUncommittedChanges} = require('../../lib/uncommitted-changes');

const upgradeConfig = require('./upgrade-config');

class UpgradeProject {
  constructor(target = '.') {
    this.target = path.resolve(target);
    this.projectRoot = ProjectHelper.findProjectRoot(this.target);

    if (!this.projectRoot) {
      process.stdout.write(chalk.yellow('Could not locate an AofL JS project.') + '\n');
      process.exit(1);
    }

    try {
      Git.findGitDir(this.projectRoot);
    } catch (e) {
      process.stdout.write(chalk.yellow('Not a git repository.' + '\n'));
      process.exit(1);
    }

    const projectPackage = Npm.findPackageDir(this.projectRoot);
    this.projectInfo = {
      package: require(path.join(projectPackage, 'package.json')),
      config: ProjectHelper.getConfig(this.projectRoot)
    };
    this.eligibleUpgrades = upgradeConfig.reduce((acc, item) => {
      if (semver.satisfies(this.projectInfo.config.version, item.from)) {
        acc.push(item);
      }
      return acc;
    }, []);

    if (this.eligibleUpgrades.length === 0) {
      process.stdout.write(chalk.green('No new upgrades available...') + '\n');
      process.exit(0);
    }
  }

  async init() {
    await exitOnUncommittedChanges();

    const upgradeObject = await this.promptUpgradeVersion();
    const {analyze, upgrade} = runner(upgradeObject.path);
    const globalRunner = runner(path.join(__dirname, 'codemod', 'global'));

    process.stdout.write(chalk.green(`Analyzing required changes...`) + '\n');
    const upgradeAvailable = await analyze(this.projectRoot, this.projectInfo);
    const globalUpgradeAvailable = await globalRunner.analyze(this.projectRoot, this.projectInfo);

    if (upgradeAvailable || globalUpgradeAvailable) {
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'doUpgrade',
          message: 'Continue with the upgrade? (yes)'
        }
      ]);
      process.stdout.write(chalk.cyan(`Applying changes...`) + '\n');
      process.stdout.write('\n');
      if (answer.doUpgrade) {
        await upgrade(this.projectRoot, this.projectInfo);
        await globalRunner.upgrade(this.projectRoot, this.projectInfo);
        process.stdout.write(chalk.green(`Upgrade to ${upgradeObject.to} was successful :)`) + '\n');
      } else {
        process.stdout.write(chalk.red('upgrade canceled') + '\n');
      }
    } else {
      process.stdout.write(chalk.green('No new upgrades available...') + '\n');
    }
  }

  async promptUpgradeVersion() {
    process.stdout.write(chalk.green(`Upgrading from ${this.projectInfo.config.version}...\n`));
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'upgradeVersion',
        message: 'Choose a version to upgrade to ...',
        choices: this.eligibleUpgrades.map((item) => `${item.to}`),
      }
    ]);

    return this.eligibleUpgrades.find((item) => item.to === answer.upgradeVersion);
  }
}

module.exports = UpgradeProject;
