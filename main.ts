import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";

import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { snsChatbot } from './lib/sns_chatbot';
import { dataAwsCallerIdentity, iamRole, iamRolePolicyAttachment } from "@cdktf/provider-aws";

import { S3Backend } from 'cdktf';

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // define resources here
    // Define AWS provider
    new AwsProvider(this, 'aws', {
      region: "ap-northeast-1", // Example: 'us-west-2'
      //profile: config.profile,
      defaultTags: [{
        tags: {
          environment: id,
          IaC: 'cdktf',

        }
      }]
    });

    // S3 backend configuration
    // ダミー関数でS3Backendを使用
    function useS3Backend() {
      console.log(S3Backend);
    }
    useS3Backend();
    /*　tfstate を S3 に保存する場合設定する
    new S3Backend(this, {
      bucket: <S3 Bucket Name>,
      key: <S3 Bucket Key>,
      region: <AWS Region>,
      encrypt: true,
    });
*/

    // Account ID を取得
    const current = new dataAwsCallerIdentity.DataAwsCallerIdentity(this, "current", {});



    // Chatbot用IAM Role Create
    const chatbotIamRole = new iamRole.IamRole(this, `chatbotIamRole`, {
      name: "alert-to-slack",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              Service: "chatbot.amazonaws.com",
            },
            Action: "sts:AssumeRole",
          },
        ],
      }),
    });
    // ChatbotのIAM Roleにポリシーをアタッチ Readonly
    new iamRolePolicyAttachment.IamRolePolicyAttachment(this, `chatbotIamRolePolicyAttachment`, {
      policyArn: "arn:aws:iam::aws:policy/ReadOnlyAccess",
      role: chatbotIamRole.name,
    });



    // SNS Chatbot
    snsChatbot(this,
      "myabaou-test", // Slack Channel ID
      "Slack-Test-SNS-Topic", // SNS Name
      chatbotIamRole.arn, // Chatbot IAM Role
      "C0XXXXXXX", // Slack Channel ID 
      "TXXXXXXX", // Slack Workspace ID 
      `${current.accountId}`
    );




  }
}

const app = new App();
new MyStack(app, "test");
app.synth();
