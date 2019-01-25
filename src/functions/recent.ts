import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { left } from 'fp-ts/lib/Either';
import { tryCatch } from 'fp-ts/lib/TaskEither';
import { JSDOM } from 'jsdom';
import { getEnv } from '../util/get-env';
import { select, selectAll } from '../util/query-selector';

interface LiveDetail {
  date: string;
  title: string;
  description: string;
  broadcaster: string;
  url: string;
}

const toLiveDetail = ($div: HTMLDivElement): LiveDetail => {
  const date = select('.liveDate', $div)
    .mapNullable((ele) => ele.textContent)
    .fold('', (txt) => txt.trim());

  const $a = select<HTMLAnchorElement>('.liveTitle', $div);
  const url = $a.fold('', (ele) => ele.href.replace('?ref=community', ''));
  const title = $a.mapNullable((ele) => ele.textContent).getOrElse('');

  const broadcaster = select<HTMLDivElement>('.liveBroadcaster', $div)
    .mapNullable((ele) => ele.textContent)
    .fold('', (txt) => txt.trim().replace(/^放送主：(.+)さん$/, '$1'));

  const description = select<HTMLParagraphElement>('.liveDescription', $div)
    .mapNullable((ele) => ele.textContent)
    .getOrElse('');

  return { date, title, description, broadcaster, url };
};

export const handler: APIGatewayProxyHandler = async () => {
  const url = getEnv('COMMUNITY_ID').map((id) => `https://com.nicovideo.jp/live_archives/${id}`);
  if (url.isNone()) {
    return { statusCode: 500, body: 'コミュニティIDが設定されていない' };
  }

  const result = await tryCatch(() => JSDOM.fromURL(url.value), String)
    .map((vdom) => selectAll<HTMLDivElement>('.liveDetail', vdom.window.document))
    .map((divs) => divs.map(toLiveDetail))
    .run()
    .catch((reason) => left<string, LiveDetail[]>(String(reason)));

  return result.fold<APIGatewayProxyResult>(
    (reason) => ({ statusCode: 500, body: reason }),
    (liveDetails) => ({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: liveDetails }),
    }),
  );
};
