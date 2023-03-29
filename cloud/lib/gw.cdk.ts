import { Construct } from "constructs";
import * as apigwv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as integrations from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

import { ElbCdkConstruct } from "./elb.cdk";

interface ApiGatewayProps {
  vpc: ec2.Vpc;
  elb: ElbCdkConstruct;
}

export class ApiGatewayCdkConstruct extends Construct {
  constructor(scope: Construct, id: string, { vpc, elb }: ApiGatewayProps) {
    super(scope, id);

    const httpApi = new apigwv2.HttpApi(this, "moojo-http-api", {
      apiName: "moojo-http-api",
    });

    const vpcLink = new apigwv2.VpcLink(this, "moojo-vpc-link", {
      vpc,
      vpcLinkName: "moojo-vpc-link",
    });

    const integration = new integrations.HttpAlbIntegration(
      "moojo-http-alb-integration",
      elb.listener,
      {
        method: apigwv2.HttpMethod.ANY, // TODO: restrict?
        vpcLink,
      }
    );

    const route = new apigwv2.HttpRoute(this, "moojo-http-route", {
      httpApi,
      routeKey: apigwv2.HttpRouteKey.with("/{proxy+}", apigwv2.HttpMethod.ANY), // TODO: restrict?
      integration,
    });
  }
}
