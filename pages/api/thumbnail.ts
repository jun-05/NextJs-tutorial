import type { NextApiRequest, NextApiResponse } from 'next';
import chromium from 'chrome-aws-lambda';
import playwright from 'playwright-core';

// https://ndo.dev/posts/link-screenshot
export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Start Playwright with the dynamic chrome-aws-lambda args
  const localChromiumPath =
    process.env.NODE_ENV !== 'development'
      ? ''
      : process.env.LOCAL_CHROMIUM_PATH ?? '';
  if (process.env.NODE_ENV !== 'development') {
    const protocol = process.env.PROTOCOL || 'http';
    const host = process.env.HOST || 'localhost';
    const port = process.env.PROT || '3000';
    const baseUrl = `${protocol}://${host}:${port}`;

    await chromium.font(`${baseUrl}/Pretendard-Regular.ttf`);
  }
  const browser = await playwright.chromium.launch({
    args: chromium.args,
    executablePath:
      process.env.NODE_ENV !== 'development'
        ? await chromium.executablePath
        : localChromiumPath,
    headless: process.env.NODE_ENV !== 'development' ? chromium.headless : true,
  });

  // Create a page with the recommended Open Graph image size
  const page = await browser.newPage({
    viewport: {
      width: 1200,
      height: 675,
    },
  });

  // Extract the url from the query parameter `path`
  const url = req.query.url as string;

  console.info(url);
  await page.goto(url);

  const data = await page.screenshot({
    type: 'jpeg',
  });

  await browser.close();

  // Set the `s-maxage` property to cache at the CDN layer
  res.setHeader('Cache-Control', 's-maxage=31536000, public');
  res.setHeader('Content-Type', 'image/jpeg');
  res.end(data);
};
