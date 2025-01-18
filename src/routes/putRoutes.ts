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
import generateRandomPath from "../middlewares/randomPath";

const router = Router();

router.put('/:user/category/:category', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).send('Invalid user.');
        return;
    }

    const categoryPath = generateRandomPath(16);

    const updatedCategory = await db.update(categoriesTable)
        .set({
            category: req.body.category,
            slug: req.body.isPrivate ? categoryPath : slugify(req.body.category.toLowerCase()),
            isPrivate: req.body.isPrivate
        })
        .where(
            and(
                eq(categoriesTable.slug, req.params.category),
                eq(categoriesTable.userId, req.user.id)
            )
        )
        .returning({ updatedId: categoriesTable.id })

    // if (updatedCategory.length > 0) {
    //     const categoryId = updatedCategory[0].updatedId;

    //     const posts = await db.select()
    //         .from(postCategoriesTable)
    //         .where(
    //             eq(postCategoriesTable.categoryId, categoryId),
    //         );

    //     for (const post of posts) {
    //         const existingPost = await db.select({ header: postsTable.header })
    //             .from(postsTable)
    //             .where(eq(postsTable.id, post.postId))

    //         for (const p of existingPost) {
    //             const postPath = generateRandomPath(16);
    //             await db.update(postsTable)
    //                 .set({
    //                     isHidden: req.body.isHidden,
    //                     isPrivate: req.body.isPrivate ? true : false,
    //                     slug: req.body.isPrivate ? postPath : slugify(p.header)
    //                 })
    //                 .where(
    //                     eq(postsTable.id, post.postId)
    //                 );
    //         }
    //     }

    // }

    res.send('Category has been updated!');
});

router.put('/:user/post/:post', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).send('Invalid user.');
        return;
    }

    const count = Math.ceil(req.body.content.split(/\s+/).filter(Boolean).length / 300);
    const randomPath = generateRandomPath(16);

    const updatedPost = await db.update(postsTable)
        .set({
            header: req.body.header,
            slug: req.body.isPrivate ? randomPath : slugify(req.body.header.toLowerCase()),
            content: req.body.content,
            readingTime: count < 1 ? 1 : count,
            updatedAt: new Date(),
            isHidden: req.body.isHidden,
            isPrivate: req.body.isPrivate
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