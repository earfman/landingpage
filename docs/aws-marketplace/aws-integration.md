# ZeroTrustKerberosLink AWS Security Integration

## Overview

ZeroTrustKerberosLink is designed to securely integrate enterprise Kerberos authentication with AWS services using Zero Trust principles. This document details the specific AWS security integration aspects of ZeroTrustKerberosLink, including IAM role mapping, AWS security best practices implementation, CloudTrail integration, and AWS Security Hub compatibility.

## IAM Role Mapping

ZeroTrustKerberosLink implements secure mapping between enterprise identities and AWS IAM roles, ensuring that users receive only the permissions they need to perform their tasks.

### Role Mapping Architecture

![IAM Role Mapping Architecture](../assets/images/iam-role-mapping.png)

The role mapping process follows these steps:

1. User authenticates using Kerberos credentials
2. ZeroTrustKerberosLink validates the Kerberos ticket
3. User identity and group memberships are extracted
4. The Role Mapping Engine determines the appropriate AWS IAM role
5. Temporary AWS credentials are generated using AWS STS
6. Credentials are securely delivered to the user's application

### Role Mapping Configuration

Role mapping is configured using a YAML-based configuration file:

```yaml
# Role Mapping Configuration
default_role: "arn:aws:iam::123456789012:role/default-access"

# Direct user mappings
users:
  "user1@EXAMPLE.COM": "arn:aws:iam::123456789012:role/admin-access"
  "user2@EXAMPLE.COM": "arn:aws:iam::123456789012:role/developer-access"

# Group mappings
groups:
  "Administrators": "arn:aws:iam::123456789012:role/admin-access"
  "Developers": "arn:aws:iam::123456789012:role/developer-access"
  "Finance": "arn:aws:iam::123456789012:role/finance-access"

# Role attributes
role_attributes:
  "arn:aws:iam::123456789012:role/admin-access":
    session_duration: 3600
    mfa_required: true
  "arn:aws:iam::123456789012:role/developer-access":
    session_duration: 7200
    mfa_required: false
```

### Role Mapping Implementation

```python
def map_user_to_aws_role(user_id, user_groups):
    """
    Maps a user to appropriate AWS IAM role.
    
    Args:
        user_id: User identifier (e.g., user@EXAMPLE.COM)
        user_groups: List of user's groups
        
    Returns:
        str: AWS role ARN
    """
    # Load role mapping configuration
    role_mapping = load_role_mapping_config()
    
    # Check for direct user mapping
    if user_id in role_mapping.get('users', {}):
        return role_mapping['users'][user_id]
        
    # Check for group mapping
    for group in user_groups:
        if group in role_mapping.get('groups', {}):
            return role_mapping['groups'][group]
            
    # Return default role if no mapping found
    return role_mapping.get('default_role')
```

### Secure Credential Generation

ZeroTrustKerberosLink uses AWS Security Token Service (STS) to generate temporary credentials:

```python
def generate_aws_credentials(user_id, aws_role_arn, session_duration=3600):
    """
    Generates temporary AWS credentials.
    
    Args:
        user_id: User identifier
        aws_role_arn: AWS role ARN
        session_duration: Session duration in seconds
        
    Returns:
        dict: Temporary AWS credentials
    """
    # Create STS client
    sts_client = boto3.client('sts')
    
    # Generate session name
    session_name = f"ZeroTrustKerberosLink-{user_id}-{int(time.time())}"
    
    try:
        # Assume role with STS
        response = sts_client.assume_role(
            RoleArn=aws_role_arn,
            RoleSessionName=session_name,
            DurationSeconds=session_duration
        )
        
        # Extract credentials
        credentials = response['Credentials']
        
        return {
            'AccessKeyId': credentials['AccessKeyId'],
            'SecretAccessKey': credentials['SecretAccessKey'],
            'SessionToken': credentials['SessionToken'],
            'Expiration': credentials['Expiration'].isoformat()
        }
    except botocore.exceptions.ClientError as e:
        logger.error(f"AWS credential generation error: {str(e)}")
        raise
```

### Role Assumption Policies

