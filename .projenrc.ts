import { exec } from 'child_process';
import { awscdk, Component, github } from 'projen';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { NodeProject, TrailingComma, UpgradeDependenciesSchedule } from 'projen/lib/javascript';
import { ReleaseTrigger } from 'projen/lib/release';

const defaultReleaseBranch = 'main';
const setupPythonAction = 'actions/setup-python@v5';
const setupNodeAction = 'actions/setup-node@v4';
const setupSamAction = 'aws-actions/setup-sam@v2';
const downloadArtifactAction = 'actions/download-artifact@v4';
const nodeActionVersion = '18';

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.95.0',
  defaultReleaseBranch,
  name: 'aws-lambda-tesseract-layer',
  description: 'A layer for AWS Lambda containing the tesseract C libraries and tesseract executable. ',
  projenrcTs: true,
  srcdir: 'continous-integration',
  // Use built-in dep upgrades
  dependabot: false,
  gitignore: ['layer', '.serverless', '.mypy_cache', '*.zip', '**/*test-output.txt', 'cdk.out/'],
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
    'post-upgrade': 'npx projen upgrade:subprojects',
  },
  release: true,
  releaseTrigger: ReleaseTrigger.scheduled({ schedule: '0 0 1 1 *' }),
  githubOptions: {
    mergify: true,
    projenCredentials: github.GithubCredentials.fromApp(),
    pullRequestLintOptions: {
      semanticTitleOptions: { types: ['feat', 'fix', 'chore', 'build', 'docs'] },
    },
  },
  workflowBootstrapSteps: [
    {
      uses: setupPythonAction,
      with: {
        'python-version': '3.8',
      },
    },
    {
      name: 'Install pipenv',
      run: 'curl https://raw.githubusercontent.com/pypa/pipenv/master/get-pipenv.py | python',
    },
    {
      uses: setupSamAction,
    },
  ],
  versionrcOptions: {
    types: [
      { type: 'feat', hidden: true },
      { type: 'fix', hidden: true },
      { type: 'chore', hidden: true },
      { type: 'docs', hidden: true },
      { type: 'style', hidden: true },
      { type: 'refactor', hidden: true },
      { type: 'perf', hidden: true },
      { type: 'test', hidden: true },
    ],
  },

  buildWorkflow: true,
  package: false,
  eslint: true,
  prettier: false,
  eslintOptions: {
    dirs: ['continous-integration', 'example', 'layer'],
    prettier: true,
    yaml: true,
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

project.addTask(`test:integration:python`, {
  steps: [
    {
      spawn: `synth:silent`,
    },
    {
      exec: `sam local invoke -t cdk.out/tesseract-lambda-ci.template.json python --no-event > py-test-output.txt && cat py-test-output.txt | grep -Eiv \"(fail|error|exception)\"`,
    },
  ],
});
project.addTask(`test:integration:node`, {
  steps: [
    {
      spawn: `synth:silent`,
    },
    {
      exec: `sam local invoke -t cdk.out/tesseract-lambda-ci.template.json node --no-event > node-test-output.txt && cat node-test-output.txt | grep -Eiv \"(fail|error|exception)\"`,
    },
  ],
});
const testIntegration = project.addTask(`test:integration`, {
  steps: [
    {
      spawn: `test:integration:python`,
    },
    {
      spawn: `test:integration:node`,
    },
  ],
});
const bundle = project.addTask(`bundle:binary`, {
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
project.packageTask.prependSpawn(testIntegration);
project.packageTask.prependSpawn(bundle);
project.packageTask.prependExec(`mkdir -p ./dist`);
project.packageTask.exec(`zip -r ../../dist/tesseract-al2-x86.zip .`, { cwd: './ready-to-use/amazonlinux-2' });
project.addTask('upgrade:ci:py', {
  steps: [
    {
      exec: 'pipenv lock && pipenv requirements > requirements.txt',
      cwd: 'continous-integration/lambda-handlers/python',
    },
    {
      exec: 'cp continous-integration/lambda-handlers/python/requirements.txt example/cdk/src/lambda-handlers/requirements.txt',
    },
    {
      exec: 'cp continous-integration/lambda-handlers/python/requirements.txt example/serverless/requirements.txt',
    },
  ],
});
project.release?.addJobs({
  upload_release_artifact: {
    runsOn: ['ubuntu-latest'],
    permissions: { contents: JobPermission.WRITE },
    needs: ['release', 'release_github'],
    if: 'needs.release.outputs.latest_commit == github.sha',
    steps: [
      {
        uses: setupNodeAction,
        with: {
          'node-version': nodeActionVersion,
        },
      },
      {
        name: 'Download build artifacts',
        uses: downloadArtifactAction,
        with: {
          name: 'build-artifact',
          path: 'dist',
        },
      },
      {
        name: 'Restore build artifact permissions',
        run: 'cd dist && setfacl --restore=permissions-backup.acl',
        continueOnError: true,
      },
      {
        name: 'Upload Release Artifacts',
        env: {
          GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
          GITHUB_REPOSITORY: '${{ github.repository }}',
          GITHUB_REF: '${{ github.ref }}',
        },
        run: 'errout=$(mktemp); gh release upload $(cat dist/releasetag.txt) --clobber -R $GITHUB_REPOSITORY dist/tesseract-al2-x86.zip 2> $errout && true; exitcode=$?; if [ $exitcode -ne 0 ] && ! grep -q "Release.tag_name already exists" $errout; then cat $errout; exit $exitcode; fi',
      },
    ],
  },
});
project.eslint?.addRules({
  'prettier/prettier': ['error', { singleQuote: true, printWidth: 140, trailingComma: TrailingComma.ALL }],
});

/** Example */

new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.55.0',
  name: 'aws-lambda-tesseract-layer-example',
  defaultReleaseBranch,
  parent: project,
  outdir: 'example/cdk',
  depsUpgrade: true,
  licensed: false,
});
new NodeProject({
  name: 'node-lambda',
  defaultReleaseBranch,
  parent: project,
  outdir: 'continous-integration/lambda-handlers/node',
  deps: ['tesseractocr'],
  devDeps: ['esbuild'],
  depsUpgrade: true,
  licensed: false,
});

project.addTask('upgrade:subprojects', {
  steps: [{ spawn: 'upgrade:ci:py' }],
});
project.synth();
