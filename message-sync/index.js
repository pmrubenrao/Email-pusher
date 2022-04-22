/**
 * v1.0: This lambda function would trigger through S3,
 * and saves the information from file it reads from s3
 * to the dynamoDB
 */

const aws = require('aws-sdk');

const {
  KmsKeyringNode,
  buildClient,
  CommitmentPolicy,
} = require('@aws-crypto/client-node');

const { encrypt, decrypt } = buildClient(
  CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT
);

/**
 * seting up KMS keyring for encrypting the data
 */

const generatorKeyId = process.env.GENERATOR_KMS_KEY;
const keyIds = [process.env.KMS_KEY];

const s3 = new aws.S3({ apiVersion: '2006-03-01' });

aws.config.update({ region: 'us-east-1' });
const ddb = new aws.DynamoDB.DocumentClient();

exports.handler = async function (event, context) {
  /**
   * EXtracting the information from the S3 bucket
   */
  const bucket = event.Records[0].s3.bucket.name;
  console.log('raw-evet:: ', event);
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, ' ')
  );
  const params = {
    Bucket: bucket,
    Key: key,
  };
  try {
    const response = await s3.getObject(params).promise();
    console.log('From s3 bucket file :', response);
    let fileContent = JSON.parse(response.Body);
    console.log('filecontent:: ', fileContent);

    const keyring = new KmsKeyringNode({ generatorKeyId, keyIds });

    const context = {
      stage: 'Production',
      purpose: 'Encrypting the emailid of the user',
      origin: 'us-east-1',
    };

    const cleartext = fileContent.SubscriptionEmail_c;

    /* Encrypt the data. */
    const { result } = await encrypt(keyring, cleartext, {
      encryptionContext: context,
    });
    console.log('RESULT from EENCRYPTION', result);

    /* Decrypt the data. */
    // const { plaintext, messageHeader } = await decrypt(keyring, result);
    // console.log('decryption ', plaintext.toString('utf8'));

    const paramsInsert = {
      TableName: 'message-sync',
      Item: {
        SubscriptionEmail_c: result,
        Echo_Ideac: fileContent.Echo_Ideac,
        Echo_IsActivec: fileContent.Echo_IsActivec,
        Echo_SubscriptionType_c: fileContent.Echo_SubscriptionType_c,
      },
    };

    /**
     * Inserting the extracted value to dyanamoDB.
     */
    await ddb
      .put(paramsInsert)
      .promise()
      .then((data) => {
        console.log(
          `[INFO-LOG] - Synchronising the message with dynamodb for user id ${fileContent.SubscriptionEmail_c}.`
        );
      })
      .catch((err) => {
        console.log(
          `[ERROR-LOG] - Something went wrong. Could not synchronise db for user id ${fileContent.SubscriptionEmail_c}. - ${err}`
        );
      });
  } catch (err) {
    console.log(err);
    const message = `Error getting object ${key} from bucket ${bucket}.`;
    console.log(message);
    throw new Error(message);
  }
};
