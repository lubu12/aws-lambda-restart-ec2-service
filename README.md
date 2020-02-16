# aws-lambda-restart-ec2-service
Using lambda to restart services at unhealthy EC2 instances via SNS and SSM

References:
https://medium.com/@simonrand_43344/using-aws-simple-systems-manager-and-lambda-to-replace-cron-in-an-ec2-auto-scaling-group-939d114ec9d7
https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS.html

## Background
We are having 3 Target Groups at AWS.
* Varnish EC2 instances
* EC2 instances for serving store front users
* EC2 instances for admin panel

Our project is to set up a system to restart varnish service if there is any unhealthy EC2 instance at Varnish Target group or restart php-fpm and nginx services if there is any at Store Front and Admin Panel Target Groups.
