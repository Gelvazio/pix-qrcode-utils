export type FetchMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface IJSONFetcher {
  readonly options: FetchOptions;

  fetchJSON<RET extends Object = Object>(
    method: FetchMethod,
    path: string
  ): Promise<RET>;

  fetchJSON<DATA = object, RET = object>(
    method: FetchMethod,
    path: string,
    data?: DATA,
    additionalHeaders?: FetchHeaders,
    isOK?: (status: number) => boolean
  ): Promise<RET>;
}

export type FetchHeaders = Headers | Record<string,string>;

export type FetchQueryParams = Record<string, string>;

export interface FetchOptions {
  baseUrl?: string;

  headers?: FetchHeaders;

  debug?: boolean;
}

export function buildFetchPath(
  path: string,
  query?: FetchQueryParams,
  additionalQuery?: FetchQueryParams
): string {
  if (query || additionalQuery) {
    let queryParams = new URLSearchParams(query);

    if ( additionalQuery ) {
      let additionalParams = new URLSearchParams(additionalQuery);

      additionalParams.forEach( (value, key) => {
        queryParams.append( key, value );
      })
    }

    let queryString = queryParams.toString();

    if (queryString.length > 0) {
      path += "?" + queryString;
    }

    //console.log( "?", queryString )
  }

  return path;
}

export class JSONFetcher implements IJSONFetcher {
  readonly options: FetchOptions;

  constructor(options?: FetchOptions) {
    this.options = {
      ...options
    }
  }

  //
  async fetchJSON<DATA extends Object = Object, RET extends Object = Object>(
    method: FetchMethod,
    path: string,
    data?: DATA,
    additionalHeaders?: FetchHeaders,
    isOK?: (status: number) => boolean
  ): Promise<RET> {
    const url = new URL(path, this.options.baseUrl);

    try {
      if ( this.options.debug ) {
        console.log(method, decodeURIComponent(url.toString()));
      }

      let headers = new Headers(this.options.headers);
      if (additionalHeaders) {
        new Headers(additionalHeaders).forEach((value, key) => {
          headers.append(key, value);
        });
      }

      let body: BodyInit | undefined;

      if (typeof data === "string") {
        body = data;
      } else if (data instanceof URLSearchParams) {
        body = data;
        headers.delete('content-type')
      } else if (typeof data === "object") {
        body = JSON.stringify(data);
        headers.append('content-type', 'application/json')
      }

      //console.log("Headers: ", headers);
      //console.log( body )

      const resp = await fetch(url, {
        method: method,
        body,
        headers,
      });

      const ok = isOK ? isOK(resp.status) : ( resp.status == 200 );

      if (!ok) {
        const text = await resp.text();

        throw new Error(`Fetch error: ${resp.status}\n${text}`);
      }

      //console.log("headers-resp", resp.headers);
      const json = resp.json();

      //console.log(json);

      return json;
    } catch (e) {
      throw e;
    }
  }
}