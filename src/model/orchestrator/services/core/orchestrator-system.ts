import { spawn } from 'child_process';
import { RemoteClientLogger } from '../../remote-client/remote-client-logger';

export class OrchestratorSystem {
  private static shouldSkipLogLine(line: string) {
    return line.startsWith('Updating files:') || (line.startsWith('Completed ') && line.includes('file(s) remaining'));
  }

  private static flushBufferedLines(
    buffer: string,
    suppressLogs: boolean,
    log: typeof RemoteClientLogger.log,
    lastLoggedLine: { value: string },
  ) {
    let remaining = buffer;
    const parts = remaining.split(/\r?\n|\r/g);
    remaining = parts.pop() || '';

    if (!suppressLogs) {
      for (const part of parts) {
        if (part === '' || part === lastLoggedLine.value || OrchestratorSystem.shouldSkipLogLine(part)) {
          continue;
        }
        log(part);
        lastLoggedLine.value = part;
      }
    }

    return remaining;
  }

  private static flushTrailingLine(
    buffer: string,
    suppressLogs: boolean,
    log: typeof RemoteClientLogger.log,
    lastLoggedLine: { value: string },
  ) {
    const line = buffer.replace(/\r/g, '');
    if (!suppressLogs && line !== '' && line !== lastLoggedLine.value && !OrchestratorSystem.shouldSkipLogLine(line)) {
      log(line);
      lastLoggedLine.value = line;
    }
  }

  public static async RunAndReadLines(command: string): Promise<string[]> {
    const result = await OrchestratorSystem.Run(command, false, true);

    return result
      .split(`\n`)
      .map((x) => x.replace(`\r`, ``))
      .filter((x) => x !== ``)
      .map((x) => {
        const lineValues = x.split(` `);

        return lineValues[lineValues.length - 1];
      });
  }

  public static async Run(
    command: string,
    suppressError = false,
    suppressLogs = false,
    // eslint-disable-next-line no-unused-vars
    outputCallback?: (output: string) => void,
  ) {
    for (const element of command.split(`\n`)) {
      if (!suppressLogs) {
        RemoteClientLogger.log(element);
      }
    }

    return await new Promise<string>((promise, throwError) => {
      let output = '';
      let stdoutBuffer = '';
      let stderrBuffer = '';
      const lastLoggedLine = { value: '' };
      const child = spawn(command, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });

      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');

      child.stdout.on('data', (chunk: string) => {
        output += chunk;
        if (outputCallback) {
          outputCallback(chunk);
        }
        stdoutBuffer += chunk;
        stdoutBuffer = OrchestratorSystem.flushBufferedLines(
          stdoutBuffer,
          suppressLogs,
          (line) => RemoteClientLogger.log(line),
          lastLoggedLine,
        );
      });

      child.stderr.on('data', (chunk: string) => {
        output += chunk;
        stderrBuffer += chunk;
        stderrBuffer = OrchestratorSystem.flushBufferedLines(
          stderrBuffer,
          suppressLogs,
          (line) => RemoteClientLogger.logCliDiagnostic(line),
          lastLoggedLine,
        );
      });

      child.on('error', (error) => {
        if (!suppressError) {
          if (!suppressLogs) {
            RemoteClientLogger.log(error.toString());
          }
          throwError(error);
        } else {
          promise(output);
        }
      });

      child.on('close', (code) => {
        OrchestratorSystem.flushTrailingLine(
          stdoutBuffer,
          suppressLogs,
          (line) => RemoteClientLogger.log(line),
          lastLoggedLine,
        );
        OrchestratorSystem.flushTrailingLine(
          stderrBuffer,
          suppressLogs,
          (line) => RemoteClientLogger.logCliDiagnostic(line),
          lastLoggedLine,
        );

        if (!suppressLogs) {
          RemoteClientLogger.log(`[${code}]`);
        }

        if (code !== 0 && !suppressError) {
          throwError(output || `Command failed with exit code ${code}`);

          return;
        }

        promise(output);
      });
    });
  }
}
