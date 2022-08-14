import { Box, Img } from '@chakra-ui/react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import PrintTest from '@/components/print_tesxt';

const OpenGraphImg: NextPage = function () {
  const { query } = useRouter();
  const text = query.text ?? '';
  const printText = Array.isArray(text) ? text[0] : text;
  return (
    <Box width="full" bgColor="white" p="25px" pt="50px" borderRadius="lg">
      <PrintTest printText={printText} />
      <Img src="/screenshot_bg.svg" alt="frame" />
    </Box>
  );
};

export default OpenGraphImg;
