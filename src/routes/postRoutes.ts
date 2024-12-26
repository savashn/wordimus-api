import { Request, Response, Router } from "express";
import { sql } from '@vercel/postgres';
import { eq, or } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { categoriesTable, followsTable, messagesTable, postCategoriesTable, postsTable, starsTable, usersTable } from '../db/schema';
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import auth from "../middlewares/auth";
import slugify from "slugify";

const router = Router();

router.post('/follow', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).send('Invalid user.');
        return;
    }

    const follow: typeof followsTable.$inferInsert = {
        followerId: req.user.id,
        followingId: req.body.userId
    }

    await db.insert(followsTable).values(follow);

    res.json('Success!');
})

router.post('/mark-as-starred', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).send('Invalid user.');
        return;
    }

    const star: typeof starsTable.$inferInsert = {
        postId: req.body.postId,
        userId: req.user.id
    }

    await db.insert(starsTable).values(star);

    res.send('Success!')
})

router.post('/new/post', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).send('Invalid user.');
        return;
    }

    const count = Math.ceil(req.body.content.split(/\s+/).filter(Boolean).length / 300);

    const post: typeof postsTable.$inferInsert = {
        header: req.body.header,
        slug: slugify(req.body.header.toLowerCase()),
        content: req.body.content,
        readingTime: count < 1 ? 1 : count,
        authorId: req.user.id
    }

    const newPost = await db.insert(postsTable).values(post).returning();

    if (Array.isArray(req.body.categories) && req.body.categories.length > 0) {
        for (const categoryId of req.body.categories) {
            const category: typeof postCategoriesTable.$inferInsert = {
                postId: newPost[0].id,
                categoryId: categoryId
            };
            await db.insert(postCategoriesTable).values(category);
        }
    }

    res.status(201).send('Post successfully created');

});

router.post('/new/category', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).json({ message: 'Invalid user.' });
        return;
    }

    const category: typeof categoriesTable.$inferInsert = {
        category: req.body.category,
        slug: slugify(req.body.category.toLowerCase()),
        userId: req.user.id
    }

    await db.insert(categoriesTable).values(category);

    res.send('Category has been added!')
});

router.post('/new/message', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user || typeof req.user.id !== 'number') {
        res.status(401).json({ message: 'Invalid user.' });
        return;
    }

    const count = Math.ceil(req.body.message.split(/\s+/).filter(Boolean).length / 300);

    const receiver = await db.select({
        id: usersTable.id
    })
        .from(usersTable)
        .where(eq(usersTable.username, req.body.slug))
        .limit(1)

    if (receiver.length === 0) {
        res.status(404).json({ message: 'Not allowed.' });
        return;
    }

    const receiverId = receiver[0].id

    const newMessage: typeof messagesTable.$inferInsert = {
        message: req.body.message,
        sender: req.user.id,
        receiver: receiverId,
        readingTime: count < 1 ? 1 : count,
    }

    await db.insert(messagesTable).values(newMessage);

    res.send('Message has been sent!');
});

router.post('/signin', async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    const user: Array<typeof usersTable.$inferSelect> = await db.select()
        .from(usersTable)
        .where(
            or(
                eq(usersTable.username, req.body.username),
                eq(usersTable.email, req.body.username)
            )
        )
        .limit(1);

    if (user.length === 0) {
        res.status(404).json({ message: 'User not found.' });
        return;
    }

    const isSuccess = await bcrypt.compare(req.body.password, user[0].password);

    if (!isSuccess) {
        res.status(401).json({ message: 'Invalid password.' });
        return
    }

    const token: string = jwt.sign({ id: user[0].id, username: user[0].username }, process.env.JWT_SECRET!);
    res.send(token);
});

router.post('/signup', async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    const isExisting: Array<typeof usersTable.$inferSelect> = await db.select()
        .from(usersTable)
        .where(
            or(
                eq(usersTable.username, req.body.username),
                eq(usersTable.email, req.body.email)
            )
        )
        .limit(1);

    if (isExisting.length > 0) {
        res.status(500).send("This user is already exist!");
        return;
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user: typeof usersTable.$inferInsert = {
        username: req.body.username,
        password: hashedPassword,
        name: req.body.name,
        email: req.body.email,
    };

    await db.insert(usersTable).values(user);

    res.send('Success!');
});

export default router;