import request from 'supertest';
import express, { Express } from 'express';
import categoriesRouter from '../../routes/categories';
import { errorHandler } from '../../middleware/error-handler';
import prisma from '../../db/prisma';
import { generateToken } from '../../utils/jwt';

const mockPrisma = prisma as any;

describe('Categories routes', () => {
  let app: Express;
  const tokenPayload = {
    id: 1,
    login: 'tester',
    email: 'tester@example.com',
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/categories', categoriesRouter);
    app.use(errorHandler);
    jest.clearAllMocks();
  });

  const authHeader = () => ({
    Authorization: `Bearer ${generateToken(tokenPayload)}`,
  });

  it('должен возвращать список категорий', async () => {
    const mockCategories = [
      {
        id: 1,
        name: 'Работа',
        color: '#FF0000',
        created_by: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Дом',
        color: '#00FF00',
        created_by: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    (mockPrisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

    const response = await request(app).get('/categories').set(authHeader()).expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.categories).toHaveLength(2);
    expect(mockPrisma.category.findMany).toHaveBeenCalled();
  });

  it('должен создавать категорию', async () => {
    const payload = { name: 'Учеба', color: '#123456' };
    const createdCategory = {
      id: 3,
      ...payload,
      created_by: tokenPayload.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    (mockPrisma.category.create as jest.Mock).mockResolvedValue(createdCategory);

    const response = await request(app)
      .post('/categories')
      .set(authHeader())
      .send(payload)
      .expect(201);

    expect(response.body.status).toBe('success');
    expect(response.body.category).toMatchObject({
      id: createdCategory.id,
      name: payload.name,
      color: payload.color,
    });
    expect(mockPrisma.category.create).toHaveBeenCalledWith({
      data: {
        name: payload.name,
        color: payload.color,
        created_by: tokenPayload.id,
      },
    });
  });

  it('должен удалять категорию без связанных задач', async () => {
    (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue({ id: 10 });
    (mockPrisma.task.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.category.delete as jest.Mock).mockResolvedValue({ id: 10 });

    const response = await request(app)
      .delete('/categories/10')
      .set(authHeader())
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Категория успешно удалена');
    expect(mockPrisma.category.delete).toHaveBeenCalledWith({ where: { id: 10 } });
  });

  it('должен возвращать 401 без токена', async () => {
    await request(app).get('/categories').expect(401);
  });
});




