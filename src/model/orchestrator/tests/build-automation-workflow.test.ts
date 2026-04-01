import Orchestrator from '../orchestrator';
import { BuildAutomationWorkflow } from '../workflows/build-automation-workflow';

const getBuildCommands = (softTimeoutMinutes: number) => {
  Orchestrator.buildParameters = {
    providerStrategy: 'aws',
    orchestratorSoftTimeoutMinutes: softTimeoutMinutes,
    projectPath: 'test-project',
    buildPath: 'build/StandaloneLinux64',
    buildGuid: 'test-build-guid',
    logId: 'test-log-id',
    cacheKey: 'test-cache-key',
    dockerWorkspacePath: '/github/workspace',
  } as any;

  return (BuildAutomationWorkflow as any).BuildCommands('/tmp/dist/index.js', true) as string;
};

describe('BuildAutomationWorkflow', () => {
  it('uses timeout wrapper when orchestratorSoftTimeoutMinutes is configured', () => {
    const commands = getBuildCommands(300);

    expect(commands).toContain('Orchestrator soft timeout enabled: 300 minute(s)');
    expect(commands).toContain('timeout 300m /entrypoint.sh');
    expect(commands).toContain(
      'Orchestrator soft timeout reached after 300 minute(s); proceeding to post-build cache persistence',
    );
  });

  it('runs build directly when orchestratorSoftTimeoutMinutes is zero', () => {
    const commands = getBuildCommands(0);

    expect(commands).toContain('Orchestrator soft timeout disabled');
    expect(commands).toContain('/entrypoint.sh; BUILD_EXIT_CODE=$?; # no soft-timeout notice');
    expect(commands).not.toContain('timeout 0m /entrypoint.sh');
  });

  it('caps soft timeout to 360 minutes when configured above allowed max', () => {
    const commands = getBuildCommands(999);

    expect(commands).toContain('Orchestrator soft timeout enabled: 360 minute(s)');
    expect(commands).toContain('timeout 360m /entrypoint.sh');
  });
});
