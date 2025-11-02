import { FastifyInstance } from 'fastify';
import { Daos } from '../dao';

const calculateOptimalPayout = (drawerBalance: { [key: number]: number }, amountToPay: number) => {
    const denominations = Object.keys(drawerBalance).map(Number).sort((a, b) => b - a);
    let remaining = amountToPay;
    const payout: { [key: number]: number } = {};

    const totalInDrawer = denominations.reduce((sum, denom) => sum + denom * drawerBalance[denom], 0);
    if (totalInDrawer < amountToPay) {
        throw new Error(`Insufficient funds in drawer. Have ¥${totalInDrawer}, need ¥${amountToPay}.`);
    }

    const tempDrawer = { ...drawerBalance };

    for (const denom of denominations) {
        const countAvailable = tempDrawer[denom] || 0;
        if (countAvailable > 0) {
            const countToUse = Math.min(Math.floor(remaining / denom), countAvailable);
            if (countToUse > 0) {
                payout[denom] = (payout[denom] || 0) + countToUse;
                tempDrawer[denom] -= countToUse;
                remaining -= countToUse * denom;
            }
        }
    }

    if (remaining > 0.001) {
        throw new Error(`Insufficient funds to provide exact payout. Cannot pay remaining ¥${remaining}.`);
    }

    return payout;
};

const getDrawerBalance = async (daos: Daos, instanceId: string) => {
    const entries = await daos.ledger.listLedgerEntriesByPosInstance(instanceId);
    const balance: { [key: number]: number } = {};
    const denominations = [10000, 5000, 2000, 1000, 500, 100, 50, 10, 5, 1];
    denominations.forEach(d => balance[d] = 0);

    const entryMap = new Map(entries.map(e => [e.id, e]));

    for (const entry of entries) {
        if (entry.is_reverted) continue;

        const data = JSON.parse(entry.data);

        if (entry.entry_type === 'deposit') {
            for (const [denom, count] of Object.entries(data.amount)) {
                balance[parseInt(denom)] += count as number;
            }
        } else if (entry.entry_type === 'withdrawal') {
            for (const [denom, count] of Object.entries(data.amount)) {
                balance[parseInt(denom)] -= count as number;
            }
        } else if (entry.entry_type === 'sale') {
            if (data.paidAmount) {
                for (const [denom, count] of Object.entries(data.paidAmount)) {
                    balance[parseInt(denom)] += count as number;
                }
            }
            if (data.changeGiven) {
                for (const [denom, count] of Object.entries(data.changeGiven)) {
                    balance[parseInt(denom)] -= count as number;
                }
            }
        } else if (entry.entry_type === 'reversal') {
            const originalEntry = entryMap.get(data.original_entry_id);
            if (originalEntry) {
                const originalData = JSON.parse(originalEntry.data);
                if (originalEntry.entry_type === 'deposit') {
                    for (const [denom, count] of Object.entries(originalData.amount)) {
                        balance[parseInt(denom)] -= count as number;
                    }
                } else if (originalEntry.entry_type === 'withdrawal') {
                    for (const [denom, count] of Object.entries(originalData.amount)) {
                        balance[parseInt(denom)] += count as number;
                    }
                } else if (originalEntry.entry_type === 'sale') {
                    if (originalData.paidAmount) {
                        for (const [denom, count] of Object.entries(originalData.paidAmount)) {
                            balance[parseInt(denom)] -= count as number;
                        }
                    }
                    if (originalData.changeGiven) {
                        for (const [denom, count] of Object.entries(originalData.changeGiven)) {
                            balance[parseInt(denom)] += count as number;
                        }
                    }
                }
            }
        }
    }
    return balance;
};

export const registerDrawerRoutes = (fastify: FastifyInstance, daos: Daos) => {

    fastify.get('/api/instances/:instanceId/payouts/seller/:sellerName', async (request, reply) => {
        const { instanceId, sellerName } = request.params as { instanceId: string; sellerName: string };
        try {
            const sellerProducts = await daos.products.findProductsBySellerName(instanceId, sellerName);
            const sellerProductMap = new Map<number, { id: number, name: string, price: number }>();
            sellerProducts.forEach(p => sellerProductMap.set(p.id, p));

            const ledgerEntries = await daos.ledger.listLedgerEntriesByPosInstance(instanceId);
            let totalSales = 0;
            for (const entry of ledgerEntries) {
                if (entry.entry_type === 'sale' && !entry.is_reverted) {
                    const data = JSON.parse(entry.data);
                    if (data.products && Array.isArray(data.products)) {
                        for (const productId of data.products) {
                            if (sellerProductMap.has(productId)) {
                                totalSales += sellerProductMap.get(productId)!.price;
                            }
                        }
                    }
                }
            }

            const drawerBalance = await getDrawerBalance(daos, instanceId);
            const payout = calculateOptimalPayout(drawerBalance, totalSales);
            reply.send({ totalAmount: totalSales, suggestedPayout: payout });
        } catch (error: any) {
            fastify.log.error(error);
            reply.code(400).send({ error: error.message });
        }
    });

    fastify.get('/api/instances/:instanceId/payouts/depositor/:personName', async (request, reply) => {
        const { instanceId, personName } = request.params as { instanceId: string; personName: string };
        try {
            const ledgerEntries = await daos.ledger.listLedgerEntriesByPosInstance(instanceId);
            let totalDeposits = 0;
            for (const entry of ledgerEntries) {
                if (entry.entry_type === 'deposit' && !entry.is_reverted) {
                    const data = JSON.parse(entry.data);
                    if (data.person === personName) {
                        totalDeposits += Object.entries(data.amount).reduce((sum, [d, c]) => sum + (parseInt(d) * (c as number)), 0);
                    }
                }
            }

            const drawerBalance = await getDrawerBalance(daos, instanceId);
            const payout = calculateOptimalPayout(drawerBalance, totalDeposits);
            reply.send({ totalAmount: totalDeposits, suggestedPayout: payout });
        } catch (error: any) {
            fastify.log.error(error);
            reply.code(400).send({ error: error.message });
        }
    });
};
