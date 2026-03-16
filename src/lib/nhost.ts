import { NhostClient } from '@nhost/nextjs';

export const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'local';
export const region = process.env.NEXT_PUBLIC_NHOST_REGION || 'eu-central-1';

const isLocal = subdomain === 'local';

export const authUrl = isLocal ? 'https://local.auth.nhost.run/v1' : `https://${subdomain}.auth.${region}.nhost.run/v1`;
export const graphqlUrl = isLocal ? 'https://local.graphql.nhost.run/v1' : `https://${subdomain}.graphql.${region}.nhost.run/v1`;
export const functionsUrl = isLocal ? 'https://local.functions.nhost.run/v1' : `https://${subdomain}.functions.${region}.nhost.run/v1`;
export const storageUrl = isLocal ? 'https://local.storage.nhost.run/v1' : `https://${subdomain}.storage.${region}.nhost.run/v1`;

export const nhost = new NhostClient({
  subdomain,
  region,
  authUrl,
  graphqlUrl,
  functionsUrl,
  storageUrl,
});

export default nhost;
