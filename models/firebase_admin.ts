import * as admin from 'firebase-admin';

interface Config {
  credential: {
    privateKey: string;
    clientEmail: string;
    projectId: string;
  };
}

export default class FirebaseAdmin {
  public static instance: FirebaseAdmin;

  private init = false;

  public static getInstance(): FirebaseAdmin {
    if (!FirebaseAdmin.instance) {
      FirebaseAdmin.instance = new FirebaseAdmin();
      FirebaseAdmin.instance.bootstrap();
    }
    return FirebaseAdmin.instance;
  }

  /** firestore */
  public get Firestore(): FirebaseFirestore.Firestore {
    if (this.init === false) {
      this.bootstrap();
    }
    return admin.firestore();
  }

  public get Auth(): admin.auth.Auth {
    if (this.init === false) {
      this.bootstrap();
    }
    return admin.auth();
  }

  private bootstrap(): void {
    const haveApp = admin.apps.length !== 0;
    if (haveApp) {
      this.init = true;
      return;
    }
    const config: Config = {
      credential: {
        privateKey: (process.env.privateKey || '').replace(/\\n/g, '\n'),
        clientEmail: process.env.clientEmail || '',
        projectId: process.env.projectId || '',
      },
    };

    admin.initializeApp({
      credential: admin.credential.cert(config.credential),
    });
    console.info('bootstrap firebase admin');
    console.log('bootstrap firebase admin');
  }
}
