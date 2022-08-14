import { GetServerSideProps, NextPage } from 'next';
import {
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Switch,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { TriangleDownIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import ResizeTextarea from 'react-textarea-autosize';
import { useQuery } from 'react-query';
import { useAuth } from '@/contexts/auth_user.context';
import { InAuthUser } from '@/models/in_auth_user';
import { ServiceLayout } from '@/components/service_layout';
import MessageItem from '@/components/message_Item';
import { InMessage, InMessageList } from '@/models/message/in_message';

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
  screenName: string;
}

async function postMessage({
  message,
  uid,
  author,
}: {
  message: string;
  uid: string;
  author?: {
    displayName: string;
    photoURL?: string;
  };
}): Promise<{ result: true } | { result: false; message: string }> {
  if (message.length <= 0) {
    return {
      result: false,
      message: '메시지를 입력해주세요',
    };
  }

  try {
    await fetch('/api/messages.add', {
      method: 'post',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        message,
        author,
      }),
    });
    return {
      result: true,
    };
  } catch (err) {
    console.error(err);
    return {
      result: false,
      message: '등록 실패',
    };
  }
}

const UserHomePage: NextPage<Props> = function ({ userInfo, screenName }) {
  const toast = useToast();
  const { authUser } = useAuth();
  const [message, setMessage] = useState('');
  const [isAnonymous, setAnonymous] = useState(true);
  const [messageList, setMessageList] = useState<InMessage[]>([]);
  const [messageListFetchTrigger, setMessageListFetchTrigger] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

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
        setMessageList((prev) => {
          const findInex = prev.findIndex((fv) => fv.id === data.id);
          if (findInex > 0) {
            const updateArr = [...prev];
            updateArr[findInex] = data;
            return updateArr;
          }
          return prev;
        });
      }
    } catch (err) {
      console.log(err);
    }
  }

  const messageListQueryKey = [
    'messageList',
    userInfo?.uid,
    page,
    messageListFetchTrigger,
  ];
  useQuery(
    messageListQueryKey,
    async () =>
      //리턴 밸류 사용을 위한 설정
      // eslint-disable-next-line no-return-await
      await axios.get<InMessageList>(
        `/api/messages.list?uid=${userInfo?.uid}&page=${page}&size=5`,
      ),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data.status === 200 && data.data) {
          setTotalPage(data.data.totalPages);
          setMessageList((prev) => {
            if (page === 1 && prev.length > 0) {
              return [...data.data.content];
            }
            return [...prev, ...data.data.content];
          });
        }
      },
    },
  );

  if (userInfo === null) {
    return <p>사용자를 찾을 수 없습니다.</p>;
  }
  const isOwner = authUser !== null && authUser.uid === userInfo.uid;

  // async function sendMessage() {
  //   const postData: {
  //     message: string;
  //     uid: string;
  //     author?: {
  //       displayName: string;
  //       photoURL?: string;
  //     };
  //   } = { uid: userInfo?.uid ?? '', message };
  //   if (isAnonymous === false) {
  //     postData.author = {
  //       photoURL: authUser?.photoURL ?? 'https://bit.ly/broken-link',
  //       displayName: authUser?.displayName ?? 'anonymous',
  //     };
  //   }
  //   const resp = await postMessage(postData);
  //   if (resp.result === false) {
  //     toast({
  //       title: '메시지 등록 실패',
  //       position: 'top-right',
  //     });
  //   }
  // }

  // const queryClient = useQueryClient();

  return (
    <ServiceLayout backgroundColor="gray.200" minHeight="100vh">
      <Box maxW="md" mx="auto" pt="6">
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
        </Box>
        <Box
          borderWidth="1px"
          borderRadius="lg"
          p="2"
          overflow="hidden"
          bg="white"
        >
          <Flex>
            <Box pt="1" pr="2">
              <Avatar
                size="xs"
                src={
                  isAnonymous
                    ? 'https://bit.ly/broken-link'
                    : authUser?.photoURL ?? 'https://bit.ly/broken-link'
                }
              />
            </Box>
            <Textarea
              bg="gray.100"
              border="none"
              boxShadow="none !important"
              placeholder="무엇이 궁금한가요?"
              borderRadius="md"
              resize="none"
              minH="unset"
              minRows={1}
              maxRows={7}
              overflow="hidden"
              fontSize="xs"
              mr="2"
              as={ResizeTextarea}
              value={message}
              onChange={(e) => {
                // 최대 7줄만 스크린샷에 표현되니 7줄 넘게 입력하면 제한걸어야한다.
                if (e.target.value) {
                  const lineCount =
                    (e.target.value.match(/[^\n]*\n[^\n]*/gi)?.length ?? 1) + 1;
                  if (lineCount > 7) {
                    toast({
                      title: '최대 7줄까지만 입력가능합니다',
                      position: 'top-right',
                    });
                    return;
                  }
                }
                setMessage(e.target.value);
              }}
            />
            <Button
              disabled={message.length === 0}
              bgColor="#FFB86C"
              color="white"
              colorScheme="yellow"
              variant="solid"
              size="sm"
              onClick={async () => {
                const postData: {
                  message: string;
                  uid: string;
                  author?: {
                    displayName: string;
                    photoURL?: string;
                  };
                } = {
                  message,
                  uid: userInfo.uid,
                };
                if (isAnonymous === false) {
                  postData.author = {
                    photoURL:
                      authUser?.photoURL ?? 'https://bit.ly/broken-link',
                    displayName: authUser?.displayName ?? 'annoymous',
                  };
                }
                const messageResp = await postMessage(postData);
                if (messageResp.result === false) {
                  toast({ title: 'msg 등록 실패', position: 'top-right' });
                }
                setMessage('');
                setPage(1);
                setTimeout(() => {
                  setMessageListFetchTrigger((prev) => !prev);
                }, 50);
              }}
            >
              등록
            </Button>
          </Flex>
          <FormControl display="flex" alignItems="center" mt="1">
            <Switch
              size="sm"
              colorScheme="orange"
              id="anonymous"
              mr="1"
              isChecked={isAnonymous}
              onChange={() => {
                if (authUser === null) {
                  toast({
                    title: '로그인이 필요합니다',
                    position: 'top-right',
                  });
                  return;
                }
                setAnonymous((prev) => !prev);
              }}
            />
            <FormLabel htmlFor="anonymous" mb="0" fontSize="xx-small">
              Anonymous
            </FormLabel>
          </FormControl>
        </Box>
        <VStack spacing="12px" mt="6">
          {messageList.map((msg: InMessage) => (
            <MessageItem
              key={`message-item-${msg.id}`}
              uid={userInfo.uid}
              displayName={userInfo.displayName ?? ''}
              isOwner={isOwner}
              photoURL={userInfo.photoURL ?? 'https://bit.ly/broken-link'}
              item={msg}
              onSendComplete={() => {
                fetchMessageInfo({ uid: userInfo.uid, messageId: msg.id });
              }}
              screenName={screenName}
            />
          ))}
        </VStack>
        {totalPage > page && (
          <Button
            width="full"
            mt="2"
            fontSize="sm"
            leftIcon={<TriangleDownIcon />}
            onClick={() => {
              setPage((prev) => prev + 1);
            }}
          >
            더보기
          </Button>
        )}
      </Box>
    </ServiceLayout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({
  query,
}) => {
  const { screenName } = query;
  //const screenName = getStringValueFromQuery({ query, field: 'screenName' });
  if (screenName === undefined) {
    return {
      props: {
        userInfo: null,
        screenName: '',
      },
    };
  }
  try {
    const protocol = process.env.PROTOCOL || 'http';
    const host = process.env.HOST || 'localhost';
    const port = process.env.PROT || '3000';
    const baseUrl = `${protocol}://${host}:${port}`;
    const userInfoResp: AxiosResponse<InAuthUser> = await axios(
      `${baseUrl}/api/user.info/${screenName}`,
    );
    const screenNameToStr = Array.isArray(screenName)
      ? screenName[0]
      : screenName;
    /**
     *   
      const userInfo = await memberFindByScreenNameForClient({
      isServer: true,
      screenName,
    });
     */

    return {
      props: {
        userInfo: userInfoResp.data ?? null,
        screenName: screenNameToStr,
      },
    };
  } catch (err) {
    console.error(err);
    return {
      props: {
        userInfo: null,
        screenName: '',
      },
    };
  }
};

export default UserHomePage;

// useQuery 사용으로 비사용
// async function fetchMessageList(uid: string) {
//   try {
//     const resp = await fetch(
//       `/api/messages.list?uid=${uid}&page=${page}&size=3`,
//     );
//     if (resp.status === 200) {
//       const data: {
//         totalElements: number;
//         totalPages: number;
//         page: number;
//         size: number;
//         content: InMessage[];
//       } = await resp.json();
//       if (page === 1) {
//         setMessageList([...data.content]);
//         setTotalPage(data.totalPages);
//         return;
//       }
//       setMessageList((prev) => [...prev, ...data.content]);
//       setTotalPage(data.totalPages);
//     }
//   } catch (err) {
//     console.log(err);
//   }
// }
// useEffect(() => {
//   if (userInfo === null) return;
//   fetchMessageList(userInfo.uid);
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [userInfo, messageListFetchTrigger, page]);
