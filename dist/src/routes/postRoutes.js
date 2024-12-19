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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const slugify_1 = __importDefault(require("slugify"));
const router = (0, express_1.Router)();
router.post('/follow', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).send('Invalid user.');
        return;
    }
    const follow = {
        followerId: req.user.id,
        followingId: req.body.userId
    };
    yield db.insert(schema_1.followsTable).values(follow);
    res.json({ message: 'Success!' });
}));
router.post('/mark-as-starred', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).send('Invalid user.');
        return;
    }
    const star = {
        postId: req.body.postId,
        userId: req.user.id
    };
    yield db.insert(schema_1.starsTable).values(star);
    res.json({ message: 'Success!' });
}));
router.post('/new/post', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).send('Invalid user.');
        return;
    }
    const count = Math.ceil(req.body.content.split(/\s+/).filter(Boolean).length / 350);
    const post = {
        header: req.body.header,
        slug: (0, slugify_1.default)(req.body.header.toLowerCase()),
        content: req.body.content,
        readingTime: count < 1 ? 1 : count,
        authorId: req.user.id
    };
    const newPost = yield db.insert(schema_1.postsTable).values(post).returning();
    if (Array.isArray(req.body.categories) && req.body.categories.length > 0) {
        for (const categoryId of req.body.categories) {
            const category = {
                postId: newPost[0].id,
                categoryId: categoryId
            };
            yield db.insert(schema_1.postCategoriesTable).values(category);
        }
    }
    res.status(201).send('Post successfully created');
}));
router.post('/new/category', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    if (req.user) {
        console.log(typeof req.user);
        Number(req.user.id);
    }
    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).json({ message: 'Invalid user.' });
        return;
    }
    const category = {
        category: req.body.category,
        slug: (0, slugify_1.default)(req.body.category.toLowerCase()),
        userId: req.user.id
    };
    yield db.insert(schema_1.categoriesTable).values(category);
    res.send('Category has been added!');
}));
router.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    const user = yield db.select()
        .from(schema_1.usersTable)
        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.usersTable.username, req.body.username), (0, drizzle_orm_1.eq)(schema_1.usersTable.email, req.body.username)))
        .limit(1);
    if (user.length === 0) {
        res.status(404).json({ message: 'User not found.' });
        return;
    }
    const isSuccess = yield bcrypt_1.default.compare(req.body.password, user[0].password);
    if (!isSuccess) {
        res.status(401).json({ message: 'Invalid password.' });
        return;
    }
    const token = jsonwebtoken_1.default.sign({ id: user[0].id, username: user[0].username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.send(token);
}));
router.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    const isExisting = yield db.select()
        .from(schema_1.usersTable)
        .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.usersTable.username, req.body.username), (0, drizzle_orm_1.eq)(schema_1.usersTable.email, req.body.email)))
        .limit(1);
    if (isExisting.length > 0) {
        res.status(500).send("This user is already exist!");
        return;
    }
    const hashedPassword = yield bcrypt_1.default.hash(req.body.password, 10);
    const user = {
        username: req.body.username,
        password: hashedPassword,
        name: req.body.name,
        email: req.body.email,
    };
    yield db.insert(schema_1.usersTable).values(user);
    console.log('New user created!');
    res.send(user);
}));
exports.default = router;
