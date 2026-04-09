import { TaskDefinitionFormation } from './cloud-formations/task-definition-formation';

export class AWSCloudFormationTemplates {
  public static getSecretDefinitionEntriesTemplate(
    secretDefinitions: Array<{ environmentVariable: string; parameterKey: string }>,
  ) {
    if (secretDefinitions.length === 0) {
      return '';
    }

    const secretEntries = secretDefinitions
      .map(
        ({ environmentVariable, parameterKey }) =>
          `            - Name: '${environmentVariable}'\n              ValueFrom: !Ref ${parameterKey}Secret`,
      )
      .join('\n');

    return `
          Secrets:
${secretEntries}
`;
  }

  public static getParameterTemplate(p1: string) {
    return `
  ${p1}:
    Type: String
    Default: ''
`;
  }

  public static getSecretTemplate(p1: string) {
    return `
  ${p1}Secret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: '${p1}'
      SecretString: !Ref ${p1}
`;
  }

  public static insertAtTemplate(template: string, insertionKey: string, insertion: string) {
    const index = template.search(insertionKey) + insertionKey.length + '\n'.length;
    template = [template.slice(0, index), insertion, template.slice(index)].join('');

    return template;
  }

  public static readTaskCloudFormationTemplate(): string {
    return TaskDefinitionFormation.formation;
  }
}
