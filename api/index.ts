import express from "express";
import 'express-async-errors';
import dotenv from "dotenv";
import cors from 'cors';
import errorHandler from "../src/middlewares/errorHandler";
import { v2 as cloudinary } from 'cloudinary';
import helmet from "helmet";

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(helmet());

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

import adminRoutes from '../src/routes/adminRoutes';
import getRoutes from '../src/routes/getRoutes';
import postRoutes from '../src/routes/postRoutes';
import putRoutes from '../src/routes/putRoutes';
import deleteRoutes from '../src/routes/deleteRoutes';

app.use('/admin', adminRoutes);
app.use('/user', getRoutes);
app.use(postRoutes);
app.use('/edit', putRoutes);
app.use('/delete', deleteRoutes);

app.use(errorHandler);

export default app;