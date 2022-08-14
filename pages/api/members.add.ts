// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextApiRequest, NextApiResponse } from 'next';
import MemberCtrl from '../../controllers/member.ctrl';
import handleError from '../../controllers/error/handle_error';
import checkSupportMethod from '../../controllers/error/check_support_method';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { method } = req;
  const supportMethod = ['POST'];
  try {
    /**
     * 이하 부분은 check_support_mehtod로 따로 이동
     * 
     *     if (supportMethod.indexOf(method!) === -1) {
      //에러 반환
      throw new CustomServerError({
        statusCode: 400,
        message: '지원하지 않는 메서드입니다',
      });
    }
     */
    checkSupportMethod(supportMethod, method);
    await MemberCtrl.add(req, res);
  } catch (err) {
    console.error(err);
    handleError(err, res);
  }
}

/**
 * 위 부분은 ctrl 생성 이후 작성
 * 이하 부분은 member.ctrl로 이동
 * 
 *   const { uid, email, displayName, photoURL } = req.body;
  if (uid === undefined || uid === null) {
    return res
      .status(400)
      .json({ result: false, message: 'uid가 누락되었습니다.' });
  }

  if (email === undefined || email === null) {
    return res
      .status(400)
      .json({ result: false, message: 'email이 누락되었습니다.' });
  }

  const addResult = await MemberModel.add({
    uid,
    email,
    displayName,
    photoURL,
  });
  if (addResult.result === true) {
    return res.status(200).json(addResult);
  }
  res.status(500).json(addResult);
 */

/**
   * 이하 부분은 modles/member.modle.ts 로 이동
 
  try {
    const addResult =
      await FirebaseAdmin.getInstance().Firestore.runTransaction(
        async (transaction) => {
          const memberRef = FirebaseAdmin.getInstance()
            .Firestore.collection('members')
            .doc('uid');
          const screenNameRef = FirebaseAdmin.getInstance()
            .Firestore.collection('members')
            .doc('screenName');
          const memberDoc = await transaction.get(memberRef);
          if (memberDoc.exists) { 
            return false;
          }
          const addData = {
            uid,
            email: email ?? '',
            displayName: displayName ?? '',
            photoURL: photoURL ?? '',
          };
          await transaction.set(memberRef, addData);
          await transaction.set(screenNameRef, addData);
          return true;
        },
      );
    if (addResult === false) {
      return res.status(201).json({ result: true });
    }
    return res.status(200).json({ result: true, id: addResult });
  } catch (err) {
    console.log(err);
    res.status(500).json({ result: false });
  }
*/
