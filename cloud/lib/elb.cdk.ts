import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

interface ElbProps {
  vpc: ec2.Vpc;
}

export class ElbCdkConstruct extends Construct {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly listener: elbv2.ApplicationListener;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly targetGroup: elbv2.ApplicationTargetGroup;

  constructor(scope: Construct, id: string, { vpc }: ElbProps) {
    super(scope, id);

    this.securityGroup = new ec2.SecurityGroup(this, "moojo-elb-sg", {
      vpc,
      securityGroupName: "moojo-elb-sg",
      description: "Security group for Moojo ELB (Elastic Load Balancer)",
    });

    this.securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), // TODO: restrict?
      ec2.Port.tcp(80),
      "Allow from anyone on port 80"
    );

    this.alb = new elbv2.ApplicationLoadBalancer(this, "moojo-alb", {
      loadBalancerName: "moojo-alb",
      vpc,
      securityGroup: this.securityGroup,
      deletionProtection: false,
    });

    this.targetGroup = new elbv2.ApplicationTargetGroup(this, "moojo-alb-tg", {
      vpc,
      targetType: elbv2.TargetType.IP,
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 80,
      targetGroupName: "moojo-alb-tg",
    });

    this.listener = new elbv2.ApplicationListener(this, "moojo-alb-listener", {
      loadBalancer: this.alb,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.forward([this.targetGroup]),
    });
  }
}
