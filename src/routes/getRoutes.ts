import { Request, Response, Router } from "express";
import { sql } from '@vercel/postgres';
import { eq, and, ilike, desc, count, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { categoriesTable, followsTable, postCategoriesTable, postsTable, starsTable, usersTable } from '../db/schema';
import { Post, PostsByCategory, Starred, User } from "../types/interfaces";

const router = Router();

router.get('/:user/follows', async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    const userRecord = await db.select({
        id: usersTable.id,
        username: usersTable.username
    })
        .from(usersTable)
        .where(eq(usersTable.username, req.params.user))
        .limit(1);

    if (userRecord.length === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
    }

    const userId = userRecord[0].id;

    const follows = await db.select({
        followingName: usersTable.name
    })
        .from(followsTable)
        .innerJoin(usersTable, eq(usersTable.id, followsTable.followingId))
        .where(eq(followsTable.followerId, userId));

    if (follows.length === 0) {
        res.status(404).json({ message: 'This user has no friends yet.' });
        return;
    }

    res.send(follows);
});

router.get('/:user/posts', async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    const posts: Post[] = await db.select({
        slug: postsTable.slug,
        header: postsTable.header,
        content: postsTable.content,
        readingTime: postsTable.readingTime,
        createdAt: postsTable.createdAt,
        isHidden: postsTable.isHidden,
        author: usersTable.name,
        authorId: usersTable.id
    })
        .from(postsTable)
        .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
        .where(
            eq(usersTable.username, req.params.user),
        );

    if (posts.length === 0) {
        res.status(404).json({ message: 'There is nothing yet.' });
        return;
    }

    res.send(posts);
});

router.get('/:user/posts/:post', async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    const posts: Post[] = await db.select({
        id: postsTable.id,
        slug: postsTable.slug,
        header: postsTable.header,
        content: postsTable.content,
        readingTime: postsTable.readingTime,
        createdAt: postsTable.createdAt,
        updatedAt: postsTable.updatedAt,
        isHidden: postsTable.isHidden,
        author: usersTable.name,
        authorImg: usersTable.image
    })
        .from(postsTable)
        .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
        .where(
            and(
                eq(usersTable.username, req.params.user),
                ilike(postsTable.slug, req.params.post)
            )
        )
        .limit(1)

    if (posts.length === 0) {
        res.status(404).json({ message: 'Not found.' });
        return;
    }

    const post = posts[0];

    const categories = await db.select({
        id: categoriesTable.id,
        category: categoriesTable.category,
        slug: categoriesTable.slug
    })
        .from(categoriesTable)
        .innerJoin(postCategoriesTable, eq(categoriesTable.id, postCategoriesTable.categoryId))
        .where(
            eq(postCategoriesTable.postId, post.id as number)
        )

    let response;

    if (categories.length === 0) {
        response = {
            post
        }
    } else {
        response = {
            post,
            categories
        }
    }

    res.send(response);
});

router.get('/:user/starreds', async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    const starredPosts: Starred[] = await db.select({
        header: postsTable.header,
        readingTime: postsTable.readingTime,
        author: usersTable.name
    })
        .from(postsTable)
        .innerJoin(usersTable, eq(usersTable.username, req.params.user))
        .innerJoin(starsTable, eq(starsTable.userId, usersTable.id))
        .where(
            and(
                eq(starsTable.postId, postsTable.id),
                eq(starsTable.userId, usersTable.id)
            )
        )

    if (starredPosts.length === 0) {
        res.status(404).json({ message: 'There is nothing yet.' });
        return;
    }

    res.send(starredPosts);
});

router.get('/:user/categories', async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    const user = await db.select({
        id: usersTable.id
    })
        .from(usersTable)
        .where(eq(usersTable.username, req.params.user));

    const userId = user[0].id;

    const categories = await db.select({
        id: categoriesTable.id as typeof categoriesTable.id,
        category: categoriesTable.category as typeof categoriesTable.category,
        postsCount: count(eq(postsTable.authorId, userId)),
        slug: categoriesTable.slug as typeof categoriesTable.slug
    })
        .from(categoriesTable)
        .innerJoin(postCategoriesTable, eq(postCategoriesTable.categoryId, categoriesTable.id))
        .innerJoin(postsTable, eq(postCategoriesTable.postId, postsTable.id))
        .where(
            eq(postsTable.authorId, userId)
        )
        .groupBy(categoriesTable.id)

    if (categories.length === 0) {
        res.json({ message: 'Not found.' });
        return;
    }

    res.send(categories);
});

router.get('/:user/categories/category', async (req: Request, res: Response) => {
    const categoryIds = Array.isArray(req.query.id) ? req.query.id.map(Number) : [Number(req.query.id)];

    if (categoryIds.some(isNaN)) {
        res.status(400).json({ message: "Invalid category ID(s)." });
        return;
    }

    const db = drizzle({ client: sql });

    const categories: PostsByCategory[] = await db.select({
        slug: postsTable.slug,
        header: postsTable.header,
        readingTime: postsTable.readingTime,
        createdAt: postsTable.createdAt
    })
        .from(postsTable)
        .innerJoin(postCategoriesTable, eq(postCategoriesTable.postId, postsTable.id))
        .innerJoin(categoriesTable, eq(postCategoriesTable.categoryId, categoriesTable.id))
        .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
        .where(
            and(
                eq(usersTable.username, req.params.user),
                inArray(categoriesTable.id, categoryIds)
            )
        );

    if (categories.length === 0) {
        res.status(404).json({ message: 'There is nothing yet.' });
        return;
    }

    res.send(categories);
});

router.get('/:user', async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    const user: User[] = await db.select({
        id: usersTable.id,
        username: usersTable.username,
        name: usersTable.name,
        about: usersTable.about,
        joinedAt: usersTable.joinedAt,
        image: usersTable.image
    })
        .from(usersTable)
        .where(eq(usersTable.username, req.params.user));

    if (user.length === 0) {
        res.status(404).json({ message: 'Not allowed.' });
        return;
    }

    const userId = user[0].id;

    const posts: Post[] = await db.select({
        slug: postsTable.slug,
        header: postsTable.header,
        content: postsTable.content,
        readingTime: postsTable.readingTime,
        createdAt: postsTable.createdAt,
        isHidden: postsTable.isHidden
    })
        .from(postsTable)
        .where(
            and(
                eq(postsTable.authorId, userId as number),
                eq(postsTable.isHidden, false)
            ))
        .orderBy(desc(postsTable.createdAt))
        .limit(3);

    const response: Object = { user, posts }

    res.send(response);
});

router.get('/', async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    const posts = await db.select({
        id: postsTable.id,
        slug: postsTable.slug,
        header: postsTable.header,
        content: postsTable.content,
        readingTime: postsTable.readingTime,
        createdAt: postsTable.createdAt,
        userId: usersTable.id,
        author: usersTable.name,
        username: usersTable.username,
        authorImg: usersTable.image
    })
        .from(postsTable)
        .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
        .where(eq(postsTable.isHidden, false))
        .orderBy(desc(postsTable.id))
        .limit(10);

    res.send(posts);
});

export default router;