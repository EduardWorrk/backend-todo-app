import { Request, Response } from 'express';
import { GIGACHAT_CONSTANTS } from '../constants/gigachat.constants';
import { SendGigaChatMessageDto } from '../dto/gigachat.dto';
import { gigaChatService } from '../services/gigachat.service';

class GigaChatController {
  async sendMessage(req: Request, res: Response): Promise<void> {
    if (!gigaChatService.isConfigured()) {
      res.status(503).json({
        status: 'error',
        message: GIGACHAT_CONSTANTS.ERRORS.NOT_CONFIGURED,
      });
      return;
    }

    const payload = req.body as SendGigaChatMessageDto;
    const history =
      payload.messages && payload.messages.length > 0
        ? payload.messages
        : [
            {
              role: 'user' as const,
              content: payload.message!.trim(),
            },
          ];

    const response = await gigaChatService.sendMessage({
      messages: history,
      temperature: payload.temperature,
      top_p: payload.top_p,
      model: payload.model,
      userId: req.user?.id,
    });

    // Прокси — возвращаем оригинальный ответ от GigaChat API
    res.json(response);
  }
}

export const gigaChatController = new GigaChatController();


