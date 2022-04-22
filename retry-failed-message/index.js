/**
 * v1.0 - This function will pick the failed message from the FailedEmailNotifications table
 * and re-pushes to the sqs queue only when the the retry count is less than 3 or any pre-defined
 * values. This will prevent the solution to avoid the infinite loop case arrise when the same
 * message will get picked up by this function and get re-pushed to the sqs.
 */
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const docClient = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

/**
 * setting the params to hold bounce query condition.
 * will be used by the dynamo db query to filter only
 * bounced messages.
 */
const paramsFailedMessage = {
  TableName: process.env.FAILED_MESSAGE_DATABASE,
  ProjectionExpression: 'SESDestinationAddress, SESMessageType, retryCount',
  FilterExpression: 'SESMessageType = :SESMessageType',
  ExpressionAttributeValues: { ':SESMessageType': 'Delivery' },
};

/**
 * Function will re-push the bounced mail back to the BulkMail SQS.
 * Based on the retry counter.
 */

exports.handler = async (event, context) => {
  const response = await docClient.scan(paramsFailedMessage).promise();

  /**
   * Parsing each record from the databse and re-pushing the bounced message
   * back to the sqs queue which will be picked by message-poller function
   * for retry
   */
  await Promise.all(
    response.Items.map(async (d) => {
      const paramsRepushMessage = {
        MessageBody: d.SESDestinationAddress,
        QueueUrl: process.env.SQS_URL,
      };

      const retryCount = d.retryCount;
      if (!(retryCount < 3)) {
        return null;
      }
      const pushResponse = await sqs.sendMessage(paramsRepushMessage).promise();
      return pushResponse;
    })
  )
    .then((data) => {
      console.log(
        `[INFO-LOG] - Pushed the bounced message back to BulkEmail SQS. ${JSON.stringify(
          data
        )}`
      );
    })
    .catch((err) => {
      console.log(
        `[ERROR-LOG] - Something went wrong. Pushing  back to BulkEmail SQS failed due to ${JSON.stringify(
          err
        )}`
      );
    });
};
