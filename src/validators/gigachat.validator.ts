import { z } from 'zod';
import { GIGACHAT_CONSTANTS } from '../constants/gigachat.constants';

const roleEnum = z.enum(['system', 'user', 'assistant']);

export const gigachatMessageSchema = z.object({
  role: roleEnum,
  content: z
    .string({ message: 'content должен быть строкой' })
    .trim()
    .min(1, 'content не может быть пустым')
    .max(GIGACHAT_CONSTANTS.MAX_MESSAGE_LENGTH, 'content слишком длинный'),
});

export const sendGigaChatMessageSchema = z
  .object({
    message: z
      .string({ message: 'message должен быть строкой' })
      .trim()
      .min(1, 'message не может быть пустым')
      .max(GIGACHAT_CONSTANTS.MAX_MESSAGE_LENGTH, 'message слишком длинное')
      .optional(),
    messages: z
      .array(gigachatMessageSchema, {
        message: 'messages должен быть массивом сообщений',
      })
      .min(1, 'messages не может быть пустым')
      .max(GIGACHAT_CONSTANTS.MAX_HISTORY_LENGTH, 'messages слишком длинный')
      .optional(),
    temperature: z
      .number({ message: 'temperature должен быть числом' })
      .min(0, 'temperature не может быть меньше 0')
      .max(2, 'temperature не может быть больше 2')
      .optional(),
    top_p: z
      .number({ message: 'top_p должен быть числом' })
      .min(0, 'top_p не может быть меньше 0')
      .max(1, 'top_p не может быть больше 1')
      .optional(),
  })
  .refine(
    (data) => Boolean(data.message) || Boolean(data.messages?.length),
    {
      message: GIGACHAT_CONSTANTS.ERRORS.MESSAGE_OR_HISTORY_REQUIRED,
      path: ['message'],
    }
  );

export type SendGigaChatMessageInput = z.infer<typeof sendGigaChatMessageSchema>;
export type GigachatMessageInput = z.infer<typeof gigachatMessageSchema>;

export { validate } from '../utils/validation';


