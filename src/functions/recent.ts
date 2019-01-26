import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import cheerio from 'cheerio';
import { left } from 'fp-ts/lib/Either';
import { Identity } from 'fp-ts/lib/Identity';
import { fromNullable } from 'fp-ts/lib/Option';
import { fromLeft, tryCatch } from 'fp-ts/lib/TaskEither';
import fetch from 'node-fetch';

interface LiveDetail {
  date: string;
  title: string;
  description: string;
  broadcaster: string;
  url: string;
}

const find = (x: Cheerio, q: string) => new Identity(x.find(q));
const text = (x: Cheerio) => x.text();
const trim = (x: string) => x.trim();

const toLiveDetail = (el: Cheerio): LiveDetail => {
  const $a = find(el, '.liveTitle');

  const date = find(el, '.liveDate')
    .map(text)
    .map(trim).value;
  const title = $a.map(text).map(trim).value;
  const description = find(el, '.liveDescription')
    .map(text)
    .map(trim).value;
  const broadcaster = find(el, '.liveBroadcaster')
    .map(text)
    .map(trim)
    .map((x) => x.replace(/^放送主：(.+)さん$/, '$1')).value;
  const url = $a.map((x) => x.attr('href').replace('?ref=community', '')).value;

  return { date, title, description, broadcaster, url };
};

export const handler: APIGatewayProxyHandler = async () => {
  const url = fromNullable(process.env.COMMUNITY_ID).map((id) => `https://com.nicovideo.jp/live_archives/${id}`);
  if (url.isNone()) {
    return { statusCode: 500, body: 'コミュニティIDが設定されていない' };
  }

  const result = await tryCatch(() => fetch(url.value), String)
    .chain((res) => (res.ok ? tryCatch(() => res.text(), String) : fromLeft<string, string>('ページの取得に失敗した')))
    .map((html) => cheerio.load(html))
    .map(($) =>
      $('.liveDetail')
        .toArray()
        .map($)
        .map(toLiveDetail),
    )
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
