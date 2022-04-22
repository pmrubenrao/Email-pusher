const serviceHandler = require('./src/app.js');

exports.handler = (event, context, callback) => {
  console.log(JSON.stringify(event));
  try {
    return new Promise(async (resolve, reject) => {
      console.log('---inside index---');
      let ServiceReq = new serviceHandler(event, context, callback);
      ServiceReq.init(event, context, callback);
    });
  } catch (error) {
    console.log('---exception---', error);
  }
};
