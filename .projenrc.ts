import { awscdk, github } from 'projen';
import { TrailingComma, UpgradeDependenciesSchedule } from 'projen/lib/javascript';

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.55.1',
  defaultReleaseBranch: 'master',
  name: 'aws-lambda-tesseract-layer',
  description: 'A layer for AWS Lambda containing the tesseract C libraries and tesseract executable. ',

  projenrcTs: true,
  srcdir: 'continous-integration',

  // Use built-in dep upgrades
  dependabot: false,
  gitignore: ['layer', '.serverless', '.mypy_cache', '*.zip', '**/*test-output.txt'],
  autoApproveUpgrades: false,

  depsUpgrade: true,
  depsUpgradeOptions: {
    pullRequestTitle: 'Dependency update',
    workflowOptions: {
      // Don't forget to set GitHub App credentials in Repo.
      projenCredentials: github.GithubCredentials.fromApp(),
      schedule: UpgradeDependenciesSchedule.WEEKLY,
    },
  },
  scripts: {
    //postinstall: 'npm ci --prefix src/lambdas/deepl-app',
  },
  githubOptions: {
    mergify: true,
    projenCredentials: github.GithubCredentials.fromApp(),
  },

  buildWorkflow: true,
  eslint: true,
  prettier: false,
  eslintOptions: {
    dirs: ['continous-integration', 'example', 'layer'],
    prettier: true,
    ignorePatterns: ['**/node_modules/', '*.d.ts', 'build', 'cdk.out', '**/__snapshots__'],
  },

  // Don't generate docs. This takes too long and basically copies the official CDK Docs.
  docgen: false,

  licensed: true,

  // see https://github.com/aws/aws-cdk/issues/20622#issuecomment-1300400594
  jestOptions: {
    jestConfig: {
      moduleNameMapper: {
        ['^aws-cdk-lib/.warnings.jsii.js$']: '<rootDir>/node_modules/aws-cdk-lib/.warnings.jsii.js',
      },
    },
  },
});

project.eslint?.addRules({
  'prettier/prettier': ['error', { singleQuote: true, printWidth: 140, trailingComma: TrailingComma.ALL }],
});

project.synth();
