import { relations } from "drizzle-orm";
import { integer, pgTable, varchar, text, serial, primaryKey, timestamp, boolean } from "drizzle-orm/pg-core";

export const commentsTable = pgTable('comments', {
    id: serial('id').primaryKey(),
    text: text('text'),
    authorId: integer('author_id'),
    postId: integer('post_id'),
});

export const categoriesTable = pgTable("categories", {
    id: serial().primaryKey(),
    category: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    userId: integer('user_id').notNull(),
    isPrivate: boolean('is_private').default(false).notNull()
});

export const postsTable = pgTable("posts", {
    id: serial().primaryKey(),
    header: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    content: text().notNull(),
    readingTime: integer().notNull(),
    authorId: integer('author_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    isHidden: boolean('is_hidden').default(false).notNull(),
    isPrivate: boolean('is_private').default(false).notNull()
});

export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    username: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    about: text(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    image: text()
});

export const messagesTable = pgTable("messages", {
    id: serial().primaryKey(),
    message: text().notNull(),
    sentAt: timestamp('sent_at').defaultNow().notNull(),
    isSeen: boolean().default(false).notNull(),
    sender: integer('sender').notNull().references(() => usersTable.id),
    receiver: integer('receiver').notNull().references(() => usersTable.id),
    readingTime: integer().notNull()
});

export const postCategoriesTable = pgTable("post_categories", {
    postId: integer('post_id').notNull().references(() => postsTable.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id').notNull().references(() => categoriesTable.id, { onDelete: 'cascade' })
},
    (t) => ({
        pk: primaryKey({ columns: [t.postId, t.categoryId] })
    })
);

export const followsTable = pgTable("followers", {
    followerId: integer('follower_id').notNull().references(() => usersTable.id),
    followingId: integer('following_id').notNull().references(() => usersTable.id),
},
    (t) => ({
        pk: primaryKey({ columns: [t.followerId, t.followingId] })
    })
);

export const starsTable = pgTable("stars", {
    postId: integer('post_id').notNull().references(() => postsTable.id),
    userId: integer('user_id').notNull().references(() => usersTable.id)
},
    (t) => ({
        pk: primaryKey({ columns: [t.postId, t.userId] })
    })
);


// RELATIONS:

export const usersRelations = relations(usersTable, ({ many }) => ({
    posts: many(postsTable),
    categories: many(categoriesTable),
    follows: many(followsTable),
    stars: many(starsTable),
}));

export const postsRelations = relations(postsTable, ({ one, many }) => ({
    author: one(usersTable, {
        fields: [postsTable.authorId],
        references: [usersTable.id]
    }),
    comments: many(commentsTable),
    postCategories: many(postCategoriesTable),
    stars: many(starsTable)
}));

export const categoriesRelations = relations(categoriesTable, ({ one, many }) => ({
    postCategories: many(postCategoriesTable),
    user: one(usersTable, {
        fields: [categoriesTable.userId],
        references: [usersTable.id]
    })
}));

export const postCategoriesRelations = relations(postCategoriesTable, ({ one }) => ({
    post: one(postsTable, {
        fields: [postCategoriesTable.postId],
        references: [postsTable.id]
    }),
    category: one(categoriesTable, {
        fields: [postCategoriesTable.categoryId],
        references: [categoriesTable.id]
    }),
}));

export const commentsRelations = relations(commentsTable, ({ one }) => ({
    post: one(postsTable, {
        fields: [commentsTable.postId],
        references: [postsTable.id],
    }),
    author: one(usersTable, {
        fields: [commentsTable.authorId],
        references: [usersTable.id]
    })
}));

export const followerRelations = relations(followsTable, ({ one }) => ({
    follower: one(usersTable, {
        fields: [followsTable.followerId],
        references: [usersTable.id]
    }),
    following: one(usersTable, {
        fields: [followsTable.followingId],
        references: [usersTable.id]
    })
}));

export const starsRelations = relations(starsTable, ({ one }) => ({
    post: one(postsTable, {
        fields: [starsTable.postId],
        references: [postsTable.id]
    }),
    user: one(usersTable, {
        fields: [starsTable.userId],
        references: [usersTable.id]
    })
}));