#!/bin/bash

# Create InsuranceUsers Table
aws dynamodb create-table \
    --table-name InsuranceUsers \
    --attribute-definitions AttributeName=email,AttributeType=S \
    --key-schema AttributeName=email,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region eu-central-1

# Create InsuranceJobs Table
aws dynamodb create-table \
    --table-name InsuranceJobs \
    --attribute-definitions \
        AttributeName=jobId,AttributeType=S \
        AttributeName=userEmail,AttributeType=S \
    --key-schema AttributeName=jobId,KeyType=HASH \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"UserEmailIndex\",
                \"KeySchema\": [{\"AttributeName\":\"userEmail\",\"KeyType\":\"HASH\"}],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
            }
        ]" \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region eu-central-1


