import { firestore } from 'firebase-admin';

export interface MessageBase {
  id: string;
  message: string;
  reply?: string;
  /** 메시지를 작성한 사람의 정보 */
  author?: {
    displayName: string;
    photoURL?: string;
  };
  deny?: boolean;
}
export interface InMessage extends MessageBase {
  createAt: string;
  replyAt?: string;
}

export interface InMessageServer extends MessageBase {
  createAt: firestore.Timestamp;
  replyAt?: firestore.Timestamp;
}

export interface InMessageList {
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  content: InMessage[];
}
