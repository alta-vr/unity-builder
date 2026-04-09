import { AWSCloudFormationTemplates } from './aws-cloud-formation-templates';

describe('AWSCloudFormationTemplates', () => {
  it('renders a single ECS Secrets block with multiple entries', () => {
    const template = AWSCloudFormationTemplates.getSecretDefinitionEntriesTemplate([
      {
        environmentVariable: 'UNITY_EMAIL',
        parameterKey: 'BuildGuidUNITYEMAIL',
      },
      {
        environmentVariable: 'UNITY_PASSWORD',
        parameterKey: 'BuildGuidUNITYPASSWORD',
      },
    ]);

    expect(template.match(/\n\s*Secrets:/g)).toHaveLength(1);
    expect(template).toContain(`- Name: 'UNITY_EMAIL'`);
    expect(template).toContain(`ValueFrom: !Ref BuildGuidUNITYEMAILSecret`);
    expect(template).toContain(`- Name: 'UNITY_PASSWORD'`);
    expect(template).toContain(`ValueFrom: !Ref BuildGuidUNITYPASSWORDSecret`);
  });

  it('omits the ECS Secrets block when there are no secrets', () => {
    expect(AWSCloudFormationTemplates.getSecretDefinitionEntriesTemplate([])).toBe('');
  });
});
