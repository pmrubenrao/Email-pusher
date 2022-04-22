var helper = {};

helper.responseObj = function (message, statusCode) {
  let responseObj = {
    statusMessage: message,
    statusCode: statusCode,
  };
  return responseObj;
};

helper.formatValidationError = function (errorDetails, statusCode) {
  let validatioError = {
    statusCode: statusCode,
    statusMessage: {
      name: errorDetails.name + ' in request data ',
      details: [],
    },
  };
  errorDetails.details.forEach((element) => {
    validatioError.statusMessage.details.push(element.message);
  });
  return validatioError;
};

module.exports = helper;
