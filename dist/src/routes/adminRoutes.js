"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_1 = require("@vercel/postgres");
const drizzle_orm_1 = require("drizzle-orm");
const vercel_postgres_1 = require("drizzle-orm/vercel-postgres");
const schema_1 = require("../db/schema");
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = (0, express_1.Router)();
router.get('/categories', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    if (!req.user) {
        res.status(404).send('Not allowed.');
        return;
    }
    const categories = yield db.select({
        id: schema_1.categoriesTable.id,
        category: schema_1.categoriesTable.category
    })
        .from(schema_1.categoriesTable)
        .where((0, drizzle_orm_1.eq)(schema_1.categoriesTable.userId, req.user.id));
    res.send(categories);
}));
exports.default = router;
