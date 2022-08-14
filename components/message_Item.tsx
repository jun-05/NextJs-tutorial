import {
  Avatar,
  Box,
  Button,
  Divider,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';
import ResizeTextarea from 'react-textarea-autosize';
import { InMessage } from '@/models/message/in_message';

import convertDateToString from '@/utils/convert_date_to_sring';
import { MoreBtnIcon } from './more_btn_icon';
import FirebaseAuthClient from '@/models/firebase_auth_client';

interface Props {
  uid: string;
  displayName: string;
  isOwner: boolean;
  photoURL: string;
  item: InMessage;
  onSendComplete: () => void;
  screenName: string;
}

const MessageItem = function ({
  uid,
  photoURL,
  displayName,
  item,
  isOwner,
  onSendComplete,
  screenName,
}: Props) {
  const [reply, setReply] = useState('');
  const toast = useToast();
  const isDeny = item.deny !== undefined && item.deny === true;

  const postReply = async () => {
    const resp = await fetch('/api/messages.add.reply', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        messageId: item.id,
        reply,
      }),
    });
    console.info(resp);
    if (resp.status < 300) {
      onSendComplete();
    }
  };

  async function updateMessage({ deny }: { deny: boolean }) {
    const token =
      await FirebaseAuthClient.getInstance().Auth.currentUser?.getIdToken();
    if (token === undefined) {
      toast({
        title: '로그인한 사용자만 사용할 수 있는 메뉴입니다',
      });
      return;
    }

    const resp = await fetch('/api/messages.deny', {
      method: 'post',
      headers: {
        'Content-type': 'application/json',
        authorization: token,
      },
      body: JSON.stringify({
        uid,
        messageId: item.id,
        deny,
      }),
    });
    console.log(resp);
    if (resp.status < 300) {
      onSendComplete();
    }
  }

  return (
    <Box borderRadius="md" width="full" bg="white" boxShadow="md">
      <Box>
        <Flex pl="2" pt="2" alignItems="center">
          <Avatar
            size="xs"
            src={
              item.author
                ? item.author.photoURL ?? 'https://bit.ly/broken-link'
                : 'https://bit.ly/broken-link'
            }
          />
          <Text fontSize="xx-small" ml="1">
            {item.author ? item.author.displayName : 'anonymous'}
          </Text>
          <Text
            whiteSpace="pre-line"
            fontSize="xx-small"
            color="gray.500"
            ml="1"
          >
            {convertDateToString(item.createAt)}
          </Text>
          <Spacer />
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<MoreBtnIcon />}
              width="24px"
              height="24px"
              borderRadius="full"
              variant="link"
              size="xs"
            />
            <MenuList>
              {isOwner && (
                <MenuItem
                  onClick={() =>
                    updateMessage({
                      deny: item.deny !== undefined ? !item.deny : true,
                    })
                  }
                >
                  {!isDeny ? '비공개 처리' : '비공개 처리 해제'}
                </MenuItem>
              )}
              <MenuItem
                // eslint-disable-next-line no-return-assign
                onClick={() =>
                  (window.location.href = `/${screenName}/${item.id}`)
                }
              >
                메시지 상세보기
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Box>
      <Box p="2">
        <Box borderRadius="md" borderWidth="1px" p="2">
          <Text whiteSpace="pre-line" fontSize="sm">
            {item.message}
          </Text>
        </Box>
        {item.reply && (
          <Box pt="2">
            <Divider />
            <Box display="flex" mt="2">
              <Box pt="2">
                <Avatar size="xs" src={photoURL} mr="2" />
              </Box>
              <Box borderRadius="md" p="2" width="full" bg="gray.100">
                <Flex alignItems="center">
                  <Text fontSize="xs">{displayName}</Text>
                  <Text whiteSpace="pre-line" fontSize="xs" color="gray">
                    {convertDateToString(item.createAt)}
                  </Text>
                  <Spacer />
                </Flex>
                <Text whiteSpace="pre-line" fontSize="xs">
                  {item.reply}
                </Text>
              </Box>
            </Box>
          </Box>
        )}
        {item.reply === undefined && isOwner && (
          <Box pt="2">
            <Divider />
            <Box display="flex" mt="2">
              <Box pt="1">
                <Avatar size="xs" src={photoURL} mr="2" />
              </Box>
              <Box borderRadius="md" width="full" bg="gray.100" mr="2">
                <Textarea
                  border="none"
                  boxShadow="none !important"
                  resize="none"
                  minH="unset"
                  minRows={1}
                  overflow="hidden"
                  fontSize="xs"
                  as={ResizeTextarea}
                  placeholder="댓글을 입력하세요..."
                  value={reply}
                  onChange={(e) => {
                    setReply(e.target.value);
                  }}
                />
              </Box>
              <Button
                disabled={reply.length === 0}
                colorScheme="pink"
                bgColor="#FF75B5"
                variant="solid"
                size="sm"
                onClick={() => {
                  postReply();
                }}
                // borderRadius="full"
              >
                등록
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessageItem;
