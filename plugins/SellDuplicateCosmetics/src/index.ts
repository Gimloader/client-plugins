let querier: any;
api.rewriter.exposeVar(true, {
    find: /View Steps To Fix`}\)]}\)},(\w{1,3})=new/,
    callback: (found, initial) => {
        querier = found;

        if(!initial) querier.invalidateQueries(["cosmos-owned-cosmetics"]);
    }
});

api.net.modifyFetchResponse("/api/cosmos/owned-cosmetics", (data) => {
    const excess = data.ownedCosmetics.filter((c: any) => c.count > 1);
    if(excess.length === 0) return;

    sellCosmetics(excess);
});

async function sellCosmetics(excess: any[]) {
    const totalToSell = excess.reduce((acc: number, item: any) => acc + (item.count - 1), 0);

    const responses = await Promise.all(excess.map(async (item: any) => {
        return fetch("/api/cosmos/sell", {
            method: "POST",
            body: JSON.stringify({
                cosmeticId: item.cosmetic.id,
                count: item.count - 1
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });
    }));

    const json = await Promise.all(responses.map((res) => res.json()));
    const totalSold = json.reduce((acc: number, item: any) => acc + item.amount, 0);

    api.UI.toast.success(`AutoSell: Sold ${totalToSell} duplicate cosmetic${totalToSell > 1 ? "s" : ""} for ${totalSold} coins`);

    if(!querier) return;
    querier.invalidateQueries(["cosmos-basics"]);
    querier.invalidateQueries(["cosmos-owned-cosmetics"]);
}