ZeroTrustKerberosLink requires the following trust relationship on AWS IAM roles:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:role/ZeroTrustKerberosLinkRole"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "aws:PrincipalTag/ZeroTrustKerberosLink": "true"
        }
      }
    }
  ]
}
```

## AWS Security Best Practices

ZeroTrustKerberosLink implements AWS security best practices to ensure secure integration with AWS services.

### Least Privilege Access

ZeroTrustKerberosLink follows the principle of least privilege:

1. **Minimal IAM Permissions**: The ZeroTrustKerberosLink service role has only the permissions required to function
2. **Scoped Down Policies**: User roles are scoped down to provide only necessary permissions
3. **Permission Boundaries**: Permission boundaries are used to limit maximum permissions
4. **Conditional Access**: IAM conditions are used to restrict access based on context

Example ZeroTrustKerberosLink service role policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sts:AssumeRole"
      ],
      "Resource": "arn:aws:iam::*:role/ZeroTrustKerberosLink-*",
      "Condition": {
        "StringEquals": {
          "aws:ResourceTag/ZeroTrustKerberosLinkManaged": "true"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/zerotrustkerberoslink/*"
    }
  ]
}
```

### Secure Configuration

ZeroTrustKerberosLink follows AWS security configuration best practices:

1. **VPC Deployment**: Deployed within a VPC with appropriate security groups
2. **Private Subnets**: Core components run in private subnets
3. **Security Groups**: Restrictive security groups with minimal open ports
4. **Network ACLs**: Additional network-level protection
5. **Encryption**: All data encrypted at rest and in transit

Example security group configuration:

```yaml
SecurityGroups:
  ZeroTrustKerberosLinkSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ZeroTrustKerberosLink
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref CorporateNetworkCidr
        - IpProtocol: tcp
          FromPort: 88
          ToPort: 88
          CidrIp: !Ref CorporateNetworkCidr
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 88
          ToPort: 88
          CidrIp: !Ref KerberosDCCidr
```

### Credential Management

ZeroTrustKerberosLink implements secure credential management:

1. **No Long-term Credentials**: No long-term AWS credentials are used or stored
2. **Temporary Credentials**: All credentials are temporary with short lifetimes
3. **Secure Storage**: Any configuration is stored in AWS Secrets Manager
4. **Credential Rotation**: Regular rotation of any service credentials
5. **IAM Roles**: Use of IAM roles for service-to-service authentication

Example credential retrieval:

```python
def get_aws_credentials():
    """
    Securely retrieves AWS credentials for the service.
    
    Returns:
        dict: AWS credentials
    """
    # Create Secrets Manager client
    client = boto3.client('secretsmanager')
    
    try:
        # Get the secret
        response = client.get_secret_value(
            SecretId='ZeroTrustKerberosLink/AWSCredentials'
        )
        
        # Parse the secret
        secret = json.loads(response['SecretString'])
        
        return secret
    except Exception as e:
        logger.error(f"Error retrieving AWS credentials: {str(e)}")
        raise
```

## CloudTrail Integration

ZeroTrustKerberosLink integrates with AWS CloudTrail for comprehensive audit logging of all AWS API calls.

### CloudTrail Configuration

ZeroTrustKerberosLink recommends the following CloudTrail configuration:

```yaml
CloudTrail:
  Type: AWS::CloudTrail::Trail
  Properties:
    IsLogging: true
    IsMultiRegionTrail: true
    IncludeGlobalServiceEvents: true
    EnableLogFileValidation: true
    S3BucketName: !Ref CloudTrailBucket
    CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
    CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
    EventSelectors:
      - ReadWriteType: All
        IncludeManagementEvents: true
        DataResources:
          - Type: AWS::S3::Object
            Values:
              - !Sub arn:aws:s3:::${CloudTrailBucket}/
```

### CloudTrail Event Monitoring

ZeroTrustKerberosLink monitors CloudTrail events for security-relevant activities:

