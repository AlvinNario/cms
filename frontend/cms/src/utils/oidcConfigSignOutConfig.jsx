const uri =
  process.env.ENV == "Dev"
    ? process.env.NEXT_PUBLIC_COGNITO_LOCAL_URL
    : process.env.NEXT_PUBLIC_COGNITO_PROD_URL;

const oidcConfigSignOutConfig = () => {
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const logoutUri = `${uri}`;
  const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN_URL;
  window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  sessionStorage.clear();
};

export default oidcConfigSignOutConfig;
