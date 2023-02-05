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
    postinstall: 'npm ci --prefix example/cdk && npm ci --prefix example/serverless',
  },
  githubOptions: {
    mergify: true,
    projenCredentials: github.GithubCredentials.fromApp(),
  },

  buildWorkflow: true,
  postBuildSteps: [{ name: 'test-integration-sam-local', run: 'npx projen test:integration' }],
  eslint: true,
  prettier: false,
  eslintOptions: {
    dirs: ['continous-integration', 'example', 'layer'],
    prettier: true,
    ignorePatterns: ['**/node_modules/', '*.d.ts', 'build', 'cdk.out', '**/__snapshots__'],
  },

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

project.addTask(`test:integration:py38`, {
  steps: [
    {
      spawn: `synth:silent`,
    },
    {
      exec: `sam local invoke -t cdk.out/tesseract-lambda-ci.template.json py38 --no-event > py38-test-output.txt && cat py38-test-output.txt | grep -Eiv \"(fail|error|exception)\"`,
    },
  ],
});
project.addTask(`test:integration:node16`, {
  steps: [
    {
      spawn: `synth:silent`,
    },
    {
      exec: `sam local invoke -t cdk.out/tesseract-lambda-ci.template.json node16 --no-event > node16-test-output.txt && cat node16-test-output.txt | grep -Eiv \"(fail|error|exception)\"`,
    },
  ],
});
project.addTask(`test:integration`, {
  steps: [
    {
      spawn: `test:integration:py38`,
    },
    {
      spawn: `test:integration:node16`,
    },
  ],
});
project.addTask(`bundle:binary`, {
  steps: [
    {
      spawn: `synth:silent`,
    },
    {
      exec: `rm -rf ./ready-to-use/amazonlinux-2/*`,
    },
    {
      exec: `cp -r cdk.out/$(cat cdk.out/tesseract-lambda-ci.template.json | jq -r '.Resources.al2layer.Metadata.\"aws:asset:path\"')/. ./ready-to-use/amazonlinux-2`,
    },
  ],
});
project.eslint?.addRules({
  'prettier/prettier': ['error', { singleQuote: true, printWidth: 140, trailingComma: TrailingComma.ALL }],
});

project.synth();
