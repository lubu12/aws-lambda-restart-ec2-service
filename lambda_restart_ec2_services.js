'use strict';

const AWS = require('aws-sdk');
const ssm = new AWS.SSM();
const alb = new AWS.ELBv2();
const snsTopicFailed = "YOUR_SNS_TOPICARN_FOR_SENDING_FAILED_MESSAGE";

var documentName = "";
var targetARN = "";

exports.handler = (event) => {
  if (event.Records[0].Sns.TopicArn.match(/.*YOUR_SNS_TOPIC_TO_CATCH_UNHEALTHY_INSTANCES_AT_VARNISH_TARGET_GROUP.*/)) {
    targetARN = "YOUR_VARNISH_TARGET_ARN";
    documentName = "YOUR_DOCUMENT_NAME_AT_SSM_FOR_RESTARTING_VARNISH";
  }
  else if (event.Records[0].Sns.TopicArn.match(/.*YOUR_SNS_TOPIC_TO_CATCH_UNHEALTHY_INSTANCES_AT_STOREFRONT_HOST_TARGET_GROUP.*/)) {
    targetARN = "YOUR_STOREFRONT_HOST_TARGET_ARN";
    documentName = "YOUR_DOCUMENT_NAME_AT_SSM_FOR_RESTARTING_PHP_NGINX";
  }
  else if (event.Records[0].Sns.TopicArn.match(/.*YOUR_SNS_TOPIC_TO_CATCH_UNHEALTHY_INSTANCES_AT_ADMIN_HOST_TARGET_GROUP.*/)) {
    targetARN = "YOUR_ADMIN_HOST_TARGET_ARN";
    documentName = "YOUR_DOCUMENT_NAME_AT_SSM_FOR_RESTARTING_PHP_NGINX";
  }
  else {
    reportFailure("Incorrect event TopicArn: ".concat(event.Records[0].Sns.TopicArn));
  }
  
  if (targetARN !== "") {
    fetchInstance(targetARN)
      .then(instanceIDs =>{
        runCommand(documentName, instanceIDs);
      })
      .catch(err => {
        reportFailure(err);
      });
  }
};

// Pass the Target ARN and find the unhealthy instance
const fetchInstance = (targetARN) => {
  return new Promise((resolve, reject) => {
    alb.describeTargetHealth({
      TargetGroupArn: targetARN
    }, (err, data) => {
      if (err) {
        reject(JSON.stringify(err));
      } else {
        const instanceIDs = selectInstance(data.TargetHealthDescriptions);
        if(instanceIDs) {
          resolve(instanceIDs);
        } else {
          reject('There is no unhealthy instances to restart service!');
        }
      }
    });
  });
};

// Find all unhealthy instances in the Target group and return their Instance IDs
const selectInstance = (instances) => {
  instances = instances.filter(instance => {
    return instance.TargetHealth.State == 'unhealthy';
  });

  if(instances.length === 0) return;

  var instanceIDs = [];
  for (var i in instances)
    instanceIDs[i]=instances[i].Target.Id;
    
  return instanceIDs;
};

// Report failure message to SNS Topic
const reportFailure = (failureMessage) => {
    reportFailureToSns(snsTopicFailed, failureMessage);
};

const reportFailureToSns = (topic, message) => {
  const sns = new AWS.SNS();

  return new Promise((resolve, reject) => {
    sns.publish({
      Message: message,
      Subject: 'Lambda Restart EC2 Scheduled Job Failed',
      TopicArn: topic
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// RunCommand on instandIds via SSM
const runCommand = (documentName, instanceIds) => {
  ssm.sendCommand({
    DocumentName: documentName,
    InstanceIds: instanceIds,
    TimeoutSeconds: 3600
  }, (err, data) => {
    if (err) {
      reportFailure(JSON.stringify(err));
    } else {
      console.log(data);
    }
  });
};
