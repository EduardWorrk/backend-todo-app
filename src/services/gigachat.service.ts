import { randomUUID } from 'crypto';
import https, { RequestOptions } from 'https';
import { URL } from 'url';
import { GIGACHAT_CONSTANTS } from '../constants/gigachat.constants';
import { GigaChatMessageDto } from '../dto/gigachat.dto';
import { AppError } from '../utils/errors';

interface OAuthResponse {
  access_token: string;
  expires_at?: string;
  expires_in?: number;
}

interface ChatCompletionResponse {
  id?: string;
  model: string;
  created?: number;
  choices: {
    index: number;
    message: GigaChatMessageDto;
    finish_reason?: string | null;
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface SendChatCompletionParams {
  messages: GigaChatMessageDto[];
  temperature?: number;
  top_p?: number;
  userId?: number;
  model?: string;
}

class GigaChatService {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  private readonly authUrl =
    process.env.GIGACHAT_AUTH_URL ||
    'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
  private readonly chatUrl =
    process.env.GIGACHAT_CHAT_URL ||
    'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
  private readonly scope =
    process.env.GIGACHAT_SCOPE || GIGACHAT_CONSTANTS.DEFAULT_SCOPE;
  private readonly model =
    process.env.GIGACHAT_MODEL || GIGACHAT_CONSTANTS.DEFAULT_MODEL;
  private readonly timeoutMs = parseInt(
    process.env.GIGACHAT_TIMEOUT_MS ||
      GIGACHAT_CONSTANTS.DEFAULT_TIMEOUT_MS.toString(),
    10
  );
  private readonly rejectUnauthorized =
    (process.env.GIGACHAT_REJECT_UNAUTHORIZED || 'false').toLowerCase() ===
    'true';

  private readonly agent = new https.Agent({
    rejectUnauthorized: this.rejectUnauthorized,
  });

  private get credentials(): string | undefined {
    return process.env.GIGACHAT_CREDENTIALS;
  }

  isConfigured(): boolean {
    return Boolean(this.credentials);
  }

  async sendMessage(params: SendChatCompletionParams): Promise<ChatCompletionResponse> {
    if (!this.isConfigured()) {
      throw new AppError(GIGACHAT_CONSTANTS.ERRORS.NOT_CONFIGURED, 503);
    }

    const token = await this.getAccessToken();
    const payload = JSON.stringify({
      model: params.model?.trim() || this.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      top_p: params.top_p ?? 0.9,
      stream: false,
      user: params.userId ? `user_${params.userId}` : undefined,
    });

    const response = await this.postJson<ChatCompletionResponse>(this.chatUrl, payload, {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    // Возвращаем оригинальный ответ от GigaChat API
    return response;
  }

  private async getAccessToken(): Promise<string> {
    if (
      this.accessToken &&
      Date.now() < this.tokenExpiresAt - 5_000
    ) {
      return this.accessToken;
    }

    if (!this.credentials) {
      throw new AppError(GIGACHAT_CONSTANTS.ERRORS.NOT_CONFIGURED, 503);
    }

    const payload = `scope=${encodeURIComponent(this.scope)}`;
    const response = await this.postForm<OAuthResponse>(this.authUrl, payload, {
      Authorization: `Basic ${this.credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      RqUID: randomUUID(),
    });

    if (!response.access_token) {
      throw new AppError(GIGACHAT_CONSTANTS.ERRORS.TOKEN_REQUEST_FAILED, 502);
    }

    const expiresInMs =
      (response.expires_in ?? 600) * 1000;
    this.accessToken = response.access_token;
    this.tokenExpiresAt = Date.now() + expiresInMs;

    return this.accessToken;
  }

  private async postJson<T>(
    url: string,
    body: string,
    headers: Record<string, string>
  ): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(body).toString(),
      },
      body,
    });
  }

  private async postForm<T>(
    url: string,
    body: string,
    headers: Record<string, string>
  ): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(body).toString(),
      },
      body,
    });
  }

  private async request<T>(
    targetUrl: string,
    options: {
      method: 'POST' | 'GET';
      headers?: Record<string, string>;
      body?: string;
    }
  ): Promise<T> {
    const url = new URL(targetUrl);

    const requestOptions: RequestOptions = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port ? Number(url.port) : undefined,
      path: url.pathname + url.search,
      method: options.method,
      headers: options.headers,
      agent: this.agent,
      timeout: this.timeoutMs,
    };

    return new Promise<T>((resolve, reject) => {
      const req = https.request(requestOptions, (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk) => {
          chunks.push(
            typeof chunk === 'string' ? Buffer.from(chunk) : chunk
          );
        });

        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          const statusCode = res.statusCode ?? 500;

          if (statusCode < 200 || statusCode >= 300) {
            return reject(
              new AppError(
                `${GIGACHAT_CONSTANTS.ERRORS.CHAT_REQUEST_FAILED}: ${statusCode} ${raw}`,
                statusCode
              )
            );
          }

          try {
            const parsed = raw ? JSON.parse(raw) : {};
            resolve(parsed as T);
          } catch (error) {
            reject(
              new AppError(
                `Не удалось распарсить ответ GigaChat: ${
                  (error as Error).message
                }`
              )
            );
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(this.timeoutMs, () => {
        req.destroy(
          new Error(
            `GigaChat request timed out after ${this.timeoutMs} ms`
          )
        );
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }
}

export const gigaChatService = new GigaChatService();


