const crypto = require('crypto');
const fs = require('fs');

const changedDataRaw = fs.readFileSync(0, 'utf-8');
const changedData = JSON.parse(changedDataRaw);

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/smart-school-management-66f78/databases/(default)/documents/database';

async function getAccessToken() {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountStr) return null;
  
  try {
    const serviceAccount = JSON.parse(serviceAccountStr);
    const header = JSON.stringify({ alg: 'RS256', typ: 'JWT' });
    const headerBase64 = Buffer.from(header).toString('base64url');
    
    const now = Math.floor(Date.now() / 1000);
    const claim = JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    });
    const claimBase64 = Buffer.from(claim).toString('base64url');
    
    const jwtInput = `${headerBase64}.${claimBase64}`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(jwtInput);
    
    const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
    const signature = sign.sign(privateKey, 'base64url');
    const assertion = `${jwtInput}.${signature}`;
    
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`
    });
    const json = await res.json();
    return json.access_token;
  } catch (err) {
    console.error('Failed to authenticate service account:', err);
    return null;
  }
}

async function run() {
  const token = await getAccessToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const promises = Object.keys(changedData).map(async key => {
    const body = {
      fields: {
        data: {
          stringValue: JSON.stringify(changedData[key])
        }
      }
    };
    const url = `${FIRESTORE_BASE}/${key}?updateMask.fieldPaths=data`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body)
    });
    return res.status;
  });
  
  await Promise.all(promises);
  console.log('Sync complete');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
