import { FastifyInstance } from 'fastify';
import { Daos } from '../dao';
import { calculateBalance, DENOMINATIONS } from '../utils.js';

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
    const entries = await daos.ledger.listLedgerEntriesByPosInstance(instanceId);;
    return calculateBalance(entries, DENOMINATIONS);
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
                    for (const productId of entry.data.products) {
                        if (sellerProductMap.has(productId)) {
                            totalSales += sellerProductMap.get(productId)!.price;
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
                    if (entry.data.person === personName) {
                        totalDeposits += Object.entries(entry.data.amount).reduce((sum, [d, c]) => sum + (parseInt(d) * (c as number)), 0);
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
