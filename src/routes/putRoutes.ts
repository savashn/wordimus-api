import { Request, Response, Router } from "express";
import { sql } from '@vercel/postgres';
import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { categoriesTable, postCategoriesTable, postsTable, usersTable } from '../db/schema';
import bcrypt from 'bcrypt';
import auth from "../middlewares/auth";
import slugify from "slugify";
import upload, { deleteFromCloudinary } from "../middlewares/upload";
import { User } from "../types/interfaces";

const router = Router();

router.put('/:user/category/:category', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).send('Invalid user.');
        return;
    }

    const updatedPost = await db.update(categoriesTable)
        .set({
            category: req.body.category,
            slug: slugify(req.body.category.toLowerCase()),
            isHidden: req.body.isHidden
        })
        .where(
            and(
                eq(categoriesTable.slug, req.params.category),
                eq(categoriesTable.userId, req.user.id)
            )
        )

    res.send('Category has been updated!');
})

router.put('/:user/post/:post', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).send('Invalid user.');
        return;
    }

    const count = req.body.content.split(/\s+/).filter(Boolean).length / 300;

    const updatedPost = await db.update(postsTable)
        .set({
            header: req.body.header,
            slug: slugify(req.body.header.toLowerCase()),
            content: req.body.content,
            readingTime: count < 1 ? 1 : count,
            updatedAt: new Date(),
            isHidden: req.body.isHidden
        })
        .where(
            and(
                eq(postsTable.slug, req.params.post),
                eq(postsTable.authorId, req.user.id)
            )
        )
        .returning();

    const postId = updatedPost[0].id;

    if (Array.isArray(req.body.categories) && req.body.categories.length > 0) {
        await db.delete(postCategoriesTable)
            .where(eq(postCategoriesTable.postId, postId));

        for (const category of req.body.categories) {
            await db.insert(postCategoriesTable).values({
                postId: postId,
                categoryId: category
            })
        }
    }

    res.send('Post has been updated!');
});

router.put('/change-password', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).send('Invalid user.');
        return;
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    await db.update(usersTable)
        .set({
            password: hashedPassword
        })
        .where(eq(usersTable.id, req.user.id));

    res.send('Your password changed!');
});

router.put('/user', auth, upload, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).send('Invalid user.');
        return;
    }

    const users: User[] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);

    if (!users || users.length === 0) {
        res.status(404).send('User not found.');
        return;
    }

    const user = users[0];

    const image = req.imageUrl || user.image;

    if (req.imageUrl && user.image) {
        await deleteFromCloudinary(user.image);
    }

    await db.update(usersTable)
        .set({
            username: req.body.username,
            name: req.body.name,
            email: req.body.email,
            about: req.body.about,
            image: image
        })
        .where(eq(usersTable.id, req.user.id));

    res.send('Your profile has been updated!');
});

export default router;