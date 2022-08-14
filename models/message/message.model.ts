import { firestore } from 'firebase-admin';
import CustomServerError from '@/controllers/error/custom_serverError';
import FirebaseAdmin from '../firebase_admin';
import { InMessage, InMessageServer } from './in_message';
import { InAuthUser } from '../in_auth_user';

const MEMBER_COL = 'members';
const MSG_COL = 'messages';

const { Firestore } = FirebaseAdmin.getInstance();

async function post({
  uid,
  message,
  author,
}: {
  uid: string;
  message: string;
  author?: {
    displayName: string;
    phtoURL?: string;
  };
}) {
  const memberRef = Firestore.collection(MEMBER_COL).doc(uid);
  await Firestore.runTransaction(async (transaction) => {
    let messageCount = 1;
    const memberDoc = await transaction.get(memberRef);
    if (memberDoc.exists === false) {
      throw new CustomServerError({
        statusCode: 400,
        message: '존재하지 않는 사용자 입니다',
      });
    }
    const memberInfo = memberDoc.data() as InAuthUser & {
      messageCount?: number;
    };
    if (memberInfo.messageCount !== undefined) {
      messageCount = memberInfo.messageCount;
    }
    const newMessageRef = memberRef.collection(MSG_COL).doc();
    const newMessageBody: {
      message: string;
      createAt: firestore.FieldValue;
      messageNo: number;
      author?: {
        displayName: string;
        phtoURL?: string;
      };
    } = {
      message,
      messageNo: messageCount,
      createAt: firestore.FieldValue.serverTimestamp(),
    };
    if (author !== undefined) {
      newMessageBody.author = author;
    }

    await transaction.set(newMessageRef, newMessageBody);
    await transaction.update(memberRef, { messageCount: messageCount + 1 });
  });
}

async function list({ uid }: { uid: string }) {
  const memberRef = Firestore.collection(MEMBER_COL).doc(uid);
  const listData = await Firestore.runTransaction(async (transaction) => {
    const memberDoc = await transaction.get(memberRef);
    if (memberDoc.exists === false) {
      throw new CustomServerError({
        statusCode: 400,
        message: '존재하지 않는 사용자 입니다',
      });
    }
    const messageCol = memberRef
      .collection(MSG_COL)
      .orderBy('createAt', 'desc');
    const messageColDoc = await transaction.get(messageCol);
    const data = messageColDoc.docs.map((mg) => {
      const docData = mg.data() as Omit<InMessageServer, 'id'>;
      const returnData = {
        ...docData,
        id: mg.id,
        createAt: docData.createAt.toDate().toISOString(),
        replyAt: docData.replyAt
          ? docData.replyAt.toDate().toISOString()
          : undefined,
      } as InMessage;
      return returnData;
    });
    return data;
  });
  return listData;
}

async function listWithPage({
  uid,
  page = 1,
  size = 10,
}: {
  uid: string;
  page?: number;
  size?: number;
}) {
  const memberRef = Firestore.collection(MEMBER_COL).doc(uid);
  const listData = await Firestore.runTransaction(async (transaction) => {
    const memberDoc = await transaction.get(memberRef);
    if (memberDoc.exists === false) {
      throw new CustomServerError({
        statusCode: 400,
        message: '존재하지 않는 사용자 입니다',
      });
    }
    const memberInfo = memberDoc.data() as InAuthUser & {
      messageCount?: number;
    };
    const { messageCount = 0 } = memberInfo;
    const totalElement = messageCount !== 0 ? messageCount - 1 : 0;
    const remains = totalElement % size;
    const totalPages = (totalElement - remains) / size + (remains > 0 ? 1 : 0);
    const startAt = totalElement - (page - 1) * size;
    if (startAt < 0) {
      return {
        totalElement,
        totalPages: 0,
        page,
        size,
        content: [],
      };
    }
    const messageCol = memberRef
      .collection(MSG_COL)
      .orderBy('messageNo', 'desc')
      .startAt(startAt)
      .limit(size);

    const messageColDoc = await transaction.get(messageCol);
    const data = messageColDoc.docs.map((mg) => {
      const docData = mg.data() as Omit<InMessageServer, 'id'>;
      const isDeny = docData.deny !== undefined && docData.deny === true;
      const returnData = {
        ...docData,
        message: isDeny ? '비공개 처리된 메시지 입니다' : docData.message,
        id: mg.id,
        createAt: docData.createAt.toDate().toISOString(),
        replyAt: docData.replyAt
          ? docData.replyAt.toDate().toISOString()
          : undefined,
      } as InMessage;
      return returnData;
    });
    return {
      totalElement,
      totalPages,
      page,
      size,
      content: data,
    };
  });
  return listData;
}

async function postReply({
  uid,
  messageId,
  reply,
}: {
  uid: string;
  messageId: string;
  reply: string;
}) {
  const memberRef = Firestore.collection(MEMBER_COL).doc(uid);
  const messageRef = memberRef.collection(MSG_COL).doc(messageId);
  await Firestore.runTransaction(async (transaction) => {
    const memberDoc = await transaction.get(memberRef);
    const messageDoc = await transaction.get(messageRef);
    if (memberDoc.exists === false) {
      throw new CustomServerError({
        statusCode: 400,
        message: '존재하지 않는 사용자 입니다',
      });
    }
    if (messageDoc.exists === false) {
      throw new CustomServerError({
        statusCode: 400,
        message: '존재하지 않는 문서 입니다',
      });
    }
    const messaeData = messageDoc.data() as InMessageServer;
    if (messaeData.reply !== undefined) {
      throw new CustomServerError({
        statusCode: 400,
        message: '이미 댓글을 입력했습니다',
      });
    }
    await transaction.update(messageRef, {
      reply,
      replyAt: firestore.FieldValue.serverTimestamp(),
    });
    console.log('입력완료');
  });
}

async function get({ uid, messageId }: { uid: string; messageId: string }) {
  const memberRef = Firestore.collection(MEMBER_COL).doc(uid);
  const messageRef = memberRef.collection(MSG_COL).doc(messageId);
  const data = await Firestore.runTransaction(async (transaction) => {
    const memberDoc = await transaction.get(memberRef);
    const messageDoc = await transaction.get(messageRef);
    if (memberDoc.exists === false) {
      throw new CustomServerError({
        statusCode: 400,
        message: '존재하지 않는 사용자 입니다',
      });
    }
    if (messageDoc.exists === false) {
      throw new CustomServerError({
        statusCode: 400,
        message: '존재하지 않는 문서 입니다',
      });
    }
    const messageData = messageDoc.data() as InMessageServer;
    const isDeny = messageData.deny !== undefined && messageData.deny === true;
    return {
      ...messageData,
      message: isDeny ? '비공개 처리된 메시지 입니다.' : messageData.message,
      id: messageId,
      createAt: messageData.createAt.toDate().toISOString(),
      replyAt: messageData.replyAt
        ? messageData.createAt.toDate().toISOString()
        : undefined,
    };
  });
  return data;
}

async function updateMessage({
  uid,
  messageId,
  deny,
}: {
  uid: string;
  messageId: string;
  deny: boolean;
}) {
  const memberRef = Firestore.collection(MEMBER_COL).doc(uid);
  const messageRef = memberRef.collection(MSG_COL).doc(messageId);
  const result = await Firestore.runTransaction(async (transaction) => {
    const memberDoc = await transaction.get(memberRef);
    const messageDoc = await transaction.get(messageRef);
    if (memberDoc.exists === false) {
      throw new CustomServerError({
        statusCode: 400,
        message: '존재하지 않는 사용자 입니다',
      });
    }
    if (messageDoc.exists === false) {
      throw new CustomServerError({
        statusCode: 400,
        message: '존재하지 않는 문서 입니다',
      });
    }
    await transaction.update(messageRef, { deny });
    const messaeData = messageDoc.data() as InMessageServer;

    return {
      ...messaeData,
      id: messageId,
      deny,
      createAt: messaeData.createAt.toDate().toISOString(),
      replyAt: messaeData.replyAt
        ? messaeData.createAt.toDate().toISOString()
        : undefined,
    };
  });
  return result;
}

const MessageModel = {
  post,
  list,
  postReply,
  get,
  listWithPage,
  updateMessage,
};

export default MessageModel;
