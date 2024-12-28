import { Request, Response, Router } from "express";
import { sql } from '@vercel/postgres';
import { eq, and, desc, or } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { categoriesTable, messagesTable, postsTable, usersTable } from '../db/schema';
import { Message } from "../types/interfaces";
import auth from "../middlewares/auth";
import { alias } from "drizzle-orm/pg-core";

const router = Router();

router.get('/edit/post/:post', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user) {
        res.status(404).send('Not allowed.');
        return;
    }

    const post = await db
        .select()
        .from(postsTable)
        .where(
            and(
                eq(postsTable.authorId, req.user.id),
                eq(postsTable.slug, req.params.post)
            )
        )
        .limit(1)

    const categories = await db.select()
        .from(categoriesTable)
        .where(
            eq(categoriesTable.userId, req.user.id)
        )

    const response = {
        post: post[0],
        categories
    }

    res.send(response);
});

router.get('/edit/category/:category', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user) {
        res.status(404).send('Not allowed.');
        return;
    }

    const category = await db
        .select()
        .from(categoriesTable)
        .where(
            and(
                eq(categoriesTable.userId, req.user.id),
                eq(categoriesTable.slug, req.params.category)
            )
        )
        .limit(1)

    res.send(category[0]);
});

router.get('/user', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user) {
        res.status(404).send('Not allowed.');
        return;
    }

    const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);

    if (!user || user.length === 0) {
        res.status(404).send('Not found.');
        return;
    }

    res.send(user[0]);
});

router.get('/categories', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user) {
        res.status(404).send('Not allowed.');
        return;
    }

    const categories = await db.select({
        id: categoriesTable.id,
        category: categoriesTable.category
    })
        .from(categoriesTable)
        .where(eq(categoriesTable.userId, req.user.id))

    res.send(categories);
});

router.get('/messages/w/:user', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user) {
        res.status(404).send('Not allowed.');
        return;
    }

    const targetUserName = req.params.user;

    const targetUser = await db.select({
        id: usersTable.id,
        name: usersTable.name,
        image: usersTable.image
    })
        .from(usersTable)
        .where(eq(usersTable.username, targetUserName))
        .limit(1);

    if (targetUser.length === 0) {
        res.status(404).send('User not found');
        return;
    }

    const targetUserId: number = targetUser[0].id;

    const messages = await db.select({
        id: messagesTable.id,
        senderId: messagesTable.sender,
        receiverId: messagesTable.receiver,
        message: messagesTable.message,
        sentAt: messagesTable.sentAt,
        isSeen: messagesTable.isSeen,
    })
        .from(messagesTable)
        .where(
            or(
                and(
                    eq(messagesTable.receiver, targetUserId),
                    eq(messagesTable.sender, req.user.id)
                ),
                and(
                    eq(messagesTable.receiver, req.user.id),
                    eq(messagesTable.sender, targetUserId)
                )
            )
        )
        .orderBy(desc(messagesTable.sentAt))
        .limit(50);

    if (messages.length === 0) {
        res.status(404).send('No messages found');
        return;
    }

    const response = {
        user: targetUser[0],
        messages: messages
    }

    res.send(response);
});

router.get('/messages', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user) {
        res.status(404).send('Not allowed.');
        return;
    }

    const senderUser = alias(usersTable, 'senderUser');
    const receiverUser = alias(usersTable, 'receiverUser');

    const messages = await db
        .select({
            id: messagesTable.id,
            sender: senderUser.name,
            senderSlug: senderUser.username,
            senderImg: senderUser.image,
            senderId: senderUser.id,
            receiver: receiverUser.name,
            receiverSlug: receiverUser.username,
            receiverImg: receiverUser.image,
            receiverId: receiverUser.id,
            isSeen: messagesTable.isSeen,
            readingTime: messagesTable.readingTime
        })
        .from(messagesTable)
        .innerJoin(senderUser, eq(messagesTable.sender, senderUser.id))
        .innerJoin(receiverUser, eq(messagesTable.receiver, receiverUser.id))
        .where(
            or(
                eq(messagesTable.receiver, req.user.id),
                eq(messagesTable.sender, req.user.id)
            )
        )
        .orderBy(desc(messagesTable.sentAt))
        .limit(50);

    const news = messages.filter((msg) => req.user && msg.receiverId === req.user.id && msg.isSeen === false);

    const senderIds = news.map((msg) => msg.senderId)

    const response = {
        messages,
        senderIds
    }

    res.send(response);
});

router.get('/messages/:messageId', auth, async (req: Request, res: Response) => {
    const db = drizzle({ client: sql });

    if (!req.user) {
        res.status(404).send('Not allowed.');
        return;
    }

    const senderUser = alias(usersTable, 'senderUser');
    const receiverUser = alias(usersTable, 'receiverUser');

    const messages = await db.select({
        id: messagesTable.id,
        message: messagesTable.message,
        sentAt: messagesTable.sentAt,
        isSeen: messagesTable.isSeen,
        sender: senderUser.name,
        receiver: receiverUser.name,
        senderId: senderUser.id,
        receiverId: receiverUser.id
    })
        .from(messagesTable)
        .innerJoin(senderUser, eq(messagesTable.sender, senderUser.id))
        .innerJoin(receiverUser, eq(messagesTable.receiver, receiverUser.id))
        .where(
            and(
                eq(messagesTable.id, Number(req.params.messageId)),
                or(
                    eq(messagesTable.sender, req.user.id),
                    eq(messagesTable.receiver, req.user.id)
                )
            )
        )
        .limit(1)

    const message: Message = messages[0];

    if (req.user.id === message.receiverId) {
        await db.update(messagesTable)
            .set({
                isSeen: true
            })
            .where(
                eq(messagesTable.id, message.id)
            )
    }

    res.send(message);
});



export default router;