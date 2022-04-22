const messsagePusher = require('./sqs-message-pusher');

class messsagePusherApp {
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
        let messsagePusherService = new messsagePusher(
          event,
          context,
          callback
        );

        messsagePusherService.startProcess().then(
          (success) => {
            console.log('resolved from messsagePusherService', success);
            const response = {
              statusCode: success.statusCode || 200,
              body: JSON.stringify(success),
            };
            this.callback(null, response);
            context.done();
          },
          (err) => {
            console.log('err in messsagePusherService', JSON.stringify(err));
            const response = {
              statusCode: err.statusCode || 500,
              body: JSON.stringify(err),
            };
            this.callback(null, response);
          }
        );
      });
    } catch (err) {
      console.log('exception in init', err);
    }
  }
}
module.exports = messsagePusherApp;
