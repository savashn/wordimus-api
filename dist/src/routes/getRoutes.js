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
router.get('/:user/follows', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    const userRecord = yield db.select({
        id: schema_1.usersTable.id,
        username: schema_1.usersTable.username
    })
        .from(schema_1.usersTable)
        .where((0, drizzle_orm_1.eq)(schema_1.usersTable.username, req.params.user))
        .limit(1);
    if (userRecord.length === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    const userId = userRecord[0].id;
    const follows = yield db.select({
        followingName: schema_1.usersTable.name
    })
        .from(schema_1.followsTable)
        .innerJoin(schema_1.usersTable, (0, drizzle_orm_1.eq)(schema_1.usersTable.id, schema_1.followsTable.followingId))
        .where((0, drizzle_orm_1.eq)(schema_1.followsTable.followerId, userId));
    if (follows.length === 0) {
        res.status(404).json({ message: 'This user has no friends yet.' });
        return;
    }
    res.send(follows);
}));
router.get('/:user/posts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    const posts = yield db.select({
        slug: schema_1.postsTable.slug,
        header: schema_1.postsTable.header,
        content: schema_1.postsTable.content,
        readingTime: schema_1.postsTable.readingTime,
        createdAt: schema_1.postsTable.createdAt,
        isHidden: schema_1.postsTable.isHidden,
        author: schema_1.usersTable.name,
        authorId: schema_1.usersTable.id
    })
        .from(schema_1.postsTable)
        .innerJoin(schema_1.usersTable, (0, drizzle_orm_1.eq)(schema_1.postsTable.authorId, schema_1.usersTable.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.usersTable.username, req.params.user), (0, drizzle_orm_1.eq)(schema_1.postsTable.isHidden, false)));
    if (posts.length === 0) {
        res.status(404).json({ message: 'There is nothing yet.' });
        return;
    }
    // const userId = posts[0].authorId as number;
    // const categories: Category[] = await db.select()
    //     .from(categoriesTable)
    //     .where(
    //         and(
    //             eq(categoriesTable.userId, userId),
    //             eq(categoriesTable.isHidden, false)
    //         )
    //     )
    // const response = { posts, categories }
    // res.send(response);
    res.send(posts);
}));
router.get('/:user/posts/:post', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    const posts = yield db.select({
        id: schema_1.postsTable.id,
        slug: schema_1.postsTable.slug,
        header: schema_1.postsTable.header,
        content: schema_1.postsTable.content,
        readingTime: schema_1.postsTable.readingTime,
        createdAt: schema_1.postsTable.createdAt,
        updatedAt: schema_1.postsTable.updatedAt,
        isHidden: schema_1.postsTable.isHidden,
        author: schema_1.usersTable.name,
    })
        .from(schema_1.postsTable)
        .innerJoin(schema_1.usersTable, (0, drizzle_orm_1.eq)(schema_1.postsTable.authorId, schema_1.usersTable.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.usersTable.username, req.params.user), (0, drizzle_orm_1.ilike)(schema_1.postsTable.slug, req.params.post)))
        .limit(1);
    if (posts.length === 0) {
        res.status(404).json({ message: 'Not found.' });
        return;
    }
    const post = posts[0];
    const categories = yield db.select({
        category: schema_1.categoriesTable.category,
        slug: schema_1.categoriesTable.slug
    })
        .from(schema_1.categoriesTable)
        .innerJoin(schema_1.postCategoriesTable, (0, drizzle_orm_1.eq)(schema_1.categoriesTable.id, schema_1.postCategoriesTable.categoryId))
        .where((0, drizzle_orm_1.eq)(schema_1.postCategoriesTable.postId, post.id));
    let response;
    if (categories.length === 0) {
        response = {
            post
        };
    }
    else {
        response = {
            post,
            categories
        };
    }
    // const response = {
    //     post,
    //     categories
    // }
    res.send(response);
}));
router.get('/:user/starreds', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    const starredPosts = yield db.select({
        header: schema_1.postsTable.header,
        readingTime: schema_1.postsTable.readingTime,
        author: schema_1.usersTable.name
    })
        .from(schema_1.postsTable)
        .innerJoin(schema_1.usersTable, (0, drizzle_orm_1.eq)(schema_1.usersTable.username, req.params.user))
        .innerJoin(schema_1.starsTable, (0, drizzle_orm_1.eq)(schema_1.starsTable.userId, schema_1.usersTable.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.starsTable.postId, schema_1.postsTable.id), (0, drizzle_orm_1.eq)(schema_1.starsTable.userId, schema_1.usersTable.id)));
    if (starredPosts.length === 0) {
        res.status(404).json({ message: 'There is nothing yet.' });
        return;
    }
    res.send(starredPosts);
}));
router.get('/:user/categories', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    const user = yield db.select({
        id: schema_1.usersTable.id
    })
        .from(schema_1.usersTable)
        .where((0, drizzle_orm_1.eq)(schema_1.usersTable.username, req.params.user));
    const userId = user[0].id;
    const categories = yield db.select({
        id: schema_1.categoriesTable.id,
        category: schema_1.categoriesTable.category,
        postsCount: (0, drizzle_orm_1.count)((0, drizzle_orm_1.eq)(schema_1.postsTable.authorId, userId))
    })
        .from(schema_1.categoriesTable)
        .innerJoin(schema_1.postCategoriesTable, (0, drizzle_orm_1.eq)(schema_1.postCategoriesTable.categoryId, schema_1.categoriesTable.id))
        .innerJoin(schema_1.postsTable, (0, drizzle_orm_1.eq)(schema_1.postCategoriesTable.postId, schema_1.postsTable.id))
        .where(
    // eq(postsTable.authorId, userId) // KATEGORİLER KİŞİYE ÖZGÜ OLACAKSA BURAYA YENİDEN BAKMALIYIZ
    (0, drizzle_orm_1.eq)(schema_1.categoriesTable.userId, userId))
        .groupBy(schema_1.categoriesTable.id);
    if (categories.length === 0) {
        res.json({ message: 'Not found.' });
        return;
    }
    res.send(categories);
}));
router.get('/:user/categories/category', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryIds = Array.isArray(req.query.id) ? req.query.id.map(Number) : [Number(req.query.id)];
    if (categoryIds.some(isNaN)) {
        res.status(400).json({ message: "Invalid category ID(s)." });
        return;
    }
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    const categories = yield db.select({
        slug: schema_1.postsTable.slug,
        header: schema_1.postsTable.header,
        readingTime: schema_1.postsTable.readingTime,
        createdAt: schema_1.postsTable.createdAt
    })
        .from(schema_1.postsTable)
        .innerJoin(schema_1.postCategoriesTable, (0, drizzle_orm_1.eq)(schema_1.postCategoriesTable.postId, schema_1.postsTable.id))
        .innerJoin(schema_1.categoriesTable, (0, drizzle_orm_1.eq)(schema_1.postCategoriesTable.categoryId, schema_1.categoriesTable.id))
        .innerJoin(schema_1.usersTable, (0, drizzle_orm_1.eq)(schema_1.postsTable.authorId, schema_1.usersTable.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.usersTable.username, req.params.user), (0, drizzle_orm_1.inArray)(schema_1.categoriesTable.id, categoryIds)));
    if (categories.length === 0) {
        res.status(404).json({ message: 'There is nothing yet.' });
        return;
    }
    res.send(categories);
}));
// router.get('/profile/:user', async (req: Request, res: Response) => {
//     const db = drizzle({ client: sql });
//     const user: User[] = await db.select({
//         username: usersTable.username,
//         name: usersTable.name,
//         about: usersTable.about,
//         createdAt: usersTable.createdAt
//     }).from(usersTable)
//         .where(eq(usersTable.username, req.params.user))
//         .limit(1);
//     if (user.length === 0) {
//         res.status(404).json({ message: 'Not found.' });
//         return;
//     }
//     res.send(user[0]);
// });
router.get('/:user', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    const user = yield db.select({
        id: schema_1.usersTable.id,
        username: schema_1.usersTable.username,
        name: schema_1.usersTable.name,
        about: schema_1.usersTable.about,
        joinedAt: schema_1.usersTable.joinedAt
    })
        .from(schema_1.usersTable)
        .where((0, drizzle_orm_1.eq)(schema_1.usersTable.username, req.params.user));
    if (user.length === 0) {
        res.status(404).json({ message: 'Not allowed.' });
        return;
    }
    const userId = user[0].id;
    const posts = yield db.select({
        slug: schema_1.postsTable.slug,
        header: schema_1.postsTable.header,
        content: schema_1.postsTable.content,
        readingTime: schema_1.postsTable.readingTime,
        createdAt: schema_1.postsTable.createdAt,
        isHidden: schema_1.postsTable.isHidden
    })
        .from(schema_1.postsTable)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.postsTable.authorId, userId), (0, drizzle_orm_1.eq)(schema_1.postsTable.isHidden, false)))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.postsTable.createdAt))
        .limit(3);
    const response = { user, posts };
    res.send(response);
}));
router.get('/me', auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, vercel_postgres_1.drizzle)({ client: postgres_1.sql });
    if (!req.user) {
        res.status(404).json({ message: 'Not allowed.' });
        return;
    }
    const posts = yield db.select({
        slug: schema_1.postsTable.slug,
        header: schema_1.postsTable.header,
        content: schema_1.postsTable.content,
        readingTime: schema_1.postsTable.readingTime,
        createdAt: schema_1.postsTable.createdAt,
        isHidden: schema_1.postsTable.isHidden,
        author: schema_1.usersTable.name
    })
        .from(schema_1.postsTable)
        .innerJoin(schema_1.usersTable, (0, drizzle_orm_1.eq)(schema_1.postsTable.authorId, schema_1.usersTable.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.usersTable.id, req.user.id), (0, drizzle_orm_1.eq)(schema_1.postsTable.isHidden, false)))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.postsTable.createdAt))
        .limit(5);
    if (posts.length === 0) {
        res.status(404).json({ message: 'Not allowed.' });
        return;
    }
    res.send(posts);
}));
exports.default = router;
