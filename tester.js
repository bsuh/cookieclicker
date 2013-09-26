var savedFns = {
    drawFunction: [],
    special: [],
    specialDrawFunction: [],
    gamePopup: Game.Popup
};

function optimizeLoadHack() {
    for (var i in Game.ObjectsById) {
        savedFns.drawFunction[i] = Game.ObjectsById[i].drawFunction;
        savedFns.special[i] = Game.ObjectsById[i].special;
        savedFns.specialDrawFunction[i] = Game.ObjectsById[i].specialDrawFunction;

        Game.ObjectsById[i].drawFunction = function () {};
        Game.ObjectsById[i].special = null;
        Game.ObjectsById[i].specialDrawFunction = null;
    }
    Game.Popup = function () {};
}

function unoptimizeLoadHack() {
    for (var i in Game.ObjectsById) {
        Game.ObjectsById[i].drawFunction = savedFns.drawFunction[i];
        Game.ObjectsById[i].special = savedFns.special[i];
        Game.ObjectsById[i].specialDrawFunction = savedFns.specialDrawFunction[i];
    }
    Game.Popup = savedFns.gamePopup;
}

function test(strategyFn) {
    var save,
        idealBuy,
        price,
        bestAction,
        timeSpent = 0;

    optimizeLoadHack();
    while (timeSpent < 3600) {
        console.log('Time spent: ' + Beautify(timeSpent));
        save = Game.WriteSave(1);
        bestAction = strategyFn(save);
        console.log(bestAction);

        idealBuy = bestAction.isUpgrade ?
            Game.UpgradesById[bestAction.id] :
            Game.ObjectsById[bestAction.id];

        Game.LoadSave(save);
        price = (idealBuy.price || idealBuy.basePrice);

        if (Game.cookies < price) {
            Game.T = 0;
            Game.Logic();
            Game.Spend(Game.cookiesPs / Game.fps);
            Game.Earn(bestAction.secondsTillPurchase * Game.cookiesPs);
            timeSpent += bestAction.secondsTillPurchase;
        }
        idealBuy.buy();
    }
    unoptimizeLoadHack();

    Game.CalculateGains();
    console.log('Final CPS @ ' + Beautify(timeSpent) + ': ' + Game.cookiesPs);
}
