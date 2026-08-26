export interface User {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    isActive: boolean;
    role: 'USER' | 'ADMIN';
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=user.model.d.ts.map