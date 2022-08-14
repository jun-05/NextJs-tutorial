import { GetServerSideProps, NextPage } from 'next';
import { Avatar, Box, Flex, Text, Button } from '@chakra-ui/react';
import { useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import Link from 'next/link';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import Head from 'next/head';
import { useAuth } from '@/contexts/auth_user.context';
import { InAuthUser } from '@/models/in_auth_user';
import { ServiceLayout } from '@/components/service_layout';
import MessageItem from '@/components/message_Item';
import { InMessage } from '@/models/message/in_message';

/**
 * 각 사용자의 home
 * 프로필 이미지, 닉네임, id가 출력
 * 질문을 작성할 수 있는 text area
 *
 * 기존에 대답한 내용이 아래쪽에 보여짐
 * 각 질문에서 답변 보기를 클릭하면 상세 화면으로 진입
 */

interface Props {
  userInfo: InAuthUser | null;
  messageData: InMessage | null;
  screenName: string;
  baseUrl: string;
}

const MessagePage: NextPage<Props> = function ({
  userInfo,
  messageData: initMsgData,
  screenName,
  baseUrl,
}) {
  const { authUser } = useAuth();
  const [messageData, setMessageData] = useState<null | InMessage>(initMsgData);

  async function fetchMessageInfo({
    uid,
    messageId,
  }: {
    uid: string;
    messageId: string;
  }) {
    try {
      const resp = await fetch(
        `/api/messages.info?uid=${uid}&messageId=${messageId}`,
      );
      if (resp.status === 200) {
        const data: InMessage = await resp.json();
        setMessageData(data);
      }
    } catch (err) {
      console.log(err);
    }
  }

  if (userInfo === null) {
    return <p>사용자를 찾을 수 없습니다.</p>;
  }
  if (messageData === null) {
    return <p> 메시지 정보가 없습니다.</p>;
  }
  const isOwner = authUser !== null && authUser.uid === userInfo.uid;
  const metaTagUrl = `${baseUrl}/open_graph_img?text=${encodeURIComponent(
    messageData.message,
  )}`;
  const thumbnailImgUrl = `${baseUrl}/api/thumbnail?url=${encodeURIComponent(
    metaTagUrl,
  )}`;
  console.log(metaTagUrl);
  console.log(thumbnailImgUrl);
  return (
    <>
      <Head>
        <meta property="og:image" content={thumbnailImgUrl} />
        <meta property="og:site_name" content="blahX2" />
        <meta
          property="og:title"
          content={`${userInfo.displayName} 님에게 질문하기`}
        />
        <meta
          property="og:description"
          content={`${userInfo.displayName}님과 익명으로 대화를 나눠보세요`}
        />
        <meta
          name="twitter:title"
          content={`${userInfo.displayName} 님에게 질문하기`}
        />
        <meta
          name="twitter:description"
          content={`${userInfo.displayName}님과 익명으로 대화를 나눠보세요`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={thumbnailImgUrl} />
      </Head>
      <ServiceLayout backgroundColor="gray.200" minHeight="100vh">
        <Box maxW="md" mx="auto" pt="6">
          <Link href={`/${screenName}`}>
            <a>
              <Button leftIcon={<ChevronLeftIcon />} mb="2" fontSize="sm">
                {screenName} 홈으로
              </Button>
            </a>
          </Link>
          <Box
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            mb="2"
            bg="white"
          >
            <Box display="flex" p="6">
              <Avatar
                size="lg"
                src={userInfo.photoURL?.replace('_normal', '')}
                mr="2"
              />
              <Flex direction="column" justify="center">
                <Text fontSize="md">{userInfo.displayName}</Text>
                <Text fontSize="xs">@{userInfo.screenName}</Text>
              </Flex>
            </Box>
            <MessageItem
              key={`message-item-${messageData.id}`}
              uid={userInfo.uid}
              displayName={userInfo.displayName ?? ''}
              isOwner={isOwner}
              photoURL={userInfo.photoURL ?? 'https://bit.ly/broken-link'}
              item={messageData}
              onSendComplete={() => {
                fetchMessageInfo({
                  uid: userInfo.uid,
                  messageId: messageData.id,
                });
              }}
              screenName={screenName}
            />
          </Box>
        </Box>
      </ServiceLayout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({
  query,
}) => {
  const { screenName, messageId } = query;
  //const screenName = getStringValueFromQuery({ query, field: 'screenName' });
  if (screenName === undefined) {
    return {
      props: {
        userInfo: null,
        messageData: null,
        screenName: '',
        baseUrl: '',
      },
    };
  }
  if (messageId === undefined) {
    return {
      props: {
        userInfo: null,
        messageData: null,
        screenName: '',
        baseUrl: '',
      },
    };
  }

  try {
    const protocol = process.env.PROTOCOL || 'http';
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || '3000';
    const baseUrl = `${protocol}://${host}:${port}`;
    const userInfoResp: AxiosResponse<InAuthUser> = await axios(
      `${baseUrl}/api/user.info/${screenName}`,
    );
    const screenNameToStr = Array.isArray(screenName)
      ? screenName[0]
      : screenName;
    if (
      userInfoResp.status !== 200 ||
      userInfoResp.data === undefined ||
      userInfoResp.data.uid === undefined
    ) {
      return {
        props: {
          userInfo: null,
          messageData: null,
          screenName: screenNameToStr,
          baseUrl,
        },
      };
    }

    const messageDataResp: AxiosResponse<InMessage> = await axios(
      `${baseUrl}/api/messages.info?uid=${userInfoResp.data.uid}&messageId=${messageId}`,
    );

    return {
      props: {
        userInfo: userInfoResp.data ?? null,
        messageData:
          messageDataResp.status !== 200 || messageDataResp.data === undefined
            ? null
            : messageDataResp.data,
        screenName: screenNameToStr,
        baseUrl,
      },
    };
  } catch (err) {
    console.log(err);
    return {
      props: {
        userInfo: null,
        messageData: null,
        screenName: '',
        baseUrl: '',
      },
    };
  }
};

export default MessagePage;
