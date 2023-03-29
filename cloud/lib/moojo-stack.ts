import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { ApiGatewayCdkConstruct } from "./gw.cdk";
import { ElbCdkConstruct } from "./elb.cdk";
import { RdsCdkConstruct } from "./rds.cdk";
import { VpcCdkConstruct } from "./vpc.cdk";

export class MoojoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    cdk.Tags.of(this).add("app", "Moojo");

    const vpc = new VpcCdkConstruct(this, "vpc").vpc;
    const rds = new RdsCdkConstruct(this, "rds", { vpc });
    const elb = new ElbCdkConstruct(this, "elb", { vpc });
    const gw = new ApiGatewayCdkConstruct(this, "gw", { vpc, elb });
  }
}
