export declare function trySpend(userId: string, amount: number): Promise<{
    success: boolean;
    reason: string;
    balance: string;
} | {
    success: boolean;
    balance: string;
    reason?: never;
}>;
//# sourceMappingURL=trySpend.d.ts.map