```python
def monitor_cloudtrail_events():
    """
    Monitors CloudTrail events for security-relevant activities.
    """
    # Create CloudWatch Logs client
    client = boto3.client('logs')
    
    # Define security-relevant events
    security_events = [
        'AssumeRole',
        'ConsoleLogin',
        'CreateAccessKey',
        'DeleteAccessKey',
        'UpdateAccessKey',
        'AttachRolePolicy',
        'DetachRolePolicy',
        'PutRolePolicy',
        'DeleteRolePolicy'
    ]
    
    # Create filter pattern
    filter_pattern = ' || '.join([f'$.eventName = "{event}"' for event in security_events])
    
    # Create CloudWatch Logs filter
    response = client.put_metric_filter(
        logGroupName='CloudTrail/DefaultLogGroup',
        filterName='ZeroTrustKerberosLinkSecurityEvents',
        filterPattern=filter_pattern,
        metricTransformations=[
            {
                'metricName': 'SecurityEvents',
                'metricNamespace': 'ZeroTrustKerberosLink',
                'metricValue': '1'
            }
        ]
    )
    
    # Create CloudWatch alarm
    cloudwatch = boto3.client('cloudwatch')
    cloudwatch.put_metric_alarm(
        AlarmName='ZeroTrustKerberosLinkSecurityEventsAlarm',
        MetricName='SecurityEvents',
        Namespace='ZeroTrustKerberosLink',
        Statistic='Sum',
        Period=300,
        EvaluationPeriods=1,
        Threshold=5,
        ComparisonOperator='GreaterThanThreshold',
        AlarmActions=[
            'arn:aws:sns:us-east-1:123456789012:ZeroTrustKerberosLinkAlerts'
        ]
    )
```

### CloudTrail Log Analysis

ZeroTrustKerberosLink provides tools for analyzing CloudTrail logs:

1. **Real-time Monitoring**: Monitoring of security-relevant CloudTrail events
2. **Anomaly Detection**: Detection of unusual patterns in AWS API usage
3. **Compliance Reporting**: Generation of compliance reports from CloudTrail data
4. **Forensic Analysis**: Tools for forensic analysis of CloudTrail logs
5. **Alert Correlation**: Correlation of CloudTrail events with other security events

Example CloudTrail log analysis:

```python
def analyze_cloudtrail_logs(start_time, end_time):
    """
    Analyzes CloudTrail logs for security anomalies.
    
    Args:
        start_time: Start time for analysis
        end_time: End time for analysis
        
    Returns:
        dict: Analysis results
    """
    # Create Athena client
    client = boto3.client('athena')
    
    # Define query
    query = f"""
    SELECT
        eventTime,
        eventName,
        userIdentity.principalId,
        userIdentity.type,
        sourceIPAddress,
        awsRegion
    FROM
        cloudtrail.logs
    WHERE
        eventTime BETWEEN '{start_time}' AND '{end_time}'
        AND eventName IN (
            'AssumeRole',
            'ConsoleLogin',
            'CreateAccessKey',
            'DeleteAccessKey',
            'UpdateAccessKey',
            'AttachRolePolicy',
            'DetachRolePolicy',
            'PutRolePolicy',
            'DeleteRolePolicy'
        )
    ORDER BY
        eventTime
    """
    
    # Execute query
    response = client.start_query_execution(
        QueryString=query,
        QueryExecutionContext={
            'Database': 'cloudtrail'
        },
        ResultConfiguration={
            'OutputLocation': 's3://zerotrustkerberoslink-logs/athena-results/'
        }
    )
    
    # Get query results
    query_execution_id = response['QueryExecutionId']
    results = wait_for_query_results(client, query_execution_id)
    
    # Analyze results
    analysis_results = analyze_query_results(results)
    
    return analysis_results
```

## AWS Security Hub Integration

ZeroTrustKerberosLink integrates with AWS Security Hub to provide a comprehensive view of security posture.

### Security Hub Findings

ZeroTrustKerberosLink generates Security Hub findings for security events:

