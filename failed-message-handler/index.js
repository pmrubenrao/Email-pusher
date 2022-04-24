/**
 *  v1.0: This lambda function would trigger through SNS notiifcation
 *  one the event of message delivery failed. For example if the message bounce from the
 *  user mailserver.
 */

const aws = require('aws-sdk');
aws.config.update({ region: 'us-east-1' });
const ddb = new aws.DynamoDB.DocumentClient();

const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const { v4: uuidv4 } = require('uuid');

exports.handler = async function (event, context) {
  const SnsPublishTime = event.Records[0].Sns.Timestamp;
  //   const SnsTopicArn = event.Records[0].Sns.TopicArn;
  let SESMessage = event.Records[0].Sns.Message;
  let messageLogger = '';

  SESMessage = JSON.parse(SESMessage);

  const SESMessageType = SESMessage.notificationType;
  const SESMessageId = SESMessage.mail.messageId;
  const SESDestinationAddress = SESMessage.mail.destination.toString();
  //   const LambdaReceiveTime = new Date().toString();

  console.log(event.Records[0].Sns);

  const paramsInsert = {
    TableName: 'FailedEmailNotifications',
    Item: {
      FailedEmailMessageId: SESMessageId,
      SnsPublishTime: SnsPublishTime,
      SESDestinationAddress: SESDestinationAddress,
      retryCount: 0,
      SESMessageType: SESMessageType,
    },
  };

  messageLogger =
    new Date().toLocaleString() + ',' + 'Success' + ',' + SESDestinationAddress;

  function uploadFileOnS3(data, fileName) {
    return new Promise((resolve, reject) => {
      (async () => {
        console.log(`file data :${data}`);
        console.log(`file name :${fileName}`);
        try {
          const paramsReadingFile = {
            Bucket: 'message-tracker-bucket',
            Key: fileName,
          };
          const readResponseS3 = await s3
            .getObject(paramsReadingFile)
            .promise();
          let fileContent = readResponseS3.Body.toString('utf-8');

          updatedData = fileContent + '\n' + data;

          const paramsUpdatingFile = {
            Bucket: 'message-tracker-bucket',
            Key: fileName,
            Body: updatedData,
          };
          const uploadResponseS3 = await s3
            .upload(paramsUpdatingFile)
            .promise();
          console.log('Upload Response ', updatedData);
          resolve(uploadResponseS3);
        } catch (err) {
          reject(err);
        }
      })();
    });
  }
  /**
   * Checking if the MessageType received from the SNS is the "Delivery"
   * Insert if the email was never been pushed to the user mailbox, otherwise
   * update the retryCounter to 1.
   */
  if (SESMessageType == 'Delivery') {
    /**
     * we create a file for each successfull devlivery of the mails to the end-user
     */

    await uploadFileOnS3(messageLogger, 'message-tracker.csv');
  }
};
