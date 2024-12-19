"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesRelations = exports.starsRelations = exports.followerRelations = exports.commentsRelations = exports.postCategoriesRelations = exports.categoriesRelations = exports.postsRelations = exports.usersRelations = exports.starsTable = exports.followsTable = exports.postCategoriesTable = exports.usersMessagesTable = exports.messagesTable = exports.usersTable = exports.postsTable = exports.categoriesTable = exports.commentsTable = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
exports.commentsTable = (0, pg_core_1.pgTable)('comments', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    text: (0, pg_core_1.text)('text'),
    authorId: (0, pg_core_1.integer)('author_id'),
    postId: (0, pg_core_1.integer)('post_id'),
});
exports.categoriesTable = (0, pg_core_1.pgTable)("categories", {
    id: (0, pg_core_1.serial)().primaryKey(),
    category: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    slug: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    userId: (0, pg_core_1.integer)('user_id').notNull(),
    isHidden: (0, pg_core_1.boolean)('is_hidden').default(false).notNull()
});
exports.postsTable = (0, pg_core_1.pgTable)("posts", {
    id: (0, pg_core_1.serial)().primaryKey(),
    header: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    slug: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    content: (0, pg_core_1.text)().notNull(),
    readingTime: (0, pg_core_1.integer)().notNull(),
    authorId: (0, pg_core_1.integer)('author_id').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    isHidden: (0, pg_core_1.boolean)('is_hidden').default(false).notNull()
});
exports.usersTable = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    username: (0, pg_core_1.varchar)({ length: 255 }).notNull().unique(),
    password: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)({ length: 255 }).notNull().unique(),
    about: (0, pg_core_1.text)(),
    joinedAt: (0, pg_core_1.timestamp)('joined_at').defaultNow().notNull()
});
exports.messagesTable = (0, pg_core_1.pgTable)("messages", {
    id: (0, pg_core_1.serial)().primaryKey(),
    message: (0, pg_core_1.text)(),
    sentAt: (0, pg_core_1.timestamp)('sent_at').defaultNow().notNull()
});
exports.usersMessagesTable = (0, pg_core_1.pgTable)("users_messages", {
    messageId: (0, pg_core_1.integer)('message_id').notNull().references(() => exports.messagesTable.id),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.usersTable.id)
}, (t) => ({
    pk: (0, pg_core_1.primaryKey)({ columns: [t.messageId, t.userId] })
}));
exports.postCategoriesTable = (0, pg_core_1.pgTable)("post_categories", {
    postId: (0, pg_core_1.integer)('post_id').notNull().references(() => exports.postsTable.id),
    categoryId: (0, pg_core_1.integer)('category_id').notNull().references(() => exports.categoriesTable.id)
}, (t) => ({
    pk: (0, pg_core_1.primaryKey)({ columns: [t.postId, t.categoryId] })
}));
exports.followsTable = (0, pg_core_1.pgTable)("followers", {
    followerId: (0, pg_core_1.integer)('follower_id').notNull().references(() => exports.usersTable.id),
    followingId: (0, pg_core_1.integer)('following_id').notNull().references(() => exports.usersTable.id),
}, (t) => ({
    pk: (0, pg_core_1.primaryKey)({ columns: [t.followerId, t.followingId] })
}));
exports.starsTable = (0, pg_core_1.pgTable)("stars", {
    postId: (0, pg_core_1.integer)('post_id').notNull().references(() => exports.postsTable.id),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.usersTable.id)
}, (t) => ({
    pk: (0, pg_core_1.primaryKey)({ columns: [t.postId, t.userId] })
}));
// RELATIONS:
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.usersTable, ({ many }) => ({
    posts: many(exports.postsTable),
    categories: many(exports.categoriesTable),
    follows: many(exports.followsTable),
    stars: many(exports.starsTable)
}));
exports.postsRelations = (0, drizzle_orm_1.relations)(exports.postsTable, ({ one, many }) => ({
    author: one(exports.usersTable, {
        fields: [exports.postsTable.authorId],
        references: [exports.usersTable.id]
    }),
    comments: many(exports.commentsTable),
    postCategories: many(exports.postCategoriesTable),
    stars: many(exports.starsTable)
}));
exports.categoriesRelations = (0, drizzle_orm_1.relations)(exports.categoriesTable, ({ one, many }) => ({
    postCategories: many(exports.postCategoriesTable),
    user: one(exports.usersTable, {
        fields: [exports.categoriesTable.userId],
        references: [exports.usersTable.id]
    })
}));
exports.postCategoriesRelations = (0, drizzle_orm_1.relations)(exports.postCategoriesTable, ({ one }) => ({
    post: one(exports.postsTable, {
        fields: [exports.postCategoriesTable.postId],
        references: [exports.postsTable.id]
    }),
    category: one(exports.categoriesTable, {
        fields: [exports.postCategoriesTable.categoryId],
        references: [exports.categoriesTable.id]
    }),
}));
exports.commentsRelations = (0, drizzle_orm_1.relations)(exports.commentsTable, ({ one }) => ({
    post: one(exports.postsTable, {
        fields: [exports.commentsTable.postId],
        references: [exports.postsTable.id],
    }),
    author: one(exports.usersTable, {
        fields: [exports.commentsTable.authorId],
        references: [exports.usersTable.id]
    })
}));
exports.followerRelations = (0, drizzle_orm_1.relations)(exports.followsTable, ({ one }) => ({
    follower: one(exports.usersTable, {
        fields: [exports.followsTable.followerId],
        references: [exports.usersTable.id]
    }),
    following: one(exports.usersTable, {
        fields: [exports.followsTable.followingId],
        references: [exports.usersTable.id]
    })
}));
exports.starsRelations = (0, drizzle_orm_1.relations)(exports.starsTable, ({ one }) => ({
    post: one(exports.postsTable, {
        fields: [exports.starsTable.postId],
        references: [exports.postsTable.id]
    }),
    user: one(exports.usersTable, {
        fields: [exports.starsTable.userId],
        references: [exports.usersTable.id]
    })
}));
exports.messagesRelations = (0, drizzle_orm_1.relations)(exports.usersMessagesTable, ({ one }) => ({
    message: one(exports.messagesTable, {
        fields: [exports.usersMessagesTable.messageId],
        references: [exports.messagesTable.id]
    }),
    user: one(exports.usersTable, {
        fields: [exports.usersMessagesTable.userId],
        references: [exports.usersTable.id]
    })
}));
