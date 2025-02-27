import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import crypto from "crypto";

// Ensure environment variables are available
const poolData = {
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

const generateSecretHash = (username) => {
  const clientSecret = process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error("🚨 Cognito client secret is missing!");
  }

  const message = username + poolData.ClientId;
  const hmac = crypto.createHmac("sha256", clientSecret);
  hmac.update(message);

  return Buffer.from(hmac.digest()).toString("base64");
};

// ✅ Function to sign out user
export const signOut = () => {
  const user = userPool.getCurrentUser();
  if (user) {
    user.signOut();
    console.log("✅ User signed out successfully");
  } else {
    console.log("⚠️ No user session found.");
  }
};

// ✅ Check if user is authenticated
export const isAuthenticated = () => {
  const currentUser = userPool.getCurrentUser();
  return !!currentUser; // Returns true if a user exists, otherwise false
};

export const signIn = async (email, password, newPassword = null) => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
      SecretHash: generateSecretHash(email),
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => {
        console.log("✅ Login successful", session);
        resolve({ session });
      },
      onFailure: (err) => {
        console.error("❌ Login failed", err);
        reject(err);
      },
      newPasswordRequired: (userAttributes) => {
        console.warn("⚠️ New password required", userAttributes);

        if (!newPassword) {
          reject({ message: "NEW_PASSWORD_REQUIRED", userAttributes });
          return;
        }

        // ✅ Remove immutable attributes to prevent modification error
        delete userAttributes.email;
        delete userAttributes.email_verified;

        cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
          onSuccess: (session) => {
            console.log("✅ New password set successfully", session);
            resolve({ session });
          },
          onFailure: (err) => {
            console.error("❌ Failed to set new password", err);
            reject(err);
          },
        });
      },
    });
  });
};

// ✅ Export the Cognito user pool
export const getUserPool = () => userPool;