```python
def create_security_hub_finding(event):
    """
    Creates a Security Hub finding for a security event.
    
    Args:
        event: Security event
        
    Returns:
        dict: Security Hub finding
    """
    # Create Security Hub client
    client = boto3.client('securityhub')
    
    # Generate finding ID
    finding_id = str(uuid.uuid4())
    
    # Create finding
    finding = {
        'SchemaVersion': '2018-10-08',
        'Id': finding_id,
        'ProductArn': f'arn:aws:securityhub:{os.environ["AWS_REGION"]}:{os.environ["AWS_ACCOUNT_ID"]}:product/{os.environ["AWS_ACCOUNT_ID"]}/zerotrustkerberoslink',
        'GeneratorId': 'zerotrustkerberoslink-security-event',
        'AwsAccountId': os.environ['AWS_ACCOUNT_ID'],
        'Types': [
            'Unusual Behaviors/IAM Policy Change'
        ],
        'CreatedAt': datetime.datetime.utcnow().isoformat() + 'Z',
        'UpdatedAt': datetime.datetime.utcnow().isoformat() + 'Z',
        'Severity': {
            'Label': event['severity']
        },
        'Title': event['title'],
        'Description': event['description'],
        'ProductFields': {
            'ZeroTrustKerberosLink/EventType': event['event_type'],
            'ZeroTrustKerberosLink/UserId': event['user_id']
        },
        'Resources': [
            {
                'Type': 'AwsIamRole',
                'Id': event['resource_id'],
                'Partition': 'aws',
                'Region': os.environ['AWS_REGION']
            }
        ],
        'RecordState': 'ACTIVE'
    }
    
    # Submit finding
    response = client.batch_import_findings(
        Findings=[finding]
    )
    
    return response
```

### Security Hub Custom Insights

ZeroTrustKerberosLink provides custom Security Hub insights:

```python
def create_security_hub_insights():
    """
    Creates custom Security Hub insights for ZeroTrustKerberosLink.
    """
    # Create Security Hub client
    client = boto3.client('securityhub')
    
    # Create insight for unusual role assumptions
    response = client.create_insight(
        Name='ZeroTrustKerberosLink-UnusualRoleAssumptions',
        Filters={
            'ProductName': [
                {
                    'Comparison': 'EQUALS',
                    'Value': 'ZeroTrustKerberosLink'
                }
            ],
            'Types': [
                {
                    'Comparison': 'EQUALS',
                    'Value': 'Unusual Behaviors/IAM Role Assumption'
                }
            ]
        },
        GroupByAttribute='ResourceId'
    )
    
    # Create insight for authentication failures
    response = client.create_insight(
        Name='ZeroTrustKerberosLink-AuthenticationFailures',
        Filters={
            'ProductName': [
                {
                    'Comparison': 'EQUALS',
                    'Value': 'ZeroTrustKerberosLink'
                }
            ],
            'Types': [
                {
                    'Comparison': 'EQUALS',
                    'Value': 'Unusual Behaviors/Authentication Failure'
                }
            ]
        },
        GroupByAttribute='UserName'
    )
```

### Security Hub Compliance Checks

ZeroTrustKerberosLink implements Security Hub compliance checks:

1. **CIS AWS Foundations**: Compliance with CIS AWS Foundations Benchmark
2. **AWS Foundational Security Best Practices**: Compliance with AWS security best practices
3. **PCI DSS**: Compliance with Payment Card Industry Data Security Standard
4. **Custom Checks**: Custom compliance checks specific to ZeroTrustKerberosLink

Example compliance check implementation:

```python
def check_compliance():
    """
    Checks compliance with security standards.
    """
    # Create Security Hub client
    client = boto3.client('securityhub')
    
    # Get compliance findings
    response = client.get_findings(
        Filters={
            'ComplianceStatus': [
                {
                    'Comparison': 'EQUALS',
                    'Value': 'FAILED'
                }
            ],
            'ProductName': [
                {
                    'Comparison': 'EQUALS',
                    'Value': 'Security Hub'
                }
            ],
            'ComplianceSecurityControlId': [
                {
                    'Comparison': 'PREFIX',
                    'Value': 'CIS'
                }
            ]
        }
    )
    
    # Process findings
    findings = response['Findings']
    
    # Generate compliance report
    compliance_report = generate_compliance_report(findings)
    
    return compliance_report
```

## AWS Config Integration

ZeroTrustKerberosLink integrates with AWS Config for continuous monitoring of AWS resource configurations.

### AWS Config Rules

ZeroTrustKerberosLink recommends the following AWS Config rules:

