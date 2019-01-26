# Live List

ベースURL: <https://osmh-live-list.netlify.com>

## `GET /recent`

```ts
type Response = {
  result: Array<LiveDetail>;
};

type LiveDetail = {
  date: string;
  title: string;
  description: string;
  broadcaster: string;
  url: string;
};
```

最近の放送一覧を返す。

内部的には `com.nicovideo.jp/live_archives/co1590527` の1ページ目を取得・変換し、返却する。

### example

```console
% curl -s https://osmh-live-list.netlify.com/recent | jq '.result[0]'
{
  "date": "2019/01/19 22:00",
  "title": "闘",
  "description": "まだ練習中と思ってくれ",
  "broadcaster": "盛本　修",
  "url": "http://live.nicovideo.jp/watch/lv318050715"
}
```
