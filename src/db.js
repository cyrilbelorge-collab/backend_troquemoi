import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 👉 export default pour pouvoir faire "import prisma from '../db.js';"
export default prisma;