```yaml
ConfigRules:
  IAMUserMFAEnabled:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: iam-user-mfa-enabled
      Description: Checks whether AWS Multi-Factor Authentication (MFA) is enabled for all IAM users
      Source:
        Owner: AWS
        SourceIdentifier: IAM_USER_MFA_ENABLED
  
  IAMPolicyNoStatementsWithAdminAccess:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: iam-policy-no-statements-with-admin-access
      Description: Checks IAM policies that have allow statements that grant permissions to all actions on all resources
      Source:
        Owner: AWS
        SourceIdentifier: IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS
  
  RootAccountMFAEnabled:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: root-account-mfa-enabled
      Description: Checks whether the root user of your AWS account requires multi-factor authentication for console sign-in
      Source:
        Owner: AWS
        SourceIdentifier: ROOT_ACCOUNT_MFA_ENABLED
```

### Custom AWS Config Rules

ZeroTrustKerberosLink provides custom AWS Config rules:

```python
def create_custom_config_rule():
    """
    Creates a custom AWS Config rule for ZeroTrustKerberosLink.
    """
    # Create Config client
    client = boto3.client('config')
    
    # Create custom rule
    response = client.put_config_rule(
        ConfigRule={
            'ConfigRuleName': 'zerotrustkerberoslink-role-trust-policy',
            'Description': 'Checks that IAM roles used by ZeroTrustKerberosLink have appropriate trust policies',
            'Scope': {
                'ComplianceResourceTypes': [
                    'AWS::IAM::Role'
                ]
            },
            'Source': {
                'Owner': 'CUSTOM_LAMBDA',
                'SourceIdentifier': 'arn:aws:lambda:us-east-1:123456789012:function:ZeroTrustKerberosLinkConfigRule',
                'SourceDetails': [
                    {
                        'EventSource': 'aws.config',
                        'MessageType': 'ConfigurationItemChangeNotification'
                    }
                ]
            },
            'InputParameters': json.dumps({
                'requiredTrustPrincipal': 'arn:aws:iam::123456789012:role/ZeroTrustKerberosLinkRole'
            })
        }
    )
```

### AWS Config Conformance Packs

ZeroTrustKerberosLink provides AWS Config conformance packs:

```yaml
ConformancePack:
  Type: AWS::Config::ConformancePack
  Properties:
    ConformancePackName: ZeroTrustKerberosLinkSecurityPack
    DeliveryS3Bucket: zerotrustkerberoslink-config
    ConformancePackInputParameters:
      - ParameterName: IAMUserMFAEnabledParamName
        ParameterValue: true
    TemplateBody: |
      Parameters:
        IAMUserMFAEnabledParamName:
          Type: String
          Default: false
      Resources:
        IAMUserMFAEnabled:
          Properties:
            ConfigRuleName: iam-user-mfa-enabled
            Description: Checks whether AWS Multi-Factor Authentication (MFA) is enabled for all IAM users
            Source:
              Owner: AWS
              SourceIdentifier: IAM_USER_MFA_ENABLED
          Type: AWS::Config::ConfigRule
        IAMPolicyNoStatementsWithAdminAccess:
          Properties:
            ConfigRuleName: iam-policy-no-statements-with-admin-access
            Description: Checks IAM policies that have allow statements that grant permissions to all actions on all resources
            Source:
              Owner: AWS
              SourceIdentifier: IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS
          Type: AWS::Config::ConfigRule
        RootAccountMFAEnabled:
          Properties:
            ConfigRuleName: root-account-mfa-enabled
            Description: Checks whether the root user of your AWS account requires multi-factor authentication for console sign-in
            Source:
              Owner: AWS
              SourceIdentifier: ROOT_ACCOUNT_MFA_ENABLED
          Type: AWS::Config::ConfigRule
```

## AWS GuardDuty Integration

ZeroTrustKerberosLink integrates with AWS GuardDuty for threat detection.

### GuardDuty Configuration

ZeroTrustKerberosLink recommends the following GuardDuty configuration:

```yaml
GuardDuty:
  Type: AWS::GuardDuty::Detector
  Properties:
    Enable: true
    FindingPublishingFrequency: FIFTEEN_MINUTES
```

### GuardDuty Finding Processing

ZeroTrustKerberosLink processes GuardDuty findings:

