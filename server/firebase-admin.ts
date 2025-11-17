import admin from "firebase-admin";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  if (!admin.apps.length) {
    // Initialize Firebase Admin with environment variables or hardcoded fallback
    // SECURITY WARNING: Hardcoded credentials should only be used for development
    // In production, always use environment variables from Replit Secrets
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "story-7af93";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-ievhx@story-7af93.iam.gserviceaccount.com";
    const privateKey = process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDdancO0NHl4VVF\n+fYlV7j5LdKA+52euQCfEmQ/RX4cPPGLOQm3vSGgaST2p9GvB17vbDxeY59NpKdY\nWd5SFQwHtuN3kFcER26Rt/2ympy1HurAuE6cOuN/Ix2XGfn0w9NFxAUeUnvljVYE\nF05S06VA6z9vFSoXGhqI/ynGX7m5i/s8L2+zZ0+XpJ0DujW1WCJcVK24l4XJmYtx\nCqFhg2oMFil1QM4PuIEkavQ+t5tkVs8zMhXH7WLBjdaljFPCsuy83rZhS7ogrTy4\neF7E1JKYiqx/1H069hgz1ow/Rs1aEij3+H16QV4jw7QcfMW1IdiXNSruN2LoGXZP\nkV0mIPjfAgMBAAECggEABomRMFfMCryHdwR1Vw7rADhxIavMMJaHxSqW2SNlINJP\n02uAtPMZnhHcrIex8jgGfo00jxjj6Df3VO16WfQTIdsthic12oN9aUIEdJSKEfLy\nvXPzpjs64lMYGZEDx01M3J94AzguPk3Y/0/s2Rc0puELQ21di8cSh375Lck/w5Gn\naqc3f2yivLryujfnYtd+9Tun9o2hSflUdBMl9qPO2E5mnZtZDrhMMgyCooyqxYps\n4Phx/j7uoPW1OlNLyqvXmiGBMK+x6te5roNrl2i/bxp/ROODdyggp0lHQzfyKcix\nEREUsZ9VMprHmkyRcMGEqT1Wqn9VVusTe/ldpv+RAQKBgQD6YKhB0kS/uNqlR393\nfcE3FDq3Vl3xj7ZDeRWXmeGnVJM09mz7dHNIN1kBtkx7Bw6QdBgmqtJTGxMZyrap\nRCLJOQiH/+9/Gj2OmJecWBIl/bY9me4TPv3U1aaNEpSsW94AYZXHs3dMh5fdCo5G\ngHLDqexx3+pr50CqobBmkDjogQKBgQDiY1Dqlhp4Z6Dk7Tqpvo0F6OWLuO9hNfgg\nwRsAz7t+sxz2WLrcyN3oT0aDIOuMB2TELz+k7zUkCeyfetkXHeZ+inAA2Axfu7vy\nn8xfFx3dNiioqXfDuiNrAMr6vjKseP9CJzv6WNg/qJxEeLS3Y+uertaxZ3iDVw0i\nEHY/K4IxXwKBgDvzINaBzkxJqrCgafjmd3kEsvprB5trWazWNUFTayBxs72es4GR\n5HiKKBms2KssiWQ1KAM6K5oShYRLcWkeE2Yy7cQCmAnK8qpOBx88Rzwpf5VIYiTh\nlE19yp9Er6yFYqactwxWAF6mqMoYWPCwmMoYybCKeMrVWDqC9IXaSoYBAoGARDIi\nx+fbpXWiFBQaXdPW63bS3xogkioNyuAg4EezdWFDUjo8YBHqNvbaiNm72vzHMAoD\npA2i9m4+53O8Pah2LJxLTRXH9Ha7EUVt7R8rkd2ktdoHB+DklnEwtAPjg+0XB7iF\n6s4kpliGamHqHmxtJ+oHJn3C4d2xSReoZzMWDwUCgYEAuP0nUzlc1oVMyV8ynG89\n6OngP1v+QCc9KENuJt/hYj9iPTlU+rolxsMSCW44nsgCzsUIel/Wua7WZAH7yvek\nSk9M3eIdW3bX3Q25G3DT08TcUeKEWeSAbC6UtXR1DtDUVnfUxN/tllzosjTysQQe\nNjhSX6fxPTqmDW+Os+9/Xqc=\n-----END PRIVATE KEY-----\n";

    // Use service account credentials
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Replace escaped newlines with actual newlines
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log("✓ Firebase Admin initialized with service account credentials");
  }
  
  if (admin.apps.length > 0) {
    db = admin.firestore();
    auth = admin.auth();
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  console.log("⚠ Continuing without Firebase Admin - authentication will not work");
}

export { db, auth };
