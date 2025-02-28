const uri =
  process.env.ENV == "Dev"
    ? process.env.NEXT_PUBLIC_COGNITO_LOCAL_URL
    : process.env.NEXT_PUBLIC_COGNITO_PROD_URL;

export const oidcConfigSignInConfig = {
  authority: process.env.NEXT_PUBLIC_COGNITO_AUTHORITY,
  client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  redirect_uri: `${uri}/callback`,
  response_type: "code",
  scope: "aws.cognito.signin.user.admin email openid phone profile",

  metadata: {
    issuer: process.env.NEXT_PUBLIC_COGNITO_AUTHORITY,
    authorization_endpoint: `${process.env.NEXT_PUBLIC_COGNITO_AUTHORITY}/oauth2/authorize`,
    token_endpoint: `${process.env.NEXT_PUBLIC_COGNITO_AUTHORITY}/oauth2/token`,
    userinfo_endpoint: `${process.env.NEXT_PUBLIC_COGNITO_AUTHORITY}/oauth2/userInfo`,
    end_session_endpoint: `${process.env.NEXT_PUBLIC_COGNITO_AUTHORITY}/logout`,
  },
  
};
