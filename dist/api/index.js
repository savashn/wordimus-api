"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("express-async-errors");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = __importDefault(require("../src/middlewares/errorHandler"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
}));
const adminRoutes_1 = __importDefault(require("../src/routes/adminRoutes"));
const getRoutes_1 = __importDefault(require("../src/routes/getRoutes"));
const postRoutes_1 = __importDefault(require("../src/routes/postRoutes"));
const putRoutes_1 = __importDefault(require("../src/routes/putRoutes"));
app.use('/admin', adminRoutes_1.default);
app.use('/user', getRoutes_1.default);
app.use(postRoutes_1.default);
app.use('/edit', putRoutes_1.default);
app.get("/", (request, response) => {
    response.status(200).send("Hello World");
});
app.use(errorHandler_1.default);
exports.default = app;
