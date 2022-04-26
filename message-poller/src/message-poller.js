const AWS = require('aws-sdk');
const helper = require('./message-poller-helper.js');

const nodemailer = require('nodemailer');
const sesTransport = require('nodemailer-ses-transport');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const { v4: uuidv4 } = require('uuid');
let messageLogger = '';

class messagePoller {
  constructor(event, context, callback) {
    this.event = event;
    this.context = context;
    this.callback = callback;
  }

  startProcess() {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Event received : ', this.event);
        let emailIDs = [];
        this.event.Records.forEach((record) => {
          emailIDs.push(record.body);
        });

        for (const emailID of emailIDs) {
          await this.sendBulkEmail(emailID);
          // this.sendBulkMailSMTP(emailID);
        }

        // (async () => {
        //   await this.uploadFileOnS3(
        //     messageLogger,
        //     'message-tracker-' + uuidv4() + '.csv'
        //   );
        // })().catch((e) => console.log('Caught: ' + e));

        var responseObj = helper.responseObj('Email sent successfully', 200);
        responseObj.data = {};
        resolve(responseObj);
      } catch (error) {
        console.log('Error SendBulkEmail StartProcess', error);
        var errorObject = {};
        errorObject.statusCode = 500;
        errorObject.statusMessage = JSON.stringify(error);
        reject(errorObject);
      }
    });
  }

  // uploadFileOnS3(fileData, fileName) {
  //   return new Promise((resolve, reject) => {
  //     (async () => {
  //       const params = {
  //         Bucket: 'message-tracker-bucket',
  //         Key: fileName,
  //         Body: fileData,
  //       };
  //       console.log(`file data :${fileData}`);
  //       console.log(`file name :${fileName}`);
  //       try {
  //         const response = await s3.upload(params).promise();
  //         console.log('Response: ', response);
  //         resolve(response);
  //       } catch (err) {
  //         reject(err);
  //       }
  //     })();
  //   });
  // }

  sendBulkEmail(emailID) {
    return new Promise((resolve, reject) => {
      const mailOptions = {
        from: process.env.FROM_ADDRESS,
        to: emailID,
        text: 'This is some text',
        html: '<b>This is some HTML</b>',
        headers: {
          Echo_Idea__c: 'a0S02000000kSaDEAU',
          Echo_FeedbackPageURL__c: 'www.google.com',
          Echo_ActedBy__c: 'null',
          Echo_NotificationActivityType__c: 'Idea External Status Change',
          Echo_PreActivityValue__c: 'InProgress',
          Echo_PostActivityValue__c: 'Completed',
        },
      };

      function callback(error, info) {
        if (error) {
          console.log(error);
          messageLogger =
            messageLogger +
            '\n' +
            new Date().toLocaleString() +
            '\t' +
            JSON.stringify(info.response) +
            ',' +
            JSON.stringify(info.envelope.to[0]);
          reject(messageLogger);
        } else {
          console.log('Message sent: ' + JSON.stringify(info));
          messageLogger =
            messageLogger +
            '\n' +
            new Date().toLocaleString() +
            ',' +
            JSON.stringify(info.response.split(' ', 2)) +
            ',' +
            JSON.stringify(info.envelope.to[0]);
          resolve(messageLogger);
        }
      }

      // Send e-mail using SMTP
      mailOptions.subject = 'Nodemailer SMTP transporter';
      const smtpTransporter = nodemailer.createTransport({
        port: process.env.SES_PORT,
        host: process.env.SES_HOST,
        secureConnection: false,
        auth: {
          user: process.env.SES_USERNAME,
          pass: process.env.SES_KEY,
        },
        tls: {
          ciphers: 'SSLv3',
        },
        debug: true,
      });
      smtpTransporter.sendMail(mailOptions, callback);
    });
  }
}

module.exports = messagePoller;
