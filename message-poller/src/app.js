const messagePoller = require('./message-poller');

class messsagePollerApp {
  constructor(event, context, callback) {
    this.event = event;
    this.context = context;
    this.callback = callback;
  }
  init(event, context, callback) {
    console.log('---Inside app.js---');
    console.log(JSON.stringify(this.event));
    try {
      return new Promise((resolve, reject) => {
        // Instantiating the sendBulkEmailService object to send message to SQS
        let messagePollerService = new messagePoller(event, context, callback);
        messagePollerService.startProcess().then(
          (success) => {
            const response = {
              statusCode: success.statusCode || 200,
              body: JSON.stringify(success),
            };

            console.log('messagePollerService.startProcess Sucess:: ', success);
            console.log('response ::', response);

            this.callback(null, response);
            context.done();
          },
          (err) => {
            console.log('messagePollerService Failed:: ', JSON.stringify(err));
            const response = {
              statusCode: err.statusCode || 500,
              body: JSON.stringify(err),
            };
            this.callback(null, response);
          }
        );
      });
    } catch (exe) {
      console.log('messsagePollerApp init  Failed:: ', exe);
    }
  }
}
module.exports = messsagePollerApp;
