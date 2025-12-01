import express, { Express } from 'express';
import request from 'supertest';
import { errorHandler } from '../../middleware/error-handler';
import aiRouter from '../../routes/ai';
import { gigaChatService } from '../../services/gigachat.service';
import { generateToken } from '../../utils/jwt';

const mockGigaChatService = gigaChatService as jest.Mocked<typeof gigaChatService>;

describe('POST /ai/gigachat/chat', () => {
  let app: Express;
  const token = generateToken({
    id: 1,
    login: 'testuser',
    email: 'test@example.com',
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/ai', aiRouter);
    app.use(errorHandler);
    jest.clearAllMocks();
  });

  it('должен вернуть ответ от GigaChat', async () => {
    mockGigaChatService.isConfigured.mockReturnValue(true);
    mockGigaChatService.sendMessage.mockResolvedValue({
      model: 'GigaChat-2-Max',
      created: 1706096547,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'Я могу помогать с задачами' },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 5,
        completion_tokens: 20,
        total_tokens: 25,
      },
    });

    const response = await request(app)
      .post('/ai/gigachat/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'что ты умеешь?' })
      .expect(200);

    expect(response.body.choices[0].message.content).toContain('могу');
    expect(response.body.model).toBe('GigaChat-2-Max');
    expect(mockGigaChatService.sendMessage).toHaveBeenCalledWith({
      messages: [{ role: 'user', content: 'что ты умеешь?' }],
      temperature: undefined,
      top_p: undefined,
      userId: 1,
    });
  });

  it('должен вернуть 503 если GigaChat не настроен', async () => {
    mockGigaChatService.isConfigured.mockReturnValue(false);

    const response = await request(app)
      .post('/ai/gigachat/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'ping' })
      .expect(503);

    expect(response.body.status).toBe('error');
  });

  it('должен вернуть 400 при ошибке валидации', async () => {
    mockGigaChatService.isConfigured.mockReturnValue(true);

    const response = await request(app)
      .post('/ai/gigachat/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: '' })
      .expect(400);

    expect(response.body.status).toBe('error');
  });

  it('должен требовать JWT токен', async () => {
    await request(app)
      .post('/ai/gigachat/chat')
      .send({ message: 'без токена' })
      .expect(401);
  });
});


