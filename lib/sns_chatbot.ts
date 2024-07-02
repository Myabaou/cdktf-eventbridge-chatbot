// CDK For Terraform SNS Topic CHatbot

import { Construct } from 'constructs';
import { Token } from "cdktf";
import * as aws from '@cdktf/provider-aws';


export function snsChatbot(scope: Construct,
	channelId: string,
	snsName: string,
	chatbotIamRoleArn: string,
	slackChannelId: string,
	slackWorkspaceId: string,
	accountId: string
) {

	// SNS Topic Create
	const snsSlack = new aws.snsTopic.SnsTopic(scope, `ToSlack_${channelId}`, {
		name: snsName,
	});




	const snsSlackPolicy = new aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(scope, `snsSlackPolicy_${channelId}`, {
		statement: [
			{
				actions: [
					"SNS:Subscribe",
					"SNS:SetTopicAttributes",
					"SNS:RemovePermission",
					"SNS:Receive",
					"SNS:Publish",
					"SNS:ListSubscriptionsByTopic",
					"SNS:GetTopicAttributes",
					"SNS:DeleteTopic",
					"SNS:AddPermission",
				],
				condition: [
					{
						test: "StringEquals",
						variable: "AWS:SourceOwner",
						values: [accountId],
					},
				],
				effect: "Allow",
				principals: [
					{
						type: "AWS",
						identifiers: ["*"],
					},
				],
				resources: [snsSlack.arn],
				sid: "__default_statement_ID",
			},
			{
				actions: ["sns:Publish"],
				principals: [
					{
						type: "Service",
						identifiers: ["events.amazonaws.com"],
					},
				],
				resources: [snsSlack.arn],
			},
		],
	});

	// SNS Topic Policy Attach
	new aws.snsTopicPolicy.SnsTopicPolicy(scope, `snsPolicy_${channelId}`, {
		arn: snsSlack.arn,
		policy: Token.asString(snsSlackPolicy.json),
	});

	// Cloudformationn のStack名で_(アンダーバー)が使えないため変換処理
	const channelIdWithoutHyphens = channelId.replace(/_/g, "");

	// Chatbot for cloudformation YML 
	// Terraform がChatbotに対応していないためCloudformaitonで作成
	// ConfigurationNameはアカウント内で重複不可
	new aws.cloudformationStack.CloudformationStack(scope, `chatbot_${channelId}`, {
		name: `cloudformation-chatbot-${channelIdWithoutHyphens}`,
		templateBody: `
            Resources:
              SlackChannel:
                Type: AWS::Chatbot::SlackChannelConfiguration
                Properties:
                  ConfigurationName: 'AWS-Alert-${channelIdWithoutHyphens}'
                  SlackChannelId: ${slackChannelId}
                  SlackWorkspaceId: ${slackWorkspaceId}
                  SnsTopicArns:
                    - ${snsSlack.arn}
                  IamRoleArn: ${chatbotIamRoleArn}
                  `,
	});


}
