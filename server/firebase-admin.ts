import admin from "firebase-admin";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || "tellmamma";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@tellmamma.iam.gserviceaccount.com";
    const privateKey = process.env.FIREBASE_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCyQsl55UrCI3tD
7mFglLLB8Vm8ZUAHKtkFN/I6f5Q0Rv7HijgLuz2q7Li538o9MQQCN+i4cX1rMLLf
eeESdK6b2ZVfuGtMHbpof806i3JYQbnx6kPI1ziN/nCqcxHx/SHm2Bkp4TJnh9XX
gxPmAYsfa5YB91uwzzjD0nZMo354Nd9gvnmyz+EMjgPDgyL2mAOBOGPvLmv4MmYV
HRDmtLSotzuiiOm0/NG8j658VQ2EBPgXcQLdhpYYYfze9j5tXrQt14QPSYNeM90t
5yM9ZeSjV8f8EwZYrv1BaR3ePD5LLUuBpuHLSU3YGneOxCCVQKnmcHYXdMl5NE4+
0BJ/qZCbAgMBAAECggEABIw/p6R568oL8we55ETm6pvFtlC++W/WaZOr0mI+3baR
+XVFSMdWI242qEdVWYpOl9/lSA9dK8bqSVlKrLXdXoyGixKhaie4AcKA8eVs3WOP
4uQfJpiXEMhVB4Q4CPx0SPdqbO8Z4hpNElp9v3h6nCqagSJWbIRc5mIQMpRZPafX
P4cceW0KQU+jIYrlBuJX6y1ruP50+nSBkQ4sx8ccvq/43olKiYFQIMY/1p8NZFMj
3hDm2xKXn4AA6YiVejsxuX4EGHMgOr5+gdHcWCGzF6Ym8sB4wPyHrxGgcdzB8j/n
XxtdSMAwMCoPB5y24uqYIeZ1JskTColQGa0U7wwKwQKBgQDrXYNG+YHBkuYicmnh
T2fmMCRq/6JUJWPTAXgpoSuUie313+L6EGjPuCwfagCVtpRTywY7iU9KxSyasdqk
UgkFyUfsFJdtNKiTfv3DWEkV4uBDxxI2VfhOLiD1AWiSRTZ2vgnfs97LIFNgVJS9
Tt4Bp8ZC6795aJgwG+5aRruODwKBgQDB46KzQQj3Tn7HaeYHz7SVvAzKogvKhC/y
/aLI9owbjsDEJsHxqhzxxise3JrlhlDD9fH8nXyzHpiJIxRndKXq61ZkxOuNTULU
C/I61/A34pKttu3nD2DW8gJqeNCjmeQ1rl8Xgl4eOUVgdtsZ1rHOwLfRmjgYZHW+
I1Ar9C/gtQKBgQCpvLuy0LdqAWWkS/zdtyVH1Uo+O/M2WeyevH2LECdcrQgGfJq1
GmZr/vcbBJg9X/miYFUzVHfxhTcArOjv/hVxrdIHiGYYJJS6Iigh26aBeSeg2Yzh
0KgMwamU55ohenanta9rO82dkcdvPjAyQhFLAlKx6lAg33R5pXsEceRKswKBgExq
D8R//C2jtRmYpf0sIirlO1FdPjJpmJA24EI90QhHYbes4sEA33l2NaZrIW0WW5xv
wRhjZTMe+tUJi1AezAljCOCcL424Bn+V2bjRRC5yUIbAUtC+4da0+LjHtsrTqvpx
J68XRUq6HZqgHUf4sokesROdqUALz8/JER7RlVEFAoGBAKVsexyAxl1MM9N6p4yt
McWzvAd9NXcWEEVHvaEU7THb+BnLfRSWBVuBdji0Je/Ale0z99V8flA7eLZm6tNG
WjK82h6GB893CJVQhD4cEkPL4FkLXqrOZd2uSlTdJKnLaerV1oaSd7rpih9Ybcxo
rLtAVqYOmvkrVLVJbrKjHZVa
-----END PRIVATE KEY-----`;

    let formattedKey = privateKey;
    if (formattedKey.includes('\\n')) {
      formattedKey = formattedKey.replace(/\\n/g, '\n');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
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
