export interface DecodedToken {
    id: number;
    username: string;
}

export interface User {
    id?: number;
    name: string;
    username?: string;
    about?: string | null;
    email?: string;
    password?: string;
    joinedAt?: Date;
    image?: string | null;
};

export interface Post {
    id?: number;
    slug: string;
    header: string;
    content: string;
    readingTime: number;
    createdAt: Date;
    updatedAt?: Date;
    author?: string;
    authorId?: number;
    isHidden: boolean;
}

export interface Message {
    id: number;
    message: string;
    sentAt: Date;
    isSeen: boolean;
    sender: string;
    receiver: string;
    senderId: number;
    receiverId: number;
}

export interface Category {
    userId: number;
    category: string;
    slug: string;
    isHidden: boolean;
}

export interface PostsByCategory {
    slug: string;
    header: string;
    readingTime: number;
    createdAt: Date;
}

export interface Starred {
    header: string;
    readingTime: number;
    author: string;
}