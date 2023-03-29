import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";

interface RdsProps {
  vpc: ec2.Vpc;
}

export class RdsCdkConstruct extends Construct {
  public readonly cluster: rds.ServerlessCluster;

  constructor(scope: Construct, id: string, { vpc }: RdsProps) {
    super(scope, id);

    const securityGroup = new ec2.SecurityGroup(this, "moojo-rds-sg", {
      vpc,
      securityGroupName: "moojo-rds-sg",
      description: "Security group for Moojo RDS (Amazon Relational Databases)",
    });

    this.cluster = new rds.ServerlessCluster(this, "moojo-dbcluster", {
      clusterIdentifier: "moojo-dbcluster",
      defaultDatabaseName: "moojo",
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      parameterGroup: new rds.ParameterGroup(this, "ParameterGroup", {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_10_21, // TODO: adjust supported version
        }),
      }),
      enableDataApi: true, // TODO: needed for Query Editor (AWS console)
      removalPolicy: cdk.RemovalPolicy.DESTROY, // TODO: only for PoC
      vpc,
      scaling: {
        // TODO: adjust it
        autoPause: cdk.Duration.hours(1),
        minCapacity: rds.AuroraCapacityUnit.ACU_2,
        maxCapacity: rds.AuroraCapacityUnit.ACU_2,
      },
      securityGroups: [securityGroup],
    });
  }
}
