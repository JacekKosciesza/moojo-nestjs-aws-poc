import { Construct } from "constructs";
import { DockerImageAsset, Platform } from "aws-cdk-lib/aws-ecr-assets";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import * as path from "path";

import { ElbCdkConstruct } from "./elb.cdk";
import { RdsCdkConstruct } from "./rds.cdk";

interface EcsProps {
  vpc: ec2.Vpc;
  elb: ElbCdkConstruct;
  rds: RdsCdkConstruct;
}

export class EcsCdkConstruct extends Construct {
  constructor(scope: Construct, id: string, { vpc, elb, rds }: EcsProps) {
    super(scope, id);

    const cluster = new ecs.Cluster(this, "moojo-ecs-cluster", {
      clusterName: "moojo-ecs-cluster",
      vpc,
    });

    const securityGroup = new ec2.SecurityGroup(this, "moojo-ecs-sg", {
      vpc,
      securityGroupName: "moojo-ecs-sg",
      description: "Security group for Moojo ECS (Elastic Container Service)",
    });

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "moojo-ecs-task-definition",
      {
        // TODO: adjust it
        memoryLimitMiB: 1024,
        cpu: 512,
      }
    );

    const image = new DockerImageAsset(this, "moojo-ecr-image", {
      directory: path.join(__dirname, "../../", "moojo"),
      platform: Platform.LINUX_AMD64,
    });

    const logging = new ecs.AwsLogDriver({
      streamPrefix: "moojo",
    });

    taskDefinition.addContainer("moojo-ecs-container", {
      containerName: "moojo-ecs-container",
      logging,
      image: ecs.ContainerImage.fromDockerImageAsset(image),
      portMappings: [
        {
          containerPort: 3000,
          protocol: ecs.Protocol.TCP,
        },
      ],
      environment: {
        NODE_ENV: "production",
        DATABASE_URL: this.getDatabaseUrlUnsafe(rds.cluster.secret!), // TODO: do it in a secure way
      },
    });

    const service = new ecs.FargateService(this, `${id}`, {
      serviceName: "moojo-ecs-service",
      taskDefinition,
      securityGroups: [securityGroup],
      cluster,
      // TODO: adjust it
      desiredCount: 1,
      enableExecuteCommand: true,
      maxHealthyPercent: 200,
      minHealthyPercent: 100,
    });

    // TODO: adjust it
    const scaling = service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 2,
    });

    // TODO: adjust it
    scaling.scaleOnCpuUtilization(`${id}-cpuscaling`, {
      targetUtilizationPercent: 85,
      scaleInCooldown: cdk.Duration.seconds(120),
      scaleOutCooldown: cdk.Duration.seconds(30),
    });

    rds.cluster.connections.allowDefaultPortFrom(
      service,
      "Fargate access to Aurora"
    );

    service.connections.allowFrom(
      elb.alb,
      ec2.Port.tcp(80),
      "Allow traffic from ELB"
    );

    elb.listener.addTargets("moojo-ecs-targets", {
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: {
        // TODO: adjust it
        healthyHttpCodes: "200",
        healthyThresholdCount: 3,
        interval: cdk.Duration.seconds(30),
      },
    });
  }

  // TODO: do it in a secure way!!!
  private getDatabaseUrlUnsafe(secret: sm.ISecret): string {
    const host = secret.secretValueFromJson("host").unsafeUnwrap();
    const port = secret.secretValueFromJson("port").unsafeUnwrap();
    const username = secret.secretValueFromJson("username").unsafeUnwrap();
    const password = secret.secretValueFromJson("password").unsafeUnwrap();
    const database = secret.secretValueFromJson("dbname").unsafeUnwrap();

    return `postgresql://${username}:${password}@${host}:${port}/${database}`;
  }
}
