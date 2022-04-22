const AWS = require('aws-sdk');
const helper = require('./sqs-message-pusher-helper');

const emailList = require('./message-list.json');

const {
  KmsKeyringNode,
  buildClient,
  CommitmentPolicy,
} = require('@aws-crypto/client-node');

const { encrypt, decrypt } = buildClient(
  CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT
);

/**
 * seting up KMS Keyring for encrypting the data
 */
const generatorKeyId = process.env.GENERATOR_KMS_KEY;
const keyIds = [process.env.KMS_KEY];

class messagePusher {
  constructor(event, context, callback) {
    this.event = event;
    this.context = context;
    this.callback = callback;
  }

  startProcess() {
    return new Promise(async (resolve, reject) => {
      try {
        // console.log('Event : ', this.event);
        // let body = this.event.body;

        // emailList.forEach((email) => {
        //   console.log('EMAIL :: ', email);
        //   this.pushMessageToSQS(email);
        // });

        const keyring = new KmsKeyringNode({ generatorKeyId, keyIds });
        const result = new Buffer.from(
          this.event.Records[0].dynamodb.NewImage.SubscriptionEmail_c.B,
          'base64'
        );

        console.log(typeof result);

        /* Decrypt the data. */
        (async () => {
          const { plaintext, messageHeader } = await decrypt(keyring, result);
          this.pushMessageToSQS(plaintext.toString('utf8'));
          console.log('DECRYPTED EMAIL :: ', plaintext.toString('utf8'));
        })().catch((e) => console.log('Caught: ' + e));

        // const { plaintext, messageHeader } = await decrypt(keyring, result);
        // console.log('DECRYPTED EMAIL :: ', plaintext.toString('utf8'));

        console.log('EVENT :: ', this.event);
        console.log(
          'email is ::',
          this.event.Records[0].dynamodb.NewImage.SubscriptionEmail_c.B
        );

        let responseObj = helper.responseObj(
          'Message pushed to SQS successfully',
          200
        );

        console.log('Response created with helper function:: ', responseObj);

        // responseObj.data = {};
        resolve(responseObj);
      } catch (error) {
        console.log('Error Pushing the message to SQS:: ', error);

        let errorObject = {};

        errorObject.statusCode = 500;
        errorObject.statusMessage = JSON.stringify(error);

        reject(errorObject);
      }
    });
  }

  // send messages to SQS
  pushMessageToSQS(message) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Inside pushMessageToSQS');

        var sqs = new AWS.SQS();

        var params = {
          MessageBody: message,
          QueueUrl: process.env.SQS_URL,
        };
        console.log('pushMessageToSQS params : ', params);

        sqs.sendMessage(params, function (err, data) {
          if (err) {
            console.log('pushMessageToSQS Errored:: ', JSON.stringify(err));
            reject();
          } else {
            console.log('pushMessageToSQS Response:: ', data);
            resolve(data);
          }
        });
      } catch (err) {
        console.log('error in pushMessageToSQS:: ', err);
        reject(err);
      }
    });
  }
}

module.exports = messagePusher;
