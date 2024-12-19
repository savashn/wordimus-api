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
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const slugify_1 = __importDefault(require("slugify"));
const router = (0, express_1.Router)();
router.put('/:user/post/:post', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).send('Invalid user.');
        return;
    }
    const count = req.body.content.split(/\s+/).filter(Boolean).length / 350;
    const updatedPost = yield db.update(schema_1.postsTable)
        .set({
        header: req.body.header,
        slug: (0, slugify_1.default)(req.body.header),
        content: req.body.content,
        readingTime: count < 1 ? 1 : count,
        updatedAt: new Date()
    })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.postsTable.header, req.body.header), (0, drizzle_orm_1.eq)(schema_1.postsTable.authorId, req.user.id)))
        .returning();
    const postId = updatedPost[0].id;
    if (Array.isArray(req.body.categories) && req.body.categories.length > 0) {
        yield db.delete(schema_1.postCategoriesTable)
            .where((0, drizzle_orm_1.eq)(schema_1.postCategoriesTable.postId, postId));
        for (const category of req.body.categories) {
            yield db.insert(schema_1.postCategoriesTable).values({
                postId: postId,
                categoryId: category
            });
        }
    }
    res.send('Post updated!');
}));
router.put('/change-password', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).send('Invalid user.');
        return;
    }
    const hashedPassword = yield bcrypt_1.default.hash(req.body.password, 10);
    yield db.update(schema_1.usersTable)
        .set({
        password: hashedPassword
    })
        .where((0, drizzle_orm_1.eq)(schema_1.usersTable.id, req.user.id));
    res.send('Your password changed!');
}));
router.put('/:user', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).send('Invalid user.');
        return;
    }
    yield db.update(schema_1.usersTable)
        .set({
        username: req.body.username,
        name: req.body.name,
        email: req.body.email,
        about: req.body.about
    })
        .where((0, drizzle_orm_1.eq)(schema_1.usersTable.id, req.user.id));
    res.send('Your profile updated!');
}));
exports.default = router;
