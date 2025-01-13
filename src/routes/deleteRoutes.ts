import { Router, Response, Request } from "express";
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from "@vercel/postgres";
import { categoriesTable, postCategoriesTable, postsTable, usersTable } from "../db/schema";
import { and, eq } from "drizzle-orm";
import auth from "../middlewares/auth";

const router = Router();

router.delete('/posts/:post', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user) {
        res.status(401).send('Invalid user.');
        return;
    }

    const post = await db.delete(postsTable)
        .where(
            and(
                eq(postsTable.slug, req.params.post),
                eq(postsTable.authorId, req.user?.id)
            )
        )
        .returning({ postId: postsTable.id });

    if (!post || post.length === 0) {
        res.status(404).send('Post not found or you are not authorized.');
        return;
    }

    res.send('Post deleted successfuly!');
});

router.delete('/categories/:category', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user) {
        res.status(401).send('Invalid user.');
        return;
    }

    const getCategory = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.slug, req.params.category));

    if (getCategory.length === 0) {
        res.status(404).send('Category not found.');
        return;
    }

    const categoryId = getCategory[0].id;

    const categoryPosts = await db.delete(postCategoriesTable)
        .where(eq(postCategoriesTable.categoryId, categoryId))
        .returning({ postIds: postCategoriesTable.postId });

    for (const item of categoryPosts) {
        const postId = item.postIds;
        await db.delete(postsTable).where(eq(postsTable.id, postId));
    }

    await db.delete(categoriesTable)
        .where(
            and(
                eq(categoriesTable.id, categoryId),
                eq(categoriesTable.userId, req.user.id)
            )
        );

    res.send('Success!');
});

router.delete('/user', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user) {
        res.status(401).send('Invalid user.');
        return;
    }

    await db.delete(categoriesTable).where(eq(categoriesTable.userId, req.user.id));
    await db.delete(postsTable).where(eq(postsTable.authorId, req.user.id));
    await db.delete(usersTable).where(eq(usersTable.id, req.user.id));

    res.send('User deleted successfuly!');
});

export default router;