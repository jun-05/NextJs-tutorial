import { NextApiRequest, NextApiResponse } from 'next';
import BadReqError from './error/bad_req_error';
import MessageModel from '../models/message/message.model';
import FirebaseAdmin from '../models/firebase_admin';
import CustomServerError from './error/custom_serverError';

async function post(req: NextApiRequest, res: NextApiResponse) {
  const { uid, message, author } = req.body;
  if (uid === undefined) {
    throw new BadReqError('uid가 누락되었습니다 ');
  }

  if (message === undefined) {
    throw new BadReqError('msg가 누락되었습니다');
  }

  await MessageModel.post({
    uid,
    message,
    author,
  });
  return res.status(201).end();
}

// 페이지 없는 전체 값이 들어오는 코드
// async function list(req: NextApiRequest, res: NextApiResponse) {
//   const { uid } = req.query;
//   if (uid === undefined) {
//     throw new BadReqError('uid가 누락되었습니다 ');
//   }

//   const uidToStr = Array.isArray(uid) ? uid[0] : uid;
//   const listResp = await MessageModel.list({ uid: uidToStr });

//   return res.status(200).json(listResp);
// }

async function list(req: NextApiRequest, res: NextApiResponse) {
  const { uid, size = '10', page = '1' } = req.query;
  if (uid === undefined) {
    throw new BadReqError('uid가 누락되었습니다 ');
  }

  const uidToStr = Array.isArray(uid) ? uid[0] : uid;
  const sizeToStr = Array.isArray(size) ? size[0] : size;
  const pageToStr = Array.isArray(page) ? page[0] : page;

  const listResp = await MessageModel.listWithPage({
    uid: uidToStr,
    page: parseInt(pageToStr, 10),
    size: parseInt(sizeToStr, 10),
  });
  console.log(listResp);

  return res.status(200).json(listResp);
}

async function postReply(req: NextApiRequest, res: NextApiResponse) {
  const { uid, messageId, reply } = req.body;
  if (uid === undefined) {
    throw new BadReqError('uid가 누락되었습니다 ');
  }

  if (uid === undefined) {
    throw new BadReqError('messageId가 누락되었습니다 ');
  }

  if (uid === undefined) {
    throw new BadReqError('reply가 누락되었습니다 ');
  }

  await MessageModel.postReply({ uid, messageId, reply });
  return res.status(201).end();
}

async function get(req: NextApiRequest, res: NextApiResponse) {
  const { uid, messageId } = req.query;
  if (uid === undefined) {
    throw new BadReqError('uid가 누락되었습니다 ');
  }

  if (messageId === undefined) {
    throw new BadReqError('messageId가 누락되었습니다 ');
  }
  const uidToStr = Array.isArray(uid) ? uid[0] : uid;
  const messageIdToStr = Array.isArray(messageId) ? messageId[0] : messageId;

  const data = await MessageModel.get({
    uid: uidToStr,
    messageId: messageIdToStr,
  });
  return res.status(200).json(data);
}

async function updateMessage(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization;
  if (token === undefined) {
    throw new CustomServerError({
      statusCode: 401,
      message: '권한이 없습니다.',
    });
  }
  let tokenUid: null | string = null;
  try {
    const decode = await FirebaseAdmin.getInstance().Auth.verifyIdToken(token);
    tokenUid = decode.uid;
  } catch (err) {
    throw new BadReqError('token에 문제가 있습니다.');
  }
  //post의 경우에는 따로 형변환 필요 없으
  const { uid, messageId, deny } = req.body;
  if (uid === undefined) {
    throw new BadReqError('uid가 누락되었습니다 ');
  }

  if (uid !== tokenUid) {
    throw new CustomServerError({
      statusCode: 401,
      message: 't수정 권한이 없습니다.',
    });
  }

  if (messageId === undefined) {
    throw new BadReqError('messageId가 누락되었습니다 ');
  }

  if (deny === undefined) {
    throw new BadReqError('deny 누락되었습니다 ');
  }

  const result = await MessageModel.updateMessage({
    uid,
    messageId,
    deny,
  });
  return res.status(200).json(result);
}

const MessageCtrl = {
  post,
  list,
  postReply,
  get,
  updateMessage,
};

export default MessageCtrl;
