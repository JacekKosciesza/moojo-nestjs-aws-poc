import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class VpcCdkConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, "moojo-vpc", {
      vpcName: "moojo-vpc",
      cidr: "10.0.0.0/16",
      maxAzs: 2,
      natGateways: 2,
      natGatewayProvider: ec2.NatProvider.gateway(),
      subnetConfiguration: [
        {
          name: "moojo-public-subnet",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "moojo-private-subnet",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });
  }
}
