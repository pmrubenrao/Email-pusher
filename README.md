# Email-Pusher

Application build to send the mail to its targetted user in an HTML format.
The email body is picked up from the JSON file stored in the S3 bucket and user details like username, email address, etc are also fetched from the JSON file but stored in a different bucket.

Once we receive these details a Lambda function message-pusher combines both of these details and pushes them to the SQS queue.

On the Other end of the SQS queue, we have another Lambda function message-poller which polls this information from the SQS queue and uses the predefined template of SES to send the mail to the user detail it received from the SQS payload.

To handle failed events like Bounces, and complaints we have configured the SNS configuration-set which sends the notification to another lambda function failed-message-handler which stores the status of all the messages sent or failed to the JSON file and saves it to the S3 bucket for future reference.

## Installation

Every lambda function has its own directory and you have to install dependencies for each one of them individually.

Since AWS Lambda might not have all the dependencies out of the box you need to zip and upload the whole function with its dependencies to the lambda function

```bash
npm install <for each fucntion>
```

Further instruction coming soon...

1. Creating the SQS Queue.
2. Creating the SNS topics.
3. Subscribing to the SNS topics.
   ...

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
