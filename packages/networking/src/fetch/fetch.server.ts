import { buildRequestBody, buildRequestUrl } from '../helpers';
import { type Request, type RequestReturn, type RequestProps, LoadRequestProps } from '../types';

const request = async <Params, Data>({
  url = '/',
  method = 'GET',
  headers,
  body,
  ...settings
}: RequestProps<Params>): Promise<RequestReturn<Data>> => {
  const reqHeaders = new Headers(headers);
  const reqBody = buildRequestBody(method, body);
  const reqUrl = buildRequestUrl(url, method, body);

  const ready: RequestInit = {
    ...settings,
    method,
    headers: reqHeaders,
    body: !['GET', 'HEAD'].includes(method) ? reqBody : undefined,
  };

  const response = await fetch(reqUrl, ready);
  const resType = response.headers.get('content-type') || '';
  const rawText = (await response.text()) || '';
  const isJson = resType.includes('json');

  let data = rawText as any;
  if (isJson && rawText) {
    try { data = JSON.parse(rawText) as Data; }
    catch { data = rawText; }
  }

  return { ...response, status: response.status, data };
};

const createDataFlow = (
  shared: RequestProps,
  load: LoadRequestProps = async () => ({}),
) => {
  const requestReady = async <Params, Data>(
    props: RequestProps<Params>,
  ): Promise<RequestReturn<Data>> => {
    const loadedProps = await load(shared);

    const baseUrl = shared.url ?? '';
    const childUrl = props.url ?? '';
    const mergedUrl = baseUrl && childUrl
      ? `${baseUrl}${childUrl}`
      : baseUrl || childUrl || '/';

    const mergedProps = {
      ...shared,
      ...loadedProps,
      ...props,
      url: mergedUrl,
    } as RequestProps<Params>;

    return request<Params, Data>(mergedProps);
  };

  return requestReady;
};

export { request, createDataFlow };
export type { Request, RequestProps, RequestReturn };