```python
def process_guardduty_findings(event, context):
    """
    Processes GuardDuty findings.
    
    Args:
        event: CloudWatch Events event
        context: Lambda context
    """
    # Extract finding
    finding = event['detail']
    
    # Check if finding is related to ZeroTrustKerberosLink
    if is_zerotrustkerberoslink_related(finding):
        # Create incident
        incident = create_incident_from_finding(finding)
        
        # Notify security team
        notify_security_team(incident)
        
        # Take automated remediation actions
        remediate_finding(finding)

def is_zerotrustkerberoslink_related(finding):
    """
    Determines if a GuardDuty finding is related to ZeroTrustKerberosLink.
    
    Args:
        finding: GuardDuty finding
        
    Returns:
        bool: Whether finding is related to ZeroTrustKerberosLink
    """
    # Check resource tags
    resource = finding.get('resource', {})
    resource_type = resource.get('resourceType')
    
    if resource_type == 'AccessKey':
        # Check if access key is used by ZeroTrustKerberosLink
        access_key_details = resource.get('accessKeyDetails', {})
        user_name = access_key_details.get('userName', '')
        
        return user_name.startswith('ZeroTrustKerberosLink')
    elif resource_type == 'Instance':
        # Check if instance is a ZeroTrustKerberosLink instance
        instance_details = resource.get('instanceDetails', {})
        tags = instance_details.get('tags', [])
        
        for tag in tags:
            if tag.get('key') == 'Service' and tag.get('value') == 'ZeroTrustKerberosLink':
                return True
    
    return False
```

## AWS KMS Integration

ZeroTrustKerberosLink integrates with AWS Key Management Service (KMS) for encryption.

### KMS Key Configuration

ZeroTrustKerberosLink uses customer-managed KMS keys:

```yaml
KMSKey:
  Type: AWS::KMS::Key
  Properties:
    Description: KMS key for ZeroTrustKerberosLink
    EnableKeyRotation: true
    KeyPolicy:
      Version: '2012-10-17'
      Id: zerotrustkerberoslink-key-policy
      Statement:
        - Sid: Enable IAM User Permissions
          Effect: Allow
          Principal:
            AWS: !Sub arn:aws:iam::${AWS::AccountId}:root
          Action: kms:*
          Resource: '*'
        - Sid: Allow ZeroTrustKerberosLink to use the key
          Effect: Allow
          Principal:
            AWS: !GetAtt ZeroTrustKerberosLinkRole.Arn
          Action:
            - kms:Encrypt
            - kms:Decrypt
            - kms:ReEncrypt*
            - kms:GenerateDataKey*
            - kms:DescribeKey
          Resource: '*'
```

### Data Encryption with KMS

ZeroTrustKerberosLink uses KMS for data encryption:

```python
def encrypt_data(data, key_id):
    """
    Encrypts data using KMS.
    
    Args:
        data: Data to encrypt
        key_id: KMS key ID
        
    Returns:
        str: Base64-encoded encrypted data
    """
    # Create KMS client
    client = boto3.client('kms')
    
    # Encrypt data
    response = client.encrypt(
        KeyId=key_id,
        Plaintext=data.encode('utf-8')
    )
    
    # Return base64-encoded ciphertext
    return base64.b64encode(response['CiphertextBlob']).decode('utf-8')

def decrypt_data(encrypted_data, key_id):
    """
    Decrypts data using KMS.
    
    Args:
        encrypted_data: Base64-encoded encrypted data
        key_id: KMS key ID
        
    Returns:
        str: Decrypted data
    """
    # Create KMS client
    client = boto3.client('kms')
    
    # Decode base64
    ciphertext = base64.b64decode(encrypted_data)
    
    # Decrypt data
    response = client.decrypt(
        KeyId=key_id,
        CiphertextBlob=ciphertext
    )
    
    # Return decrypted data
    return response['Plaintext'].decode('utf-8')
```

## Conclusion

ZeroTrustKerberosLink provides comprehensive AWS security integration, ensuring that enterprise Kerberos authentication can be securely integrated with AWS services. By implementing IAM role mapping, AWS security best practices, and integration with AWS security services, ZeroTrustKerberosLink provides a secure foundation for AWS access while maintaining Zero Trust principles.
