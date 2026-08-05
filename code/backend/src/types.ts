export type HttpApiEvent = {
  rawPath?: string;
  body?: string | null;
  queryStringParameters?: Record<string, string | undefined> | null;
  requestContext: {
    requestId?: string;
    http: {
      method: string;
      path: string;
    };
  };
};

export type HttpResult = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};
