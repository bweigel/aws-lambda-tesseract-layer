import { exec } from 'child_process';
import { awscdk, Component, github } from 'projen';
import { NodeProject, TrailingComma, UpgradeDependenciesSchedule } from 'projen/lib/javascript';

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.63.2',
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
      labels: ['dependencies'],
    },
  },
  scripts: {
    //postinstall: 'npm ci --prefix example/cdk && npm ci --prefix example/serverless',
    'post-upgrade': 'npx projen upgrade:ci:py',
  },
  githubOptions: {
    mergify: true,
    projenCredentials: github.GithubCredentials.fromApp(),
    pullRequestLintOptions: {
      semanticTitleOptions: { types: ['feat', 'fix', 'chore', 'build'] },
    },
  },
  workflowBootstrapSteps: [
    {
      uses: 'actions/setup-python@v4',
      with: {
        'python-version': '3.10',
      },
    },
    {
      uses: 'aws-actions/setup-sam@v2',
    },
  ],

  buildWorkflow: true,
  package: false,
  postBuildSteps: [
    { name: 'test-integration-sam-local', run: 'npx projen test:integration' },
    { name: 'bundle', run: 'npx projen bundle:binary' },
  ],
  eslint: true,
  prettier: false,
  eslintOptions: {
    dirs: ['continous-integration', 'example', 'layer'],
    prettier: true,
    ignorePatterns: ['**/node_modules/', '*.d.ts', 'build', 'cdk.out', '**/__snapshots__', 'example'],
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

class BinaryPatchComponent extends Component {
  /**
   * Hacky way to get binary patch
   */
  postSynthesize(): void {
    exec("sed -i 's/\\(git diff\\)/\\1 --binary/g' .github/workflows/build.yml", (err, _, stderr) => {
      if (err) {
        console.log(`error: ${err.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
    });
  }
}

new BinaryPatchComponent(project);

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
project.packageTask.prependExec(`mkdir -p ./dist`);
project.packageTask.prependExec(`rm -rf ./dist`);
project.packageTask.exec(`zip -r ../../dist/tesseract-al2-x86.zip .`, { cwd: './ready-to-use/amazonlinux-2' });
project.addTask('upgrade:ci:py', {
  steps: [
    {
      exec: 'pipenv lock && pipenv requirements > requirements.txt',
      cwd: 'continous-integration/lambda-handlers/py38',
    },
    {
      exec: 'cp continous-integration/lambda-handlers/py38/requirements.txt example/cdk/src/lambda-handlers/requirements.txt',
    },
    {
      exec: 'cp continous-integration/lambda-handlers/py38/requirements.txt example/serverless/requirements.txt',
    },
  ],
});
project.eslint?.addRules({
  'prettier/prettier': ['error', { singleQuote: true, printWidth: 140, trailingComma: TrailingComma.ALL }],
});

/** Example */

new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.55.0',
  name: 'aws-lambda-tesseract-layer-example',
  defaultReleaseBranch: 'master',
  parent: project,
  outdir: 'example/cdk',
  depsUpgrade: true,
  licensed: false,
});
new NodeProject({
  name: 'node-lambda',
  defaultReleaseBranch: 'master',
  parent: project,
  outdir: 'continous-integration/lambda-handlers/node16',
  deps: ['tesseractocr'],
  devDeps: ['esbuild'],
  depsUpgrade: true,
  licensed: false,
});

project.synth();
