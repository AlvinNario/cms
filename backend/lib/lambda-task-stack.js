const cdk = require('aws-cdk-lib');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const lambda = require('aws-cdk-lib/aws-lambda');
const sqs = require('aws-cdk-lib/aws-sqs');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const iam = require('aws-cdk-lib/aws-iam');
const events = require('aws-cdk-lib/aws-events');
const targets = require('aws-cdk-lib/aws-events-targets');
const bcrypt = require('bcryptjs'); // Used to compare hashed passwords

class AwsMarketplaceApiStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // 📌 Reference the existing Users table
    // 📌 Users Table
    const usersTable = new dynamodb.Table(this, 'UserTable', {
      tableName: 'Users',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Prevents accidental deletion
    });

    // ✅ Define the EmailIndex (GSI)
    usersTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex', // GSI Name
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING }, // Email field
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING }, // User ID field
      projectionType: dynamodb.ProjectionType.ALL, // Include all attributes
    });

    // 📌 Categories Table
    const categoriesTable = new dynamodb.Table(this, 'CategoriesTable', {
      tableName: 'Categories',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    categoriesTable.addGlobalSecondaryIndex({
      indexName: 'MarketplaceIndex',
      partitionKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 📌 Sections Table
    const sectionsTable = new dynamodb.Table(this, 'SectionsTable', {
      tableName: 'Sections',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // 📌 CardSchemas Table
    const cardSchemasTable = new dynamodb.Table(this, 'CardSchemasTable', {
      tableName: 'CardSchemas',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // SCHEMA#{id}
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // SECTION#{sectionId}
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // 📌 Listings Table (for verification)
    const listingsTable = new dynamodb.Table(this, 'ListingsTable', {
      tableName: 'Listings',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // LISTING#{id}
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // VERIFICATION
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // 📌 Messages Table
    const messagesTable = new dynamodb.Table(this, 'MessagesTable', {
      tableName: 'Messages',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // MESSAGE#{id}
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // STATUS
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // 📌 Create DynamoDB Table for Bids
    const bidsTable = new dynamodb.Table(this, 'Bids', {
      tableName: 'Bids',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // BID#{id}
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // AUCTION#{auctionId}
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // 🛒 Lambda Functions
    const createCategoryLambda = new lambda.Function(this, 'CreateCategoryFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/marketplace/createCategory'),
      environment: { TABLE_NAME: categoriesTable.tableName },
    });

    // 📌 SQS Queue for Category Updates
    const categoryQueue = new sqs.Queue(this, 'CategoryQueue', {
      queueName: 'CategoryQueue',
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    // 📌 EventBridge Rule for Category Updates
    const categoryUpdateRule = new events.Rule(this, 'CategoryUpdateRule', {
      ruleName: 'CategoryUpdateRule',
      eventPattern: {
        source: ['aws.marketplace'],
        detailType: ['CategoryUpdate'],
      },
    });
    categoryUpdateRule.addTarget(new targets.SqsQueue(categoryQueue));

    // 📌 Update Category Lambda
    const updateCategoryLambda = new lambda.Function(this, 'UpdateCategoryFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/marketplace/updateCategory'),
      environment: { 
        TABLE_NAME: categoriesTable.tableName,
        CATEGORY_QUEUE_URL: categoryQueue.queueUrl,
        EVENT_BUS_NAME: 'CategoryUpdateEventBus',
      },
    }); 

    // 📌 SQS Queue for Delete Category
    const deleteCategoryQueue = new sqs.Queue(this, 'DeleteCategoryQueue', {
      queueName: 'DeleteCategoryQueue',
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    // 📌 EventBridge Rule for Delete Category
    const deleteCategoryRule = new events.Rule(this, 'DeleteCategoryRule', {
      ruleName: 'DeleteCategoryRule',
      eventPattern: {
        source: ['aws.marketplace'],
        detailType: ['CategoryDelete'],
      },
    });
    deleteCategoryRule.addTarget(new targets.SqsQueue(deleteCategoryQueue));

    // 📌 Delete Category Lambda
    const deleteCategoryLambda = new lambda.Function(this, 'DeleteCategoryFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/marketplace/deleteCategory'),
      environment: {
        TABLE_NAME: categoriesTable.tableName,
        DELETE_CATEGORY_QUEUE_URL: deleteCategoryQueue.queueUrl,
      },
    });

    const getCategoryLambda = new lambda.Function(this, 'GetCategoryFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/marketplace/getCategory'),
      environment: { TABLE_NAME: categoriesTable.tableName },
    });

    // 📌 AssignQueue (SQS for Section Assignments)
    const assignQueue = new sqs.Queue(this, 'AssignQueue', {
      queueName: 'AssignQueue',
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    // 📌 AssignEvent (EventBridge Rule for Section Assignments)
    const assignEventRule = new events.Rule(this, 'AssignEventRule', {
      ruleName: 'AssignEventRule',
      eventPattern: {
        source: ['aws.marketplace'],
        detailType: ['SubcategoryAssignment'],
      },
    });
    assignEventRule.addTarget(new targets.SqsQueue(assignQueue));

    // 📌 Assign Subcategory Lambda
    const assignSubcategoryLambda = new lambda.Function(this, 'AssignSubcategoryFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/marketplace/assignSubcategory'),
      environment: { 
        SECTIONS_TABLE: sectionsTable.tableName,
        ASSIGN_QUEUE_URL: assignQueue.queueUrl,
      },
    });

    // 📌 SQS Queue for Schema Imports
    const schemaImportQueue = new sqs.Queue(this, 'SchemaImportQueue', {
      queueName: 'SchemaImportQueue',
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    // 📌 EventBridge Rule for Schema Imports
    const schemaImportEventRule = new events.Rule(this, 'SchemaImportEventRule', {
      ruleName: 'SchemaImportEventRule',
      eventPattern: {
        source: ['aws.marketplace'],
        detailType: ['SchemaImport'],
      },
    });
    schemaImportEventRule.addTarget(new targets.SqsQueue(schemaImportQueue));

    // 📌 Import Card Schema Lambda
    const importCardSchemaLambda = new lambda.Function(this, 'ImportCardSchemaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/cards/importCardSchema'),
      environment: {
        CARDSCHEMAS_TABLE: cardSchemasTable.tableName,
        SCHEMA_IMPORT_QUEUE_URL: schemaImportQueue.queueUrl,
      },
    });

    // 📌 SQS Queue for Verification
    const verifyQueue = new sqs.Queue(this, 'VerifyQueue', {
      queueName: 'VerifyQueue',
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    // 📌 EventBridge Rule for Verification
    const verifyQueueRule = new events.Rule(this, 'VerifyQueueRule', {
      ruleName: 'VerifyQueueRule',
      eventPattern: {
        source: ['aws.marketplace'], // Assuming the source is 'aws.marketplace' for the event.
        detailType: ['VerifyListing'], // Event type when a listing is verified.
      },
    });
    verifyQueueRule.addTarget(new targets.SqsQueue(verifyQueue));

    // 📌 New Lambda for Listings Verification
    const verifyListingLambda = new lambda.Function(this, 'VerifyListingFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/listings/verifyListing'),
      environment: {
        LISTINGS_TABLE: listingsTable.tableName,
        VERIFY_QUEUE_URL: verifyQueue.queueUrl,
      },
    });

     // Create an SQS Queue
    const reviewQueue = new sqs.Queue(this, 'ReviewQueue', {
      queueName: 'ReviewQueue',
      visibilityTimeout: cdk.Duration.seconds(30), // Adjust as needed
    });

    // Define the Lambda function
    const getPendingMessagesLambda = new lambda.Function(this, 'GetPendingMessagesFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/messages/getPendingMessages'),
      environment: {
        MESSAGES_TABLE: messagesTable.tableName,
        REVIEW_QUEUE_URL: reviewQueue.queueUrl, // Pass queue URL to Lambda
      },
    });

    // Create the PostMessage Lambda function
    const postMessageLambda = new lambda.Function(this, 'PostMessageFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/messages/postMessage'),
      environment: {
        MESSAGES_TABLE: messagesTable.tableName,
      },
    });

    const replyQueue = new sqs.Queue(this, 'ReplyQueue', {
      queueName: 'ReplyQueue',
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    const replyEventRule = new events.Rule(this, 'ReplyEventRule', {
      ruleName: 'ReplyEventRule',
      eventPattern: {
        source: ['aws.messages'],
        detailType: ['ReplyToMessage'],
      },
    });
    replyEventRule.addTarget(new targets.SqsQueue(replyQueue));
    
    const replyToMessageLambda = new lambda.Function(this, 'ReplyToMessageFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/messages/replyToMessage'),
      environment: {
        MESSAGE_TABLE: messagesTable.tableName,
        REPLY_QUEUE_URL: replyQueue.queueUrl,
      },
    });  
    
    // Create an SQS queue for filtered messages
    const filterQueue = new sqs.Queue(this, 'FilterQueue', {
      queueName: 'FilterQueue',
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    // Create an EventBridge rule for filtering events
    const filterEventRule = new events.Rule(this, 'FilterEventRule', {
      ruleName: 'FilterEventRule',
      eventPattern: {
        source: ['aws.messages'],
        detailType: ['FilterContactInfo'],
      },
    });
    filterEventRule.addTarget(new targets.SqsQueue(filterQueue));

    // Create the Lambda function for message filtering
    const filterContactInfoLambda = new lambda.Function(this, 'FilterContactInfoFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/messages/filterContactInfo'),
      environment: {
        MESSAGE_TABLE: messagesTable.tableName,
        FILTER_QUEUE_URL: filterQueue.queueUrl,
      },
    });

     // 📌 Create an SQS Queue for Bid Processing
     const bidQueue = new sqs.Queue(this, 'BidQueue', {
      queueName: 'BidQueue',
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    // 📌 Create an EventBridge Rule for Bid Events
    const bidEventRule = new events.Rule(this, 'BidEventRule', {
      ruleName: 'BidEvent',
      eventPattern: {
        source: ['aws.auctions'],
        detailType: ['PlaceBid'],
      },
    });
    bidEventRule.addTarget(new targets.SqsQueue(bidQueue));

    // 📌 Create the Lambda Function for Placing Bids
    const placeBidLambda = new lambda.Function(this, 'PlaceBidFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/auctions/placeBid'),
      environment: {
        BIDS_TABLE: bidsTable.tableName,
        BID_QUEUE_URL: bidQueue.queueUrl,
      },
    });

    // 📌 Create an SQS Queue for Membership Processing
    const membershipQueue = new sqs.Queue(this, 'MembershipQueue', {
      queueName: 'MembershipQueue',
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    // 📌 Create an EventBridge Rule for Membership Events
    const membershipEventRule = new events.Rule(this, 'MembershipEventRule', {
      ruleName: 'MembershipEvent',
      eventPattern: {
        source: ['aws.membership'],
        detailType: ['UpgradeMembership'],
      },
    });
    membershipEventRule.addTarget(new targets.SqsQueue(membershipQueue));

    // 📌 Create the Lambda Function for Upgrading Membership
    const upgradeMembershipLambda = new lambda.Function(this, 'UpgradeMembershipFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/membership/upgradeMembership'),
      environment: {
        USERS_TABLE: usersTable.tableName,
        MEMBERSHIP_QUEUE_URL: membershipQueue.queueUrl,
      },
    });

    // 📌 Create an SQS Queue for Authentication Processing
    const authQueue = new sqs.Queue(this, 'AuthQueuee', {
      queueName: 'AuthQueuee',
      visibilityTimeout: cdk.Duration.seconds(30), // Visibility Timeout for message processing
    });

    // 📌 Create an EventBridge Rule for Authentication Events
    const loginEventRule = new events.Rule(this, 'LoginEventRule', {
      ruleName: 'LoginEvent', // Name of the rule
      eventPattern: {
        source: ['aws.auth'], // The source for the event
        detailType: ['LoginEvent'], // The event detail type for login event
      },
    });

    // 📌 Add the SQS Queue as the Target for the EventBridge Rule
    loginEventRule.addTarget(new targets.SqsQueue(authQueue));

    // 📌 Create the Lambda Function for Handling User Authentication
    const loginUserLambda = new lambda.Function(this, 'LoginUserFunction', {
      runtime: lambda.Runtime.NODEJS_18_X, // Set the Lambda runtime to Node.js 18.x
      handler: 'index.handler', // The entry point for the Lambda function
      code: lambda.Code.fromAsset('lambda/user/loginUser'), // The Lambda function code location
      environment: {
        USERS_TABLE: usersTable.tableName, // Set the USERS_TABLE environment variable for database access
        AUTH_QUEUE_URL: authQueue.queueUrl, // Set the AUTH_QUEUE_URL environment variable for the SQS queue URL
      },
    });

        // 📌 Create an SQS Queue for User Deletion Processing
    const userQueue = new sqs.Queue(this, 'UserQueue', {
      queueName: 'UserQueue',
      visibilityTimeout: cdk.Duration.seconds(30), // Visibility Timeout for message processing
    });

    // 📌 Create an EventBridge Rule for User Deletion Events
    const userDeleteEventRule = new events.Rule(this, 'UserDeleteEventRule', {
      ruleName: 'UserDeleteEvent', // Name of the rule
      eventPattern: {
        source: ['aws.users'], // The source for the event
        detailType: ['UserDeleteEvent'], // The event detail type for user deletion
      },
    });

    // 📌 Add the SQS Queue as the Target for the EventBridge Rule
    userDeleteEventRule.addTarget(new targets.SqsQueue(userQueue));

    // 📌 Create the Lambda Function for Handling User Deletion
    const deleteUserLambda = new lambda.Function(this, 'DeleteUserFunction', {
      runtime: lambda.Runtime.NODEJS_18_X, // Set the Lambda runtime to Node.js 18.x
      handler: 'index.handler', // The entry point for the Lambda function
      code: lambda.Code.fromAsset('lambda/user/deleteUser'), // The Lambda function code location
      environment: {
        USERS_TABLE: usersTable.tableName, // Set the USERS_TABLE environment variable for database access
        USER_QUEUE_URL: userQueue.queueUrl, // Set the USER_QUEUE_URL environment variable for the SQS queue URL
      },
    });

    // 📌 Create an EventBridge Rule for User Registration Events
    const userCreateEventRule = new events.Rule(this, 'UserCreateEventRule', {
      ruleName: 'UserCreateEvent',
      eventPattern: {
        source: ['aws.users'],
        detailType: ['UserCreateEvent'],
      },
    });

    // 📌 Add the SQS Queue as the Target for the EventBridge Rule
    userCreateEventRule.addTarget(new targets.SqsQueue(userQueue));

    // 📌 Create the Lambda Function for Handling User Registration
    const registerUserLambda = new lambda.Function(this, 'RegisterUserFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/user/registerUser'),
      environment: {
        USERS_TABLE: usersTable.tableName,
        USER_QUEUE_URL: userQueue.queueUrl,
      },
    });

    // 📌 Grant permissions
    categoriesTable.grantReadWriteData(createCategoryLambda);
    categoriesTable.grantReadWriteData(updateCategoryLambda);
    categoryQueue.grantSendMessages(updateCategoryLambda);
    updateCategoryLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['events:PutEvents'],
      resources: ['*'],
    }));
    // 📌 Grant permissions
    categoriesTable.grantReadWriteData(deleteCategoryLambda);
    deleteCategoryQueue.grantSendMessages(deleteCategoryLambda);
    deleteCategoryLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['events:PutEvents'],
      resources: ['*'],
    }));

    categoriesTable.grantReadData(getCategoryLambda);

    sectionsTable.grantReadWriteData(assignSubcategoryLambda);
    assignQueue.grantSendMessages(assignSubcategoryLambda);
    assignSubcategoryLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['events:PutEvents'],
      resources: ['*'],
    }));
    
    cardSchemasTable.grantReadWriteData(importCardSchemaLambda);
    schemaImportQueue.grantSendMessages(importCardSchemaLambda);
    importCardSchemaLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['events:PutEvents'],
      resources: ['*'],
    }));

    // Grant necessary permissions to the Lambda function
    listingsTable.grantReadWriteData(verifyListingLambda);
    verifyQueue.grantSendMessages(verifyListingLambda);
    verifyListingLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['events:PutEvents'], // Grant permission to publish events to EventBridge
      resources: ['*'], // You can limit to a specific EventBridge bus or pattern if needed
    }));

    // Grant necessary permissions
    messagesTable.grantReadData(getPendingMessagesLambda);
    reviewQueue.grantSendMessages(getPendingMessagesLambda);

    // Grant permissions for the Lambda to write to DynamoDB
    messagesTable.grantWriteData(postMessageLambda);

    messagesTable.grantReadWriteData(replyToMessageLambda);
    replyQueue.grantSendMessages(replyToMessageLambda);
    replyToMessageLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['events:PutEvents'],
      resources: ['*'],
    }));

    // Grant permissions
    messagesTable.grantReadWriteData(filterContactInfoLambda);
    filterQueue.grantSendMessages(filterContactInfoLambda);
    filterContactInfoLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['events:PutEvents'],
      resources: ['*'],
    }));

    // 📌 Grant Permissions
    bidsTable.grantReadWriteData(placeBidLambda);
    bidQueue.grantSendMessages(placeBidLambda);
    placeBidLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['events:PutEvents'],
      resources: ['*'],
    }));

    // 📌 Grant Permissions
    usersTable.grantReadWriteData(upgradeMembershipLambda);
    membershipQueue.grantSendMessages(upgradeMembershipLambda);
    upgradeMembershipLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['events:PutEvents'],
      resources: ['*'],
    }));

    // 📌 Grant Permissions for LoginUser Lambda
    usersTable.grantReadWriteData(loginUserLambda); // Grant read/write access to the USERS_TABLE (DynamoDB)
    authQueue.grantSendMessages(loginUserLambda); // Grant permission to send messages to the AuthQueue (SQS)

    loginUserLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['events:PutEvents'], // Permission to put events in EventBridge
      resources: ['*'], // Allows the Lambda to put events to any EventBridge event bus
    }));

    // ✅ Grant Query Access to EmailIndex
    loginUserLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:Query'],
      resources: [
        usersTable.tableArn, // Main Users table
        `${usersTable.tableArn}/index/EmailIndex`, // EmailIndex GSI
      ],
    }));

    // 📌 Grant Permissions for DeleteUser Lambda
    usersTable.grantReadWriteData(deleteUserLambda); // Grant read/write access to the USERS_TABLE (DynamoDB)
    userQueue.grantSendMessages(deleteUserLambda); // Grant permission to send messages to the UserQueue (SQS)

    deleteUserLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['events:PutEvents'], // Permission to put events in EventBridge
      resources: ['*'], // Allows the Lambda to put events to any EventBridge event bus
    }));

    // 📌 Grant Permissions for RegisterUser Lambda
    usersTable.grantReadWriteData(registerUserLambda); // Read/write access to DynamoDB Users table
    userQueue.grantSendMessages(registerUserLambda); // Permission to send messages to SQS

    registerUserLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['events:PutEvents'], // Allow putting events in EventBridge
      resources: ['*'],
    }));

    // Define the ARNs for encryption and decryption Lambdas
    const encryptionLambdaArn = `arn:aws:lambda:${this.region}:${this.account}:function:aes-encryption`;
    const decryptionLambdaArn = `arn:aws:lambda:${this.region}:${this.account}:function:aes-decryption`;

    // 📌 List of Lambda functions for POST and GET methods
    const postMethods = [
      createCategoryLambda,
      updateCategoryLambda,
      deleteCategoryLambda,
      assignSubcategoryLambda,
      importCardSchemaLambda,
      verifyListingLambda,
      postMessageLambda,
      replyToMessageLambda,
      filterContactInfoLambda,
      placeBidLambda,
      upgradeMembershipLambda,
      loginUserLambda,
      registerUserLambda,
    ];

    const getMethods = [
      getCategoryLambda,
      getPendingMessagesLambda,
    ];

    // 📌 Grant permission to invoke the decryption Lambda for GET methods
    getMethods.forEach((lambda) => {
      lambda.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["lambda:InvokeFunction"],
          resources: [decryptionLambdaArn],
        })
      );
    });

    // 📌 Grant permission to invoke both encryption and decryption Lambdas for POST methods
    postMethods.forEach((lambda) => {
      lambda.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["lambda:InvokeFunction"],
          resources: [encryptionLambdaArn, decryptionLambdaArn],
        })
      );
    });


    // 📌 API Gateway Setup
    const api = new apigateway.RestApi(this, 'MarketplaceApi', {
      restApiName: 'Marketplace Service',
    });

    // 📌 Admin Routes
    const adminResource = api.root.addResource('admin');

    // 📌 Categories Routes
    const categoriesResource = adminResource.addResource('categories');
    categoriesResource.addMethod('POST', new apigateway.LambdaIntegration(createCategoryLambda));

    // 📌 Categories API Route
    const categoryResource = categoriesResource.addResource('{id}');
    categoryResource.addMethod('PUT', new apigateway.LambdaIntegration(updateCategoryLambda));
    categoryResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteCategoryLambda));

    categoriesResource.addMethod('GET', new apigateway.LambdaIntegration(getCategoryLambda));

    // 📌 Sections Routes
    const sectionsResource = adminResource.addResource('sections').addResource('assign');
    sectionsResource.addMethod('POST', new apigateway.LambdaIntegration(assignSubcategoryLambda));

    // 📌 CardSchemas Routes
    const cardSchemasResource = adminResource.addResource('cardschemas').addResource('csv');
    cardSchemasResource.addMethod('POST', new apigateway.LambdaIntegration(importCardSchemaLambda));

    // 📌 Listings Verification Endpoint
    const listingsResource = adminResource.addResource('listings').addResource('verify');
    listingsResource.addMethod('POST', new apigateway.LambdaIntegration(verifyListingLambda));

    // 📌 Messages Routes
    // Admin messages endpoint for getting pending messages
    const pendingMessagesResource = adminResource.addResource('messages').addResource('pending');
    pendingMessagesResource.addMethod('GET', new apigateway.LambdaIntegration(getPendingMessagesLambda));

    // 📌 Public API for posting new messages (creates `/messages`)
  const postMessagesResource = api.root.addResource('messages');
  postMessagesResource.addMethod('POST', new apigateway.LambdaIntegration(postMessageLambda));

  // 📌 Reference the existing `/messages` resource to avoid duplication
  const existingMessagesResource = api.root.getResource('messages');

  if (!existingMessagesResource) {
      throw new Error("Messages resource not found. Ensure 'messages' is added before referencing it.");
  }

  // 📌 Add reply endpoint under `/messages/{id}/reply`
  const messagesResource = existingMessagesResource.addResource('{id}').addResource('reply');
  messagesResource.addMethod('POST', new apigateway.LambdaIntegration(replyToMessageLambda));

  // 📌 Ensure 'messages' resource exists under 'admin'
  let adminMessagesResource = adminResource.getResource('messages');
  if (!adminMessagesResource) {
      adminMessagesResource = adminResource.addResource('messages');
  }

  // 📌 Ensure 'contact-filter' exists under 'admin/messages'
  let contactFilterResource = adminMessagesResource.getResource('contact-filter');
  if (!contactFilterResource) {
      contactFilterResource = adminMessagesResource.addResource('contact-filter');
  }

  // 📌 Add POST method for filtering contact info
  contactFilterResource.addMethod('POST', new apigateway.LambdaIntegration(filterContactInfoLambda));

  const auctionsResource = api.root.addResource('auctions');
  const auctionItem = auctionsResource.addResource('{id}').addResource('bid');
  auctionItem.addMethod('POST', new apigateway.LambdaIntegration(placeBidLambda));

  // 📌 Create Membership Upgrade Resource (POST /membership/upgrade)
  const membershipResource = api.root.addResource("membership").addResource("upgrade");
  membershipResource.addMethod("POST", new apigateway.LambdaIntegration(upgradeMembershipLambda));

  // Create a `/users` resource and the `DELETE /users/{id}` endpoint
  const users = api.root.addResource('users');
  users.addResource('{id}').addMethod('DELETE', new apigateway.LambdaIntegration(deleteUserLambda), {
    requestParameters: { 'method.request.path.id': true },
  });

  // Create an `/auth` resource and the `POST /auth/login` endpoint
  const auth = api.root.addResource('auth');
  auth.addResource('login').addMethod('POST', new apigateway.LambdaIntegration(loginUserLambda));
  
  // Add `/auth/register` endpoint
  auth.addResource('register').addMethod('POST', new apigateway.LambdaIntegration(registerUserLambda));
  }
}

module.exports = { AwsMarketplaceApiStack };
