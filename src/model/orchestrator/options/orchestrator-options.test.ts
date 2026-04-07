import { Cli } from '../../cli/cli';
import GitHub from '../../github';
import OrchestratorOptions from './orchestrator-options';

describe('OrchestratorOptions', () => {
  beforeAll(() => {
    GitHub.githubInputEnabled = false;
  });

  beforeEach(() => {
    Cli.options = {};
  });

  afterEach(() => {
    if (Cli.options !== undefined) {
      delete Cli.options;
    }
  });

  afterAll(() => {
    GitHub.githubInputEnabled = true;
  });

  describe('orchestratorTimeout', () => {
    it('defaults to 0 when not provided', () => {
      expect(OrchestratorOptions.orchestratorTimeout).toBe(0);
    });

    it('reads a valid timeout value', () => {
      Cli.options = { orchestratorTimeout: '120' };
      expect(OrchestratorOptions.orchestratorTimeout).toBe(120);
    });

    it('clamps timeout below minimum', () => {
      Cli.options = { orchestratorTimeout: '-1' };
      expect(OrchestratorOptions.orchestratorTimeout).toBe(0);
    });

    it('clamps timeout above maximum', () => {
      Cli.options = { orchestratorTimeout: '361' };
      expect(OrchestratorOptions.orchestratorTimeout).toBe(360);
    });

    it('returns 0 for invalid timeout value', () => {
      Cli.options = { orchestratorTimeout: 'abc' };
      expect(OrchestratorOptions.orchestratorTimeout).toBe(0);
    });
  });
});
