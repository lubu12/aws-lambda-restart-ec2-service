# aws-lambda-restart-ec2-service
Using lambda to restart services at unhealthy EC2 instances via SNS and SSM. Lambda function will automatically search for all unhealthy EC2 instances in the Target group reported by SNS and CloudWatch Alarm. Lambda will send commands by using the Documents at SSM to restart services at unhealthy instances.

References:
https://medium.com/@simonrand_43344/using-aws-simple-systems-manager-and-lambda-to-replace-cron-in-an-ec2-auto-scaling-group-939d114ec9d7

https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS.html


## Background
We are having 3 Target Groups at AWS.
* Varnish EC2 instances
* EC2 instances for serving store front users
* EC2 instances for admin panel

Our project is to set up a system to restart varnish service if there is any unhealthy EC2 instance at Varnish Target group or restart php-fpm and nginx services if there is any at Store Front and Admin Panel Target Groups.

## AWS Setup
* Cloudwatch Alarms are created for Target groups to monitor the instance health. Alarm will be triggered if unhealthy instance is more than one in Target group. (In order to monitor instance health, ALB / ELB may need to be used at Target group)
* SNS Topics are created and added to Cloudwatch Alarms, and the Topics will be used at Lambda function as trigger.
* An SNS Topic will be created and used as failed task reporting from Lambda function.
* Create Documents at SSM with the shell scripts to restart service.  Make sure all instances at Target groups are having SSM agent installed. https://docs.aws.amazon.com/systems-manager/latest/userguide/sysman-manual-agent-install.html
* Role for Lambda function needs to have AmazonSSMFullAccess, ElasticLoadBalancingReadOnly and AmazonSNSFullAccess permission policies besides AWSLambdaBasicExecutionRole